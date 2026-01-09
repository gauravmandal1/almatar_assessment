import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTransferDto } from './transfers.dto';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTransfer(@Request() req, @Body() dto: CreateTransferDto) {
    return this.transfersService.createTransfer(req.userId, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmTransfer(@Request() req, @Param('id') id: string) {
    return this.transfersService.confirmTransfer(req.userId, id);
  }
}