import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';

const DEV_SECRET = 'dev-only-secret-change-me';

function resolveSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;

  // в проде дефолтный секрет означал бы, что токены подделает кто угодно
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET обязателен в production');
  }
  new Logger('AuthModule').warn(
    'JWT_SECRET не задан — используется dev-секрет',
  );
  return DEV_SECRET;
}

@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveSecret(config),
        signOptions: {
          expiresIn: Number(
            config.get<string>('SESSION_TTL_SECONDS') ?? 60 * 60 * 24 * 7,
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: SessionGuard }],
  exports: [AuthService],
})
export class AuthModule {}
