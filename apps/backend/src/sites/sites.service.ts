import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BridgeService, type BridgeStatus } from '../bridge/bridge.service';
import { isUniqueViolation } from '../common/prisma-errors';
import type { Prisma } from '../generated/prisma/client';
import type { SitePlan, SiteStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSiteDto } from './dto/create-site.dto';
import type { ListSitesDto } from './dto/list-sites.dto';
import type { UpdateSiteDto } from './dto/update-site.dto';

/** Кто заводит сайт: id для владения, email — под него создаётся System Manager. */
export type SiteOwner = { id: string; email: string };

/** Сколько пользователей разрешает тариф; лимит пишется в конфиг сайта бенчем. */
const PLAN_MAX_USERS: Record<SitePlan, number | undefined> = {
  TRIAL: 2,
  BASIC: 5,
  PRO: 20,
  ENTERPRISE: undefined,
};

/**
 * Сайты клиента.
 *
 * Каждый запрос фильтруется по clientId из сессии: сайт принадлежит ровно
 * одному клиенту, поэтому чужой сайт по id не открывается и не меняется —
 * вместо 403 отдаём 404, чтобы не подтверждать существование чужого id.
 */
@Injectable()
export class SitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bridge: BridgeService,
  ) {}

  list(clientId: string, query: ListSitesDto) {
    const search: Prisma.SiteWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { domain: { contains: query.q, mode: 'insensitive' } },
            { notes: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.site.findMany({
      where: {
        clientId,
        ...(query.status ? { status: query.status } : {}),
        ...search,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(clientId: string, id: string) {
    const site = await this.prisma.site.findFirst({ where: { id, clientId } });
    if (!site) throw new NotFoundException('Сайт не найден');
    return site;
  }

  /**
   * Заводит сайт в кабинете и сразу отдаёт его в bench.
   *
   * bench проверяет запрос синхронно, а установку ставит в очередь, поэтому
   * сайт остаётся PROVISIONING до опроса статуса. Пароли bench генерирует и
   * возвращает ровно один раз — нигде их не храним, а отдаём наверх, чтобы
   * кабинет показал их клиенту.
   */
  async create(owner: SiteOwner, dto: CreateSiteDto) {
    let site: Awaited<ReturnType<typeof this.prisma.site.create>>;

    try {
      site = await this.prisma.site.create({
        data: { ...dto, apps: dto.apps ?? [], clientId: owner.id },
      });
    } catch (error) {
      throw this.asHttpError(error);
    }

    if (!this.bridge.enabled) return { ...site, credentials: null };

    try {
      const run = await this.bridge.createSite({
        site: site.name,
        apps: site.apps,
        email: owner.email,
        maxUsers: PLAN_MAX_USERS[site.plan],
      });

      return {
        ...site,
        credentials: {
          login: run.login,
          password: run.password ?? null,
          adminPassword: run.admin_password ?? null,
        },
      };
    } catch (error) {
      // запрос отвергнут на входе — запись в базе только заняла бы имя
      await this.prisma.site
        .delete({ where: { id: site.id } })
        .catch(() => undefined);
      throw error;
    }
  }

  /**
   * Прогресс развёртывания: queued, running, success или failed. Дошедший до
   * конца прогон сразу переводит статус сайта, чтобы кабинет не спрашивал
   * bench про давно готовый сайт (bench помнит прогон только сутки).
   */
  async provisioning(clientId: string, id: string) {
    const site = await this.findOne(clientId, id);
    if (!this.bridge.enabled) return { status: null, error: null, site };

    let state: BridgeStatus;
    try {
      state = await this.bridge.siteStatus(site.name);
    } catch (error) {
      // прогона нет: сайт завели до подключения бенча или прогон уже забыт
      if (error instanceof BadRequestException) {
        return { status: null, error: null, site };
      }
      throw error;
    }

    const finished: SiteStatus | null =
      state.status === 'success'
        ? 'ACTIVE'
        : state.status === 'failed'
          ? 'FAILED'
          : null;

    const updated =
      finished && site.status === 'PROVISIONING'
        ? await this.prisma.site.update({
            where: { id: site.id },
            data: { status: finished, provisionError: state.error ?? null },
          })
        : site;

    return { status: state.status, error: state.error ?? null, site: updated };
  }

  async update(clientId: string, id: string, dto: UpdateSiteDto) {
    await this.findOne(clientId, id);

    try {
      // clientId в data не попадает: сайт нельзя передать другому клиенту
      return await this.prisma.site.update({ where: { id }, data: dto });
    } catch (error) {
      throw this.asHttpError(error);
    }
  }

  async remove(clientId: string, id: string): Promise<void> {
    await this.findOne(clientId, id);
    await this.prisma.site.delete({ where: { id } });
  }

  private asHttpError(error: unknown): unknown {
    if (isUniqueViolation(error, 'name')) {
      return new ConflictException('Сайт с таким именем уже есть');
    }
    if (isUniqueViolation(error, 'domain')) {
      return new ConflictException('Этот домен уже привязан к другому сайту');
    }
    return error;
  }
}
