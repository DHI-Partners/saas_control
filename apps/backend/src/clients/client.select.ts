import { Prisma } from '../generated/prisma/client';

/** Поля клиента, которые можно отдавать наружу: без passwordHash. */
export const clientPublicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.ClientSelect;

export type PublicClient = Prisma.ClientGetPayload<{
  select: typeof clientPublicSelect;
}>;
