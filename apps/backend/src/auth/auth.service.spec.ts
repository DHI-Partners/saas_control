import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Prisma } from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const CLIENT = {
  id: 'client-1',
  email: 'client@example.com',
  name: null,
  role: 'CLIENT' as const,
  emailVerifiedAt: null,
  createdAt: new Date(),
};

const prismaMock = {
  client: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  emailVerificationToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mailMock = { sendEmailVerification: jest.fn() };

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockResolvedValue([null, CLIENT]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailMock },
        {
          provide: JwtService,
          useValue: { signAsync: () => Promise.resolve('jwt') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'APP_URL' ? 'http://app' : undefined,
          },
        },
      ],
    }).compile();

    auth = moduleRef.get<AuthService>(AuthService);
  });

  it('при регистрации кладёт хэш пароля, а не сам пароль', async () => {
    prismaMock.client.create.mockResolvedValue(CLIENT);

    await auth.register({ email: CLIENT.email, password: 'supersecret1' });

    const [{ data }] = prismaMock.client.create.mock.calls[0] as [
      { data: { passwordHash: string } },
    ];
    expect(data.passwordHash).not.toBe('supersecret1');
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('отправляет ссылку подтверждения на почту клиента', async () => {
    prismaMock.client.create.mockResolvedValue(CLIENT);

    await auth.register({ email: CLIENT.email, password: 'supersecret1' });

    expect(mailMock.sendEmailVerification).toHaveBeenCalledWith(
      CLIENT.email,
      expect.stringMatching(/^http:\/\/app\/verify-email\?token=[a-f0-9]{64}$/),
    );
  });

  it('занятая почта — 409', async () => {
    prismaMock.client.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );

    await expect(
      auth.register({ email: CLIENT.email, password: 'supersecret1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('неверный пароль и незнакомая почта неразличимы снаружи', async () => {
    prismaMock.client.findUnique.mockResolvedValue({
      ...CLIENT,
      passwordHash: await hash('supersecret1', 4),
    });
    const wrongPassword = await auth
      .login({ email: CLIENT.email, password: 'nope' })
      .catch((error: unknown) => error);

    prismaMock.client.findUnique.mockResolvedValue(null);
    const unknownEmail = await auth
      .login({ email: 'nobody@example.com', password: 'supersecret1' })
      .catch((error: unknown) => error);

    expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
    expect((unknownEmail as Error).message).toBe(
      (wrongPassword as Error).message,
    );
  });

  it('вход отдаёт клиента без хэша пароля', async () => {
    prismaMock.client.findUnique.mockResolvedValue({
      ...CLIENT,
      passwordHash: await hash('supersecret1', 4),
    });

    const session = await auth.login({
      email: CLIENT.email,
      password: 'supersecret1',
    });

    expect(session.client).not.toHaveProperty('passwordHash');
    expect(session.token).toBe('jwt');
  });

  it('использованный токен подтверждения больше не работает', async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'token-1',
      clientId: CLIENT.id,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });

    await expect(auth.verifyEmail('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('просроченный токен подтверждения не работает', async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: 'token-1',
      clientId: CLIENT.id,
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(auth.verifyEmail('token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
