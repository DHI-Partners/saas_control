/**
 * Тонкий типизированный клиент к NestJS API.
 *
 * Из браузера ходим на относительный /api — его проксирует route handler
 * src/app/api/[...path]/route.ts, поэтому нет CORS и адрес бэкенда не
 * попадает в бандл. Сессия живёт в httpOnly-куке: браузер шлёт её сам,
 * серверные вызовы прокидывают её явно (см. api.server.ts).
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
    /** Сообщения валидации от бэкенда: их показываем в форме. */
    readonly issues: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Сообщения для показа в форме: список ошибок валидации или одна ошибка. */
export function apiErrorMessages(error: unknown): string[] {
  if (error instanceof ApiError) {
    return error.issues.length > 0 ? error.issues : [error.message];
  }
  if (error instanceof Error) return [error.message];
  return [String(error)];
}

export type DbHealth = {
  status: string;
  now: string;
};

export type SiteStatus =
  'PROVISIONING' | 'ACTIVE' | 'FAILED' | 'SUSPENDED' | 'ARCHIVED';
export type SitePlan = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE';

export type Client = {
  id: string;
  email: string;
  name: string | null;
  role: 'CLIENT' | 'ADMIN';
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type Site = {
  id: string;
  name: string;
  domain: string | null;
  status: SiteStatus;
  plan: SitePlan;
  frappeVersion: string | null;
  apps: string[];
  notes: string | null;
  /** текст ошибки bench, если развернуть сайт не удалось */
  provisionError: string | null;
  createdAt: string;
  updatedAt: string;
  clientId: string;
};

/**
 * Ответ на создание сайта. Пароли bench генерирует и отдаёт ровно один раз —
 * в кабинете их негде посмотреть потом, поэтому показываем сразу.
 */
export type CreatedSite = Site & {
  credentials: {
    login: string | null;
    password: string | null;
    adminPassword: string | null;
  } | null;
};

/** Прогресс развёртывания. status === null — прогона на бенче нет. */
export type SiteProvisioning = {
  status: 'queued' | 'running' | 'success' | 'failed' | null;
  error: string | null;
  site: Site;
};

/** Клиент + сводка по его сайтам: то, что показывает шапка кабинета. */
export type Profile = {
  client: Client;
  sites: { total: number; byStatus: Partial<Record<SiteStatus, number>> };
};

export type SiteInput = {
  name?: string;
  domain?: string | null;
  status?: SiteStatus;
  plan?: SitePlan;
  frappeVersion?: string | null;
  apps?: string[];
  notes?: string | null;
};

export type SitesQuery = { status?: SiteStatus; q?: string };

export function createApiClient(baseUrl: string, defaults?: RequestInit) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const res = await fetch(url, {
      ...defaults,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...defaults?.headers,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      throw await toApiError(res, url, init?.method ?? 'GET');
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  function send<T>(method: string, path: string, body?: unknown) {
    return request<T>(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  return {
    request,
    dbHealth: () => request<DbHealth>('/health/db'),

    auth: {
      register: (input: { email: string; password: string; name?: string }) =>
        send<{ client: Client }>('POST', '/auth/register', input),
      login: (input: { email: string; password: string }) =>
        send<{ client: Client }>('POST', '/auth/login', input),
      logout: () => send<void>('POST', '/auth/logout'),
      verifyEmail: (token: string) =>
        send<{ client: Client }>('POST', '/auth/verify-email', { token }),
      resendVerification: () =>
        send<{ status: string }>('POST', '/auth/verify-email/resend'),
    },

    me: {
      profile: () => request<Profile>('/me'),
      update: (input: { name?: string }) => send<Client>('PATCH', '/me', input),
      changePassword: (input: {
        currentPassword: string;
        newPassword: string;
      }) => send<void>('PUT', '/me/password', input),
    },

    sites: {
      list: (query?: SitesQuery) =>
        request<Site[]>(`/sites${toQueryString(query)}`),
      get: (id: string) => request<Site>(`/sites/${id}`),
      create: (input: SiteInput) => send<CreatedSite>('POST', '/sites', input),
      provisioning: (id: string) =>
        request<SiteProvisioning>(`/sites/${id}/provisioning`),
      update: (id: string, input: SiteInput) =>
        send<Site>('PATCH', `/sites/${id}`, input),
      remove: (id: string) => send<void>('DELETE', `/sites/${id}`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Клиент для браузера: ходит через proxy /api -> бэкенд. */
export const api = createApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
);

function toQueryString(query?: SitesQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * Nest отдаёт `message` строкой или массивом строк (ошибки валидации).
 * Достаём их, иначе в форме было бы видно только «400 Bad Request».
 */
async function toApiError(
  res: Response,
  url: string,
  method: string,
): Promise<ApiError> {
  const fallback = `${method} ${url} → ${res.status} ${res.statusText}`;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return new ApiError(res.status, url, fallback);
  }

  const message = (body as { message?: unknown } | null)?.message;
  const issues = Array.isArray(message)
    ? message.filter((item): item is string => typeof item === 'string')
    : [];

  if (issues.length > 0) {
    return new ApiError(res.status, url, issues.join('. '), issues);
  }
  if (typeof message === 'string' && message) {
    return new ApiError(res.status, url, message, [message]);
  }
  return new ApiError(res.status, url, fallback);
}
