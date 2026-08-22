import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

const originalBackendUrl = process.env.BACKEND_URL;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
});

function request(url: string) {
  return Object.assign(new Request(url), {
    nextUrl: new URL(url),
  }) as unknown as Parameters<typeof GET>[0];
}

describe('/api/[...path] proxy', () => {
  it('читает BACKEND_URL на каждый запрос и сохраняет query', async () => {
    process.env.BACKEND_URL = 'http://backend:3000';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(request('http://localhost:3001/api/health/db?x=1'), {
      params: Promise.resolve({ path: ['health', 'db'] }),
    });

    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://backend:3000/health/db?x=1',
    );
  });

  it('отдаёт 502, если бэкенд недоступен', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    const res = await GET(request('http://localhost:3001/api/health/db'), {
      params: Promise.resolve({ path: ['health', 'db'] }),
    });

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ statusCode: 502 });
  });
});

describe('/api/[...path] и куки сессии', () => {
  it('прокидывает несколько Set-Cookie по отдельности', async () => {
    const upstream = new Response('{}', { status: 200 });
    upstream.headers.append('set-cookie', 'sc_session=jwt; Path=/; HttpOnly');
    upstream.headers.append('set-cookie', 'other=1; Path=/');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(upstream));

    const res = await GET(request('http://localhost:3001/api/me'), {
      params: Promise.resolve({ path: ['me'] }),
    });

    expect(res.headers.getSetCookie()).toEqual([
      'sc_session=jwt; Path=/; HttpOnly',
      'other=1; Path=/',
    ]);
  });

  it('передаёт куку запроса на бэкенд', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    const req = Object.assign(
      new Request('http://localhost:3001/api/me', {
        headers: { cookie: 'sc_session=jwt' },
      }),
      { nextUrl: new URL('http://localhost:3001/api/me') },
    ) as unknown as Parameters<typeof GET>[0];

    await GET(req, { params: Promise.resolve({ path: ['me'] }) });

    expect(fetchMock.mock.calls[0][1].headers.get('cookie')).toBe(
      'sc_session=jwt',
    );
  });
});
