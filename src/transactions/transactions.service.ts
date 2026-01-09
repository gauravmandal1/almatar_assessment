import { Injectable } from '@nestjs/common';
import { TransactionRepository } from './transactions.repository';
import { Transaction } from './transactions.entity';

@Injectable()
export class TransactionsService {
  constructor(private transactionRepository: TransactionRepository) {}

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByUserId(userId);
  }

  async getTransactionsPaginated(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    return this.transactionRepository.findByUserIdPaginated(
      userId,
      limit,
      offset
    );
  }
}