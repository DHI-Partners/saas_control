'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, type CreatedSite, type SitePlan } from '@/lib/api';
import { SubmitForm, nullableText } from '../submit-form';
import { Alert, linkButtonClass } from '../ui';
import { SiteFields, parseApps, siteName } from './site-fields';

export function SiteCreateForm() {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedSite | null>(null);

  if (created) return <SiteCreated site={created} />;

  return (
    <SubmitForm
      submitLabel="Добавить сайт"
      pendingLabel="Отдаём в bench…"
      action={(form) =>
        api.sites.create({
          name: siteName(form),
          plan: String(form.get('plan') ?? 'TRIAL') as SitePlan,
          apps: parseApps(form),
          notes: nullableText(form, 'notes'),
        })
      }
      // не уходим со страницы: пароли bench отдаёт только в этом ответе
      onSuccess={(result) => {
        setCreated(result as CreatedSite);
        router.refresh();
      }}
      aside={
        <Link
          href="/dashboard"
          className="rounded-md border border-black/10 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Отмена
        </Link>
      }
    >
      <SiteFields />
    </SubmitForm>
  );
}

/** Что показать сразу после создания: реквизиты видны только здесь и сейчас. */
function SiteCreated({ site }: { site: CreatedSite }) {
  const { credentials } = site;

  return (
    <div className="flex flex-col gap-4">
      <Alert kind="success">
        {site.name} принят в работу — bench разворачивает сайт, это занимает
        несколько минут.
      </Alert>

      {credentials && (
        <div className="flex flex-col gap-3">
          <Alert kind="info">
            Пароли показываются один раз: bench их не хранит, и в кабинете их
            больше не будет. Сохраните сейчас.
          </Alert>

          <dl className="flex flex-col gap-2 rounded-md border border-black/10 p-4 text-sm dark:border-white/15">
            <Secret label="Адрес" value={site.name} />
            {credentials.login && (
              <Secret label="Логин" value={credentials.login} />
            )}
            {credentials.password && (
              <Secret label="Пароль" value={credentials.password} />
            )}
            {credentials.adminPassword && (
              <Secret
                label="Пароль Administrator"
                value={credentials.adminPassword}
              />
            )}
          </dl>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/sites/${site.id}`} className={linkButtonClass}>
          Открыть сайт
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-black/10 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Все сайты
        </Link>
      </div>
    </div>
  );
}

function Secret({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <dt className="w-40 shrink-0 text-black/55 dark:text-white/55">
        {label}
      </dt>
      <dd className="font-mono break-all select-all">{value}</dd>
    </div>
  );
}
