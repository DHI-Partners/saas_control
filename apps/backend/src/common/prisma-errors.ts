import { Prisma } from '../generated/prisma/client';

type UniqueMeta = {
  /** Prisma без драйвер-адаптера кладёт поля сюда. */
  target?: unknown;
  /** С драйвер-адаптером (pg) — сюда, вместе с исходной ошибкой Postgres. */
  driverAdapterError?: {
    cause?: { constraint?: { fields?: unknown; index?: unknown } };
  };
};

/**
 * P2002 — нарушен unique-индекс. Если передано имя поля, проверяем, что упал
 * именно этот индекс: у клиента уникален email, у сайта — name и domain,
 * и сообщения об ошибке должны различаться.
 */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }
  if (!field) return true;

  return violatedFields(error.meta).some(
    // индекс может прийти как имя поля или как имя констрейнта Client_email_key
    (name) => name === field || name.endsWith(`_${field}_key`),
  );
}

function violatedFields(meta: UniqueMeta | undefined): string[] {
  const constraint = meta?.driverAdapterError?.cause?.constraint;
  const sources: unknown[] = [
    meta?.target,
    constraint?.fields,
    constraint?.index,
  ];

  return sources
    .flatMap((value): unknown[] => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === 'string');
}
