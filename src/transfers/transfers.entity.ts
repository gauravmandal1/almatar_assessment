export enum TransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export class Transfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  points: number;
  status: TransferStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}