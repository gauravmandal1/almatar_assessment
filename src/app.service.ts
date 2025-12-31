import { Injectable, BadRequestException, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

@Injectable()
export class AppService {
  private pool: Pool;

  constructor(private jwtService: JwtService) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL, 
    });

    // Expire pending transfers every minute
    setInterval(async () => {
      await this.pool.query(
        `UPDATE transfers SET status='expired' 
         WHERE status='pending' AND expires_at < NOW()`
      );
    }, 60000);
  }

  async register(name: string, email: string, password: string) {
    const existing = await this.pool.query(`SELECT id FROM users WHERE email=$1`, [email]);
    if (existing.rows.length) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await this.pool.query(
      `INSERT INTO users(id, name, email, password, points) VALUES($1,$2,$3,$4,$5)`,
      [id, name, email, hashedPassword, 500]
    );

    return { id, name, email, points: 500 };
  }

  async signIn(email: string, password: string) {
    const res = await this.pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
    const user = res.rows[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync({ sub: user.id });
    return { token, user: { id: user.id, name: user.name, email: user.email, points: user.points } };
  }

  async getPoints(userId: string) {
    const res = await this.pool.query(`SELECT points FROM users WHERE id=$1`, [userId]);
    const user = res.rows[0];
    if (!user) throw new NotFoundException('User not found');
    return { points: user.points };
  }

  async createTransfer(fromUserId: string, toEmail: string, points: number) {
    const fromRes = await this.pool.query(`SELECT id, points FROM users WHERE id=$1`, [fromUserId]);
    const fromUser = fromRes.rows[0];
    if (!fromUser) throw new NotFoundException('User not found');

    const toRes = await this.pool.query(`SELECT id FROM users WHERE email=$1`, [toEmail]);
    const toUser = toRes.rows[0];
    if (!toUser) throw new BadRequestException('Recipient not found');

    if (fromUser.id === toUser.id) throw new BadRequestException('Cannot transfer to yourself');
    if (fromUser.points < points) throw new BadRequestException('Insufficient points');

    const transferId = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.pool.query(
      `INSERT INTO transfers(id, from_user_id, to_user_id, points, status, expires_at)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [transferId, fromUserId, toUser.id, points, 'pending', expiresAt]
    );

    return { id: transferId, status: 'pending', expiresAt };
  }

  async confirmTransfer(userId: string, transferId: string) {
    const res = await this.pool.query(`SELECT * FROM transfers WHERE id=$1`, [transferId]);
    const transfer = res.rows[0];
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.from_user_id !== userId) throw new BadRequestException('Not authorized');
    if (transfer.status !== 'pending') throw new BadRequestException(`Transfer is ${transfer.status}`);
    if (new Date() > new Date(transfer.expires_at)) {
      await this.pool.query(`UPDATE transfers SET status='expired' WHERE id=$1`, [transferId]);
      throw new BadRequestException('Transfer expired');
    }

    // Transaction block to prevent race conditions
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const fromRes = await client.query(`SELECT points FROM users WHERE id=$1 FOR UPDATE`, [transfer.from_user_id]);
      const fromUser = fromRes.rows[0];
      if (!fromUser || fromUser.points < transfer.points) {
        throw new BadRequestException('Insufficient points');
      }

      await client.query(`UPDATE users SET points = points - $1 WHERE id=$2`, [transfer.points, transfer.from_user_id]);
      await client.query(`UPDATE users SET points = points + $1 WHERE id=$2`, [transfer.points, transfer.to_user_id]);
      await client.query(`UPDATE transfers SET status='completed' WHERE id=$1`, [transferId]);

      await client.query(
        `INSERT INTO transactions(id, user_id, type, points) VALUES($1,$2,$3,$4)`,
        [uuidv4(), transfer.from_user_id, 'debit', transfer.points]
      );
      await client.query(
        `INSERT INTO transactions(id, user_id, type, points) VALUES($1,$2,$3,$4)`,
        [uuidv4(), transfer.to_user_id, 'credit', transfer.points]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return { id: transferId, status: 'completed' };
  }

  async getTransactions(userId: string) {
    const res = await this.pool.query(`SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC`, [userId]);
    return res.rows;
  }
}
