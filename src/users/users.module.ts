// src/users/users.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UserRepository, UsersService],
})
export class UsersModule {}