// src/transfers/dto/transfer.dto.ts
import { IsEmail, IsNumber, Min, IsUUID } from 'class-validator';
import { TransferStatus } from './transfers.entity';

export class CreateTransferDto {
  @IsEmail()
  toEmail: string;

  @IsNumber()
  @Min(1)
  points: number;
}

export class TransferResponseDto {
  id: string;
  status: TransferStatus;
  expiresAt: Date;
}

export class ConfirmTransferDto {
  @IsUUID()
  transferId: string;
}