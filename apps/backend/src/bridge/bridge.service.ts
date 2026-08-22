import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Клиент к saas_bridge — приложению Frappe на управляющем сайте бенча.
 *
 * Оно и создаёт сайты: `create_site` проверяет запрос синхронно, а саму
 * установку ставит в очередь (bench new-site идёт минутами), поэтому статус
 * приходится опрашивать через `get_site_status`. Ключи не заданы — режим без
 * бенча: кабинет только пишет сайты в свою базу, ничего не разворачивая.
 */

export type BridgeCreateSite = {
  site: string;
  apps?: string[];
  email?: string;
  firstName?: string;
  maxUsers?: number;
};

export type BridgeRun = {
  site: string;
  apps: string[];
  login: string | null;
  status: 'queued' | 'running' | 'success' | 'failed';
  job_id: string;
  /** пароли отдаются один раз, в ответе на create_site — нигде не хранятся */
  admin_password?: string;
  password?: string;
};

export type BridgeStatus = {
  status: 'queued' | 'running' | 'success' | 'failed';
  error?: string | null;
  cleanup?: string | null;
  apps_installed?: string[] | null;
  login_created?: string | null;
  finished_at?: string | null;
};

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);
  private readonly baseUrl: string;
  private readonly authorization: string;
  readonly enabled: boolean;

  constructor(config: ConfigService) {
    const url = config.get<string>('BRIDGE_URL')?.replace(/\/+$/, '') ?? '';
    const key = config.get<string>('BRIDGE_API_KEY') ?? '';
    const secret = config.get<string>('BRIDGE_API_SECRET') ?? '';

    this.baseUrl = url;
    this.authorization = `token ${key}:${secret}`;
    this.enabled = Boolean(url && key && secret);

    if (!this.enabled) {
      this.logger.warn(
        'BRIDGE_URL/BRIDGE_API_KEY/BRIDGE_API_SECRET не заданы — сайты только пишутся в базу, bench не вызывается',
      );
    }
  }

  createSite(input: BridgeCreateSite): Promise<BridgeRun> {
    return this.call<BridgeRun>('POST', 'saas_bridge.api.create_site', {
      site: input.site,
      apps: input.apps ?? [],
      email: input.email,
      first_name: input.firstName,
      max_users: input.maxUsers,
    });
  }

  siteStatus(site: string): Promise<BridgeStatus> {
    return this.call<BridgeStatus>('GET', 'saas_bridge.api.get_site_status', {
      site,
    });
  }

  private async call<T>(
    method: 'GET' | 'POST',
    method_path: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/method/${method_path}`);
    const body = JSON.stringify(clean(payload));

    if (method === 'GET') {
      for (const [key, value] of Object.entries(clean(payload))) {
        url.searchParams.set(key, String(value));
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: this.authorization,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: method === 'POST' ? body : undefined,
        // bench-операции ставятся в очередь, но сама валидация идёт синхронно
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      this.logger.error(`saas_bridge недоступен: ${asMessage(error)}`);
      throw new ServiceUnavailableException(
        'Сервис развёртывания недоступен, попробуйте позже',
      );
    }

    const text = await response.text();
    const parsed: unknown = text ? safeJson(text) : null;

    if (!response.ok) {
      const message = frappeError(parsed) ?? `bench ответил ${response.status}`;
      this.logger.warn(`saas_bridge ${method_path}: ${message}`);

      // 5xx — это сбой бенча, а не запроса клиента
      if (response.status >= 500) {
        throw new ServiceUnavailableException(message);
      }
      throw new BadRequestException(message);
    }

    return (parsed as { message: T }).message;
  }
}

/** undefined-поля не отправляем: у ручек есть свои значения по умолчанию. */
function clean(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Frappe кладёт текст frappe.throw в _server_messages (JSON внутри JSON),
 * а в exception — только класс и первую строку.
 */
function frappeError(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as { _server_messages?: string; exception?: string };

  if (payload._server_messages) {
    const messages: unknown = safeJson(payload._server_messages);
    if (Array.isArray(messages) && messages.length > 0) {
      const first: unknown = safeJson(String(messages[0]));
      const text =
        first && typeof first === 'object' && 'message' in first
          ? String(first.message)
          : String(messages[0]);
      return stripTags(text);
    }
  }

  if (payload.exception) {
    return stripTags(payload.exception.replace(/^[\w.]+Error:\s*/, ''));
  }
  return null;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
