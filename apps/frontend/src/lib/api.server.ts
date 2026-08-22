import { cookies } from 'next/headers';
import { createApiClient } from './api';

const backendUrl = () => process.env.BACKEND_URL ?? 'http://localhost:3000';

/**
 * Клиент для серверной части Next (RSC, route handlers): ходит на бэкенд
 * напрямую по абсолютному URL, минуя proxy. Без сессии — для публичных
 * ручек вроде health.
 */
export const serverApi = createApiClient(backendUrl(), {
  // Проверка живая: без no-store Next закэшировал бы ответ на этапе сборки.
  cache: 'no-store',
});

/**
 * То же, но с куками текущего запроса: серверный рендер личного кабинета
 * ходит в API от имени вошедшего клиента.
 */
export async function sessionApi() {
  const cookie = (await cookies()).toString();

  return createApiClient(backendUrl(), {
    cache: 'no-store',
    headers: cookie ? { cookie } : {},
  });
}
