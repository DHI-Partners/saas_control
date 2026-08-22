'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition, type FormEvent } from 'react';
import { SITE_STATUSES, SITE_STATUS_LABEL } from '@/lib/site-labels';
import { Button, inputClass } from '../ui';

/** Фильтр списка сайтов: значения уезжают в query, список читает их на сервере. */
export function SitesFilter({
  status = '',
  q = '',
}: {
  status?: string;
  q?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ['q', 'status']) {
      const value = String(form.get(key) ?? '').trim();
      if (value) params.set(key, value);
    }

    const search = params.toString();
    startTransition(() =>
      router.push(search ? `${pathname}?${search}` : pathname),
    );
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder="Поиск по имени, домену, заметкам"
        aria-label="Поиск по сайтам"
        className={`${inputClass} sm:w-72`}
      />

      <select
        name="status"
        defaultValue={status}
        aria-label="Статус"
        className={`${inputClass} sm:w-52`}
      >
        <option value="">Все статусы</option>
        {SITE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {SITE_STATUS_LABEL[value]}
          </option>
        ))}
      </select>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Ищем…' : 'Показать'}
      </Button>
    </form>
  );
}
