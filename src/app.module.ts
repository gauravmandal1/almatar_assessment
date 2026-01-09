// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransfersModule } from './transfers/transfers.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TransfersModule,
    TransactionsModule,
  ],
})
export class AppModule {}