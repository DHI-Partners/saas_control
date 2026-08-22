import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/dashboard/auto-refresh';
import { SiteEditForm } from '@/components/dashboard/site-edit-form';
import { Alert, Badge, Card } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { sessionApi } from '@/lib/api.server';
import { SITE_STATUS_BADGE, SITE_STATUS_LABEL } from '@/lib/site-labels';

const RUN_LABEL: Record<string, string> = {
  queued: 'в очереди на бенче',
  running: 'идёт установка',
};

export default async function SitePage({
  params,
}: PageProps<'/dashboard/sites/[id]'>) {
  const { id } = await params;
  const api = await sessionApi();

  const found = await api.sites.get(id).catch((error: unknown) => {
    // чужой или несуществующий сайт бэкенд отдаёт одинаково — как 404
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  // пока сайт разворачивается, статус берём у бенча: он же переведёт сайт
  // в «Работает» или в «Не развернулся», когда прогон закончится
  const run =
    found.status === 'PROVISIONING'
      ? await api.sites.provisioning(found.id).catch(() => null)
      : null;

  const site = run?.site ?? found;
  const inProgress = run?.status === 'queued' || run?.status === 'running';

  return (
    <div className="flex flex-col gap-6">
      {inProgress && <AutoRefresh />}

      <div>
        <Link
          href="/dashboard"
          className="text-sm text-black/60 underline underline-offset-4 dark:text-white/60"
        >
          ← Все сайты
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{site.name}</h1>
          <Badge className={SITE_STATUS_BADGE[site.status]}>
            {SITE_STATUS_LABEL[site.status]}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Добавлен {new Date(site.createdAt).toLocaleDateString('ru-RU')} ·
          изменён {new Date(site.updatedAt).toLocaleString('ru-RU')}
        </p>
      </div>

      {inProgress && (
        <Alert kind="info">
          Разворачивается: {RUN_LABEL[run.status ?? ''] ?? 'идёт работа'}.
          Страница обновляется сама.
        </Alert>
      )}

      {site.status === 'FAILED' && (
        <Alert>
          Bench не смог развернуть сайт
          {site.provisionError ? `: ${site.provisionError}` : '.'} Недостроенный
          сайт бенч убрал в архив, так что имя можно занять снова — удалите
          запись и создайте сайт заново.
        </Alert>
      )}

      <Card>
        <SiteEditForm site={site} />
      </Card>
    </div>
  );
}
