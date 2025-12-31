import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsEmail, IsString, MinLength, IsNumber, Min } from 'class-validator';
import { AppService } from './app.service';

class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class TransferDto {
  @IsEmail()
  toEmail: string;

  @IsNumber()
  @Min(1)
  points: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.appService.register(dto.name, dto.email, dto.password);
  }

  @Post('auth/signin')
  signIn(@Body() dto: SignInDto) {
    return this.appService.signIn(dto.email, dto.password);
  }

  @Get('users/points')
  @UseGuards(AuthGuard)
  getPoints(@Request() req) {
    return this.appService.getPoints(req.userId);
  }

  @Post('transfers')
  @UseGuards(AuthGuard)
  createTransfer(@Request() req, @Body() dto: TransferDto) {
    return this.appService.createTransfer(req.userId, dto.toEmail, dto.points);
  }

  @Post('transfers/:id/confirm')
  @UseGuards(AuthGuard)
  confirmTransfer(@Request() req, @Param('id') id: string) {
    return this.appService.confirmTransfer(req.userId, id);
  }

  @Get('transactions')
  @UseGuards(AuthGuard)
  getTransactions(@Request() req) {
    return this.appService.getTransactions(req.userId);
  }
}