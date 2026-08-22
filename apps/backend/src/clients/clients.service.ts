import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { clientPublicSelect, type PublicClient } from './client.select';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Профиль для шапки кабинета: клиент + сводка по его сайтам. */
  async profile(clientId: string) {
    const [client, byStatus] = await Promise.all([
      this.prisma.client.findUniqueOrThrow({
        where: { id: clientId },
        select: clientPublicSelect,
      }),
      this.prisma.site.groupBy({
        by: ['status'],
        where: { clientId },
        _count: { _all: true },
      }),
    ]);

    return {
      client,
      sites: {
        total: byStatus.reduce((sum, row) => sum + row._count._all, 0),
        byStatus: Object.fromEntries(
          byStatus.map((row) => [row.status, row._count._all]),
        ),
      },
    };
  }

  updateProfile(
    clientId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicClient> {
    return this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name || null } : {}),
      },
      select: clientPublicSelect,
    });
  }

  async changePassword(
    clientId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      select: { passwordHash: true },
    });

    if (!(await compare(dto.currentPassword, client.passwordHash))) {
      throw new UnauthorizedException('Текущий пароль неверный');
    }

    await this.prisma.client.update({
      where: { id: clientId },
      data: { passwordHash: await hash(dto.newPassword, BCRYPT_ROUNDS) },
    });
  }
}
