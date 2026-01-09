import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  getTransactions(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    return this.transactionsService.getTransactionsPaginated(
      req.userId,
      parsedLimit,
      parsedOffset
    );
  }
}