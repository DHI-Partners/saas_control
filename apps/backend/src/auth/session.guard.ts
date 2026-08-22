import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { clientPublicSelect } from '../clients/client.select';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SESSION_COOKIE } from './session.cookie';

export type SessionPayload = { sub: string };

/**
 * Глобальный гард: закрыто всё, кроме роутов с @Public().
 * Клиент подгружается из БД на каждый запрос — удалённый аккаунт со старым
 * токеном внутрь не попадёт.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = extractToken(request);
    if (!token) throw new UnauthorizedException('Нужна авторизация');

    let payload: SessionPayload;
    try {
      payload = await this.jwt.verifyAsync<SessionPayload>(token);
    } catch {
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: payload.sub },
      select: clientPublicSelect,
    });
    if (!client) throw new UnauthorizedException('Аккаунт не найден');

    request.client = client;
    return true;
  }
}

/** Кука — для браузера, Bearer — для curl и внешних интеграций. */
function extractToken(request: Request): string | undefined {
  const fromCookie = request.cookies?.[SESSION_COOKIE] as string | undefined;
  if (fromCookie) return fromCookie;

  const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' ? value : undefined;
}
