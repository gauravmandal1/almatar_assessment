export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export class Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  points: number;
  createdAt: Date;
}