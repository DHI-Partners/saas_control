import type { NextRequest } from 'next/server';

/**
 * Runtime-прокси на NestJS.
 *
 * Именно route handler, а не rewrite из next.config.ts: rewrite вычисляется
 * на этапе сборки и вшивается в манифест, поэтому один и тот же образ нельзя
 * было бы переключить на другой бэкенд переменной окружения. Здесь адрес
 * читается на каждый запрос.
 */

// заголовки, которые должен выставлять сам HTTP-слой, а не проксироваться
const STRIPPED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
]);
const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  const target = new URL(`${backendUrl}/${path.join('/')}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // тело приходит потоком — Node fetch требует явного duplex
      ...(hasBody ? { duplex: 'half' } : {}),
      redirect: 'manual',
      cache: 'no-store',
    } as RequestInit);
  } catch (error) {
    return Response.json(
      {
        statusCode: 502,
        message: 'Бэкенд недоступен',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    // set-cookie разбирается ниже: forEach склеил бы несколько кук в одну строку
    if (name !== 'set-cookie' && !STRIPPED_RESPONSE_HEADERS.has(name)) {
      responseHeaders.set(key, value);
    }
  });

  // кука сессии приходит отсюда — без неё вход через proxy не работал бы
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append('set-cookie', cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;

export const dynamic = 'force-dynamic';
