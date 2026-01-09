// src/auth/dto/auth.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    points: number;
  };
}