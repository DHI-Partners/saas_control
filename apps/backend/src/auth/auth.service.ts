import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import {
  clientPublicSelect,
  type PublicClient,
} from '../clients/client.select';
import { isUniqueViolation } from '../common/prisma-errors';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Хэш несуществующего пароля: сравнение с ним делает вход по незнакомой почте
 * таким же медленным, как по знакомой, чтобы по времени ответа нельзя было
 * узнать, зарегистрирован ли адрес.
 */
const DUMMY_HASH =
  '$2b$12$DPtaq3N3fKPtZ/9PNcZ39.fLq/J1xlVMOqZjrBH1JhFhfEjLRb8Xi';

export type Session = { client: PublicClient; token: string; maxAgeMs: number };

@Injectable()
export class AuthService {
  private readonly sessionTtlSeconds: number;
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.sessionTtlSeconds = Number(
      config.get<string>('SESSION_TTL_SECONDS') ?? 60 * 60 * 24 * 7,
    );
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3001';
  }

  async register(dto: RegisterDto): Promise<Session> {
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    let client: PublicClient;
    try {
      client = await this.prisma.client.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name || null,
        },
        select: clientPublicSelect,
      });
    } catch (error) {
      if (isUniqueViolation(error, 'email')) {
        throw new ConflictException(
          'Клиент с такой почтой уже зарегистрирован',
        );
      }
      throw error;
    }

    await this.sendVerificationLink(client);
    return this.startSession(client);
  }

  async login(dto: LoginDto): Promise<Session> {
    const found = await this.prisma.client.findUnique({
      where: { email: dto.email },
      select: { ...clientPublicSelect, passwordHash: true },
    });

    if (!found) {
      await compare(dto.password, DUMMY_HASH);
      throw new UnauthorizedException('Неверная почта или пароль');
    }

    const { passwordHash, ...client } = found;
    if (!(await compare(dto.password, passwordHash))) {
      throw new UnauthorizedException('Неверная почта или пароль');
    }

    return this.startSession(client);
  }

  /**
   * Подтверждение почты по токену из письма. В базе лежит только sha256 от
   * токена, поэтому дамп таблицы не даёт возможности подтвердить чужой адрес.
   */
  async verifyEmail(token: string): Promise<PublicClient> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Ссылка подтверждения недействительна или устарела',
      );
    }

    const [, client] = await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.client.update({
        where: { id: record.clientId },
        data: { emailVerifiedAt: new Date() },
        select: clientPublicSelect,
      }),
    ]);

    return client;
  }

  async resendVerification(client: PublicClient): Promise<void> {
    if (client.emailVerifiedAt) return;
    await this.sendVerificationLink(client);
  }

  private async sendVerificationLink(client: PublicClient): Promise<void> {
    const token = randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      // прошлые письма перестают работать: активна всегда одна ссылка
      this.prisma.emailVerificationToken.deleteMany({
        where: { clientId: client.id, usedAt: null },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          clientId: client.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
        },
      }),
    ]);

    const link = `${this.appUrl}/verify-email?token=${token}`;
    await this.mail.sendEmailVerification(client.email, link);
  }

  private async startSession(client: PublicClient): Promise<Session> {
    const token = await this.jwt.signAsync({ sub: client.id });
    return { client, token, maxAgeMs: this.sessionTtlSeconds * 1000 };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
