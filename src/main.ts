// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);


  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    credentials: true,
  });

  
  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();