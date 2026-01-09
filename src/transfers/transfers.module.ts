// src/transfers/transfers.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
// import { TransfersCron } from './transfers.cron';
import { TransferRepository } from './transfers.repository';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [UsersModule, TransactionsModule,  AuthModule],
  controllers: [TransfersController],
  providers: [TransfersService, TransferRepository],
  exports: [TransfersService],
})
export class TransfersModule {}