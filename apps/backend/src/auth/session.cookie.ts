import type { CookieOptions, Response } from 'express';

export const SESSION_COOKIE = 'sc_session';

/**
 * Кука httpOnly: токен не виден JS, поэтому XSS не уносит сессию.
 * secure по умолчанию включается в проде; за https-прокси на локальном http
 * его можно принудительно выключить через COOKIE_SECURE=false.
 */
function cookieOptions(maxAgeMs: number): CookieOptions {
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setSessionCookie(
  res: Response,
  token: string,
  maxAgeMs: number,
) {
  res.cookie(SESSION_COOKIE, token, cookieOptions(maxAgeMs));
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions(0), maxAge: undefined });
}
