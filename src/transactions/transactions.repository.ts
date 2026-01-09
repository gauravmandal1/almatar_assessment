// src/transactions/repositories/transaction.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Transaction, TransactionType } from './transactions.entity';
import { DATABASE_POOL } from '../db/db.module';

@Injectable()
export class TransactionRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async create(
    transaction: Partial<Transaction>,
    client?: PoolClient
  ): Promise<Transaction> {
    const queryRunner = client || this.pool;
    const result = await queryRunner.query(
      `INSERT INTO transactions(id, user_id, type, points, created_at)
       VALUES($1, $2, $3, $4, NOW())
       RETURNING *`,
      [transaction.id, transaction.userId, transaction.type, transaction.points]
    );
    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const result = await this.pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async findByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number
  ): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }
}