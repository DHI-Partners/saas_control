import { Transform } from 'class-transformer';

/**
 * Приведение ввода к тому виду, в котором значение лежит в базе: почта и
 * домены — в нижнем регистре, пробелы по краям обрезаны, пустая строка в
 * необязательном поле означает «очистить», то есть null.
 */

const trimmed = (value: unknown, lower = false): unknown => {
  if (typeof value !== 'string') return value;
  const result = value.trim();
  return lower ? result.toLowerCase() : result;
};

const emptyToNull = (value: unknown): unknown => (value === '' ? null : value);

export const Trim = () =>
  Transform(({ value }: { value: unknown }) => trimmed(value));

/** Почта, имя сайта, домен: регистр не должен создавать вторую запись. */
export const TrimLower = () =>
  Transform(({ value }: { value: unknown }) => trimmed(value, true));

export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) => emptyToNull(trimmed(value)));

export const TrimLowerToNull = () =>
  Transform(({ value }: { value: unknown }) =>
    emptyToNull(trimmed(value, true)),
  );

/** Список имён frappe-приложений. */
export const TrimLowerEach = () =>
  Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? (value as unknown[]).map((item) => trimmed(item, true))
      : value,
  );
