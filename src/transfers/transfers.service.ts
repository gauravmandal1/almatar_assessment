// src/transfers/transfers.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PoolClient } from 'pg';
import { TransferRepository } from './transfers.repository';
import { UserRepository } from '../users/users.repository';
import { TransactionRepository } from '../transactions/transactions.repository';
import { TransferStatus } from './transfers.entity';
import { TransactionType } from '../transactions/transactions.entity';
import { CreateTransferDto, TransferResponseDto } from './transfers.dto';

@Injectable()
export class TransfersService {
  private readonly TRANSFER_EXPIRY_MINUTES = 10;

  constructor(
    private transferRepository: TransferRepository,
    private userRepository: UserRepository,
    private transactionRepository: TransactionRepository
  ) {}

  async createTransfer(
    fromUserId: string,
    dto: CreateTransferDto
  ): Promise<TransferResponseDto> {
    const fromUser = await this.userRepository.findById(fromUserId);
    if (!fromUser) {
      throw new NotFoundException('User not found');
    }

    const toUser = await this.userRepository.findByEmail(dto.toEmail);
    if (!toUser) {
      throw new BadRequestException('Recipient not found');
    }

    if (fromUser.id === toUser.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    if (fromUser.points < dto.points) {
      throw new BadRequestException('Insufficient points');
    }

    const transferId = uuidv4();
    const expiresAt = new Date(
      Date.now() + this.TRANSFER_EXPIRY_MINUTES * 60 * 1000
    );

    const transfer = await this.transferRepository.create({
      id: transferId,
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      points: dto.points,
      status: TransferStatus.PENDING,
      expiresAt,
    });

    return {
      id: transfer.id,
      status: transfer.status,
      expiresAt: transfer.expiresAt,
    };
  }

  async confirmTransfer(
    userId: string,
    transferId: string
  ): Promise<TransferResponseDto> {
    const transfer = await this.transferRepository.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.fromUserId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer is ${transfer.status}`);
    }

    if (new Date() > new Date(transfer.expiresAt)) {
      await this.transferRepository.updateStatus(
        transferId,
        TransferStatus.EXPIRED
      );
      throw new BadRequestException('Transfer expired');
    }

    // Execute transfer in transaction
    const client = await this.transferRepository.getClient();
    try {
      await client.query('BEGIN');

      await this.executeTransfer(transfer, client);

      await client.query('COMMIT');

      return {
        id: transfer.id,
        status: TransferStatus.COMPLETED,
        expiresAt: transfer.expiresAt,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async executeTransfer(transfer: any, client: PoolClient) {
    const fromUserResult = await client.query(
      'SELECT points FROM users WHERE id = $1 FOR UPDATE',
      [transfer.fromUserId]
    );

    const fromUser = fromUserResult.rows[0];
    if (!fromUser || fromUser.points < transfer.points) {
      throw new BadRequestException('Insufficient points');
    }

    // Update balances
    await client.query(
      'UPDATE users SET points = points - $1, updated_at = NOW() WHERE id = $2',
      [transfer.points, transfer.fromUserId]
    );

    await client.query(
      'UPDATE users SET points = points + $1, updated_at = NOW() WHERE id = $2',
      [transfer.points, transfer.toUserId]
    );

    // Update transfer status
    await client.query(
      `UPDATE transfers SET status = $1, updated_at = NOW() WHERE id = $2`,
      [TransferStatus.COMPLETED, transfer.id]
    );

    // Create transaction records
    await this.transactionRepository.create(
      {
        id: uuidv4(),
        userId: transfer.fromUserId,
        type: TransactionType.DEBIT,
        points: transfer.points,
      },
      client
    );

    await this.transactionRepository.create(
      {
        id: uuidv4(),
        userId: transfer.toUserId,
        type: TransactionType.CREDIT,
        points: transfer.points,
      },
      client
    );
  }

  async expirePendingTransfers(): Promise<number> {
    return this.transferRepository.expirePendingTransfers();
  }
}