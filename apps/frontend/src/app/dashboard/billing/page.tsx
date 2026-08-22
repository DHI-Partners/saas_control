import { Alert, Card } from '@/components/ui';
import { sessionApi } from '@/lib/api.server';
import { requireProfile } from '@/lib/session';
import { SITE_PLANS, SITE_PLAN_LABEL } from '@/lib/site-labels';

export const metadata = { title: 'Оплата — SaaS Control' };

export default async function BillingPage() {
  const [{ client }, api] = await Promise.all([requireProfile(), sessionApi()]);
  const sites = await api.sites.list();

  const byPlan = SITE_PLANS.map((plan) => ({
    plan,
    sites: sites.filter((site) => site.plan === plan),
  })).filter((row) => row.sites.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Оплата</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Счёт клиента {client.email}
        </p>
      </div>

      <Alert kind="info">
        Приём платежей ещё не подключён — тариф меняем вручную в карточке сайта.
      </Alert>

      <Card>
        <h2 className="mb-4 text-sm font-medium text-black/70 dark:text-white/70">
          Сайты по тарифам
        </h2>

        {byPlan.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Сайтов пока нет — платить не за что.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {byPlan.map(({ plan, sites: planSites }) => (
              <li
                key={plan}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/10"
              >
                <span className="text-sm font-medium">
                  {SITE_PLAN_LABEL[plan]}
                </span>
                <span className="font-mono text-xs text-black/55 dark:text-white/55">
                  {planSites.map((site) => site.name).join(', ')}
                </span>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {planSites.length} шт.
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
