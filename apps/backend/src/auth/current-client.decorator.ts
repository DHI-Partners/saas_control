import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicClient } from '../clients/client.select';

/** Клиент из сессии — кладётся в request в SessionGuard. */
export const CurrentClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicClient => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.client!;
  },
);
