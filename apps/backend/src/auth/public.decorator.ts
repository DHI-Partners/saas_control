import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Роут доступен без сессии: SessionGuard навешен глобально. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
