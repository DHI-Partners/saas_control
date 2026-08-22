import Link from 'next/link';
import { SitesFilter } from '@/components/dashboard/sites-filter';
import { VerifyBanner } from '@/components/dashboard/verify-banner';
import { Badge, Card, linkButtonClass } from '@/components/ui';
import type { SiteStatus } from '@/lib/api';
import { sessionApi } from '@/lib/api.server';
import { requireProfile } from '@/lib/session';
import {
  SITE_PLAN_LABEL,
  SITE_STATUSES,
  SITE_STATUS_BADGE,
  SITE_STATUS_LABEL,
} from '@/lib/site-labels';

export default async function DashboardPage({
  searchParams,
}: PageProps<'/dashboard'>) {
  const params = await searchParams;
  const status = asStatus(params.status);
  const q = typeof params.q === 'string' ? params.q : undefined;

  const [profile, api] = await Promise.all([requireProfile(), sessionApi()]);
  const sites = await api.sites.list({ status, q });

  return (
    <div className="flex flex-col gap-6">
      {!profile.client.emailVerifiedAt && (
        <VerifyBanner email={profile.client.email} />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Мои сайты</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Всего {profile.sites.total} · работает{' '}
            {profile.sites.byStatus.ACTIVE ?? 0} · разворачивается{' '}
            {profile.sites.byStatus.PROVISIONING ?? 0}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SitesFilter status={status ?? ''} q={q ?? ''} />

          <Link href="/dashboard/sites/new" className={linkButtonClass}>
            Создать сайт
          </Link>
        </div>
      </div>

      {sites.length === 0 ? (
        <Card>
          <p className="text-sm text-black/60 dark:text-white/60">
            {status || q ? (
              'По этому фильтру сайтов нет.'
            ) : (
              <>
                Сайтов пока нет —{' '}
                <Link
                  href="/dashboard/sites/new"
                  className="underline underline-offset-4"
                >
                  создайте первый
                </Link>
                .
              </>
            )}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {sites.map((site) => (
            <li key={site.id}>
              <Link
                href={`/dashboard/sites/${site.id}`}
                className="block rounded-xl border border-black/10 p-4 transition-colors hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{site.name}</span>
                  <Badge className={SITE_STATUS_BADGE[site.status]}>
                    {SITE_STATUS_LABEL[site.status]}
                  </Badge>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {SITE_PLAN_LABEL[site.plan]}
                    {site.frappeVersion ? ` · ${site.frappeVersion}` : ''}
                  </span>
                </div>

                {site.apps.length > 0 && (
                  <p className="mt-1 font-mono text-xs text-black/55 dark:text-white/55">
                    {site.apps.join(', ')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function asStatus(value: unknown): SiteStatus | undefined {
  return SITE_STATUSES.find((status) => status === value);
}
