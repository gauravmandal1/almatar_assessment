// src/users/repositories/user.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { User } from './users.entity';
import { DATABASE_POOL } from '../db/db.module';

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_POOL) private pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(user: Partial<User>): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users(id, name, email, password, points, created_at, updated_at) 
       VALUES($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING *`,
      [user.id, user.name, user.email, user.password, user.points]
    );
    return result.rows[0];
  }

  async updatePoints(userId: string, points: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET points = $1, updated_at = NOW() WHERE id = $2',
      [points, userId]
    );
  }

  async incrementPoints(userId: string, points: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET points = points + $1, updated_at = NOW() WHERE id = $2',
      [points, userId]
    );
  }

  async decrementPoints(userId: string, points: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET points = points - $1, updated_at = NOW() WHERE id = $2',
      [points, userId]
    );
  }
}