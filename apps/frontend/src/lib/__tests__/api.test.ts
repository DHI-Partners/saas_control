import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiErrorMessages, createApiClient } from '../api';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createApiClient', () => {
  it('склеивает базовый URL с путём и парсит JSON', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ status: 'ok', now: 'now' }), {
        status: 200,
      }),
    );

    await expect(createApiClient('/api').dbHealth()).resolves.toEqual({
      status: 'ok',
      now: 'now',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/health/db',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('работает с абсолютным базовым URL (серверный клиент)', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }));

    await createApiClient('http://localhost:3000').dbHealth();

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/health/db');
  });

  it('нормализует путь без ведущего слэша', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }));

    await createApiClient('/api').request('health/db');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/health/db');
  });

  it('бросает ApiError со статусом на не-2xx', async () => {
    stubFetch(new Response('nope', { status: 503, statusText: 'Unavailable' }));

    await expect(createApiClient('/api').dbHealth()).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('не парсит тело у 204', async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(
      createApiClient('/api').request('/things'),
    ).resolves.toBeUndefined();
  });
});

describe('кабинет: сайты и ошибки', () => {
  it('собирает query из фильтров и пропускает пустые', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }));

    await createApiClient('/api').sites.list({ status: 'ACTIVE', q: '' });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/sites?status=ACTIVE');
  });

  it('без фильтров ходит на чистый /sites', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }));

    await createApiClient('/api').sites.list();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/sites');
  });

  it('отправляет тело и метод при создании сайта', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 201 }));

    await createApiClient('/api').sites.create({ name: 'crm.example.com' });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'crm.example.com' }),
    });
  });

  it('вытаскивает сообщения валидации Nest в issues', async () => {
    stubFetch(
      new Response(
        JSON.stringify({
          message: ['Пароль должен быть не короче 8 символов'],
          statusCode: 400,
        }),
        { status: 400 },
      ),
    );

    const error = await createApiClient('/api')
      .auth.register({ email: 'a@b.co', password: '1' })
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).issues).toEqual([
      'Пароль должен быть не короче 8 символов',
    ]);
  });

  it('строковое сообщение бэкенда тоже доходит до формы', async () => {
    stubFetch(
      new Response(JSON.stringify({ message: 'Неверная почта или пароль' }), {
        status: 401,
      }),
    );

    const error = await createApiClient('/api')
      .auth.login({ email: 'a@b.co', password: 'nope' })
      .catch((thrown: unknown) => thrown);

    expect(apiErrorMessages(error)).toEqual(['Неверная почта или пароль']);
  });
});
