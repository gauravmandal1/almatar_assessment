// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../users/users.repository';
import { RegisterDto, SignInDto, AuthResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly INITIAL_POINTS = 500;
  private readonly SALT_ROUNDS = 10;

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<Omit<AuthResponseDto['user'], 'points'> & { points: number }> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const userId = uuidv4();

    const user = await this.userRepository.create({
      id: userId,
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      points: this.INITIAL_POINTS,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
    };
  }

  async signIn(dto: SignInDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({ sub: user.id });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findById(userId);
  }
}