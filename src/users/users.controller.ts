import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';


@Controller('users')
//add auth gaurd here -todo
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('points')
  getPoints(@Request() req) {
    return this.usersService.getPoints(req.userId);
  }
}