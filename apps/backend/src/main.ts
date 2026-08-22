import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // сессия лежит в httpOnly-куке, её читает SessionGuard
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      // всё, что не описано в DTO, отбрасывается и приводит к 400
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
