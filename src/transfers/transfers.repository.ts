// src/transfers/repositories/transfer.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Transfer, TransferStatus } from './transfers.entity';
import { DATABASE_POOL } from '../db/db.module';

@Injectable()
export class TransferRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async findById(id: string): Promise<Transfer | null> {
    const result = await this.pool.query(
      'SELECT * FROM transfers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(transfer: Partial<Transfer>): Promise<Transfer> {
    const result = await this.pool.query(
      `INSERT INTO transfers(id, from_user_id, to_user_id, points, status, expires_at, created_at, updated_at)
       VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        transfer.id,
        transfer.fromUserId,
        transfer.toUserId,
        transfer.points,
        transfer.status,
        transfer.expiresAt,
      ]
    );
    return result.rows[0];
  }

  async updateStatus(id: string, status: TransferStatus): Promise<void> {
    await this.pool.query(
      'UPDATE transfers SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  }

  async expirePendingTransfers(): Promise<number> {
    const result = await this.pool.query(
      `UPDATE transfers 
       SET status = $1, updated_at = NOW() 
       WHERE status = $2 AND expires_at < NOW()`,
      [TransferStatus.EXPIRED, TransferStatus.PENDING]
    );
    return result.rowCount || 0;
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async findByIdForUpdate(
    id: string,
    client: PoolClient
  ): Promise<Transfer | null> {
    const result = await client.query(
      'SELECT * FROM transfers WHERE id = $1 FOR UPDATE',
      [id]
    );
    return result.rows[0] || null;
  }
}