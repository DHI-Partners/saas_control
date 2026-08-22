import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { BridgeService } from '../bridge/bridge.service';
import { PrismaService } from '../prisma/prisma.service';
import { SitesService } from './sites.service';

const CLIENT_ID = 'client-1';
const OWNER = { id: CLIENT_ID, email: 'owner@example.com' };

/** По умолчанию бенч не подключён: create тогда только пишет в базу. */
const bridgeMock = {
  enabled: false,
  createSite: jest.fn(),
  siteStatus: jest.fn(),
};

const prismaMock = {
  site: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

function uniqueViolation(field: string) {
  return new Prisma.PrismaClientKnownRequestError('unique', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: [field] },
  });
}

describe('SitesService', () => {
  let sites: SitesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    bridgeMock.enabled = false;

    const moduleRef = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BridgeService, useValue: bridgeMock },
      ],
    }).compile();

    sites = moduleRef.get<SitesService>(SitesService);
  });

  it('всегда фильтрует список по клиенту из сессии', async () => {
    prismaMock.site.findMany.mockResolvedValue([]);

    await sites.list(CLIENT_ID, { status: 'ACTIVE', q: 'crm' });

    const [{ where }] = prismaMock.site.findMany.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    expect(where).toMatchObject({ clientId: CLIENT_ID, status: 'ACTIVE' });
  });

  it('чужой сайт отдаёт как 404, а не как чужой', async () => {
    prismaMock.site.findFirst.mockResolvedValue(null);

    await expect(sites.findOne(CLIENT_ID, 'site-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.site.findFirst).toHaveBeenCalledWith({
      where: { id: 'site-1', clientId: CLIENT_ID },
    });
  });

  it('не даёт менять чужой сайт', async () => {
    prismaMock.site.findFirst.mockResolvedValue(null);

    await expect(
      sites.update(CLIENT_ID, 'site-1', { status: 'ARCHIVED' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.site.update).not.toHaveBeenCalled();
  });

  it('занятое имя сайта — 409 с понятным текстом', async () => {
    prismaMock.site.create.mockRejectedValue(uniqueViolation('name'));

    const error = await sites
      .create(OWNER, { name: 'crm.example.com' })
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toBe(
      'Сайт с таким именем уже есть',
    );
  });

  it('занятый домен отличается от занятого имени', async () => {
    prismaMock.site.create.mockRejectedValue(uniqueViolation('domain'));

    const error = await sites
      .create(OWNER, { name: 'crm.example.com', domain: 'erp.example.com' })
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toBe(
      'Этот домен уже привязан к другому сайту',
    );
  });

  it('проставляет clientId сам', async () => {
    prismaMock.site.create.mockResolvedValue({ id: 'site-1' });

    await sites.create(OWNER, { name: 'crm.example.com' });

    expect(prismaMock.site.create).toHaveBeenCalledWith({
      data: { name: 'crm.example.com', apps: [], clientId: CLIENT_ID },
    });
  });
  it('отдаёт сайт в bench и возвращает разовые пароли', async () => {
    bridgeMock.enabled = true;
    prismaMock.site.create.mockResolvedValue({
      id: 'site-1',
      name: 'crm.habibi-erp.com',
      apps: ['erpnext'],
      plan: 'TRIAL',
    });
    bridgeMock.createSite.mockResolvedValue({
      login: OWNER.email,
      admin_password: 'admin-pass',
      password: 'login-pass',
    });

    const created = await sites.create(OWNER, {
      name: 'crm.habibi-erp.com',
      apps: ['erpnext'],
    });

    expect(bridgeMock.createSite).toHaveBeenCalledWith({
      site: 'crm.habibi-erp.com',
      apps: ['erpnext'],
      email: OWNER.email,
      maxUsers: 2,
    });
    expect(created.credentials).toEqual({
      login: OWNER.email,
      password: 'login-pass',
      adminPassword: 'admin-pass',
    });
  });

  it('отказ bench снимает запись, чтобы имя не осталось занятым', async () => {
    bridgeMock.enabled = true;
    prismaMock.site.create.mockResolvedValue({
      id: 'site-1',
      name: 'crm.habibi-erp.com',
      apps: [],
      plan: 'TRIAL',
    });
    bridgeMock.createSite.mockRejectedValue(
      new BadRequestException('Site crm.habibi-erp.com already exists'),
    );
    prismaMock.site.delete.mockResolvedValue({ id: 'site-1' });

    await expect(
      sites.create(OWNER, { name: 'crm.habibi-erp.com' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.site.delete).toHaveBeenCalledWith({
      where: { id: 'site-1' },
    });
  });

  it('успешный прогон переводит сайт в ACTIVE', async () => {
    bridgeMock.enabled = true;
    prismaMock.site.findFirst.mockResolvedValue({
      id: 'site-1',
      name: 'crm.habibi-erp.com',
      status: 'PROVISIONING',
    });
    bridgeMock.siteStatus.mockResolvedValue({ status: 'success', error: null });
    prismaMock.site.update.mockResolvedValue({
      id: 'site-1',
      status: 'ACTIVE',
    });

    const result = await sites.provisioning(CLIENT_ID, 'site-1');

    expect(prismaMock.site.update).toHaveBeenCalledWith({
      where: { id: 'site-1' },
      data: { status: 'ACTIVE', provisionError: null },
    });
    expect(result.site.status).toBe('ACTIVE');
  });

  it('забытый прогон не считается ошибкой', async () => {
    bridgeMock.enabled = true;
    prismaMock.site.findFirst.mockResolvedValue({
      id: 'site-1',
      name: 'crm.habibi-erp.com',
      status: 'ACTIVE',
    });
    bridgeMock.siteStatus.mockRejectedValue(
      new BadRequestException('No provisioning run recorded'),
    );

    await expect(
      sites.provisioning(CLIENT_ID, 'site-1'),
    ).resolves.toMatchObject({ status: null });
    expect(prismaMock.site.update).not.toHaveBeenCalled();
  });
});
