import Link from 'next/link';
import { SiteCreateForm } from '@/components/dashboard/site-create-form';
import { Card } from '@/components/ui';
import { requireProfile } from '@/lib/session';

export const metadata = { title: 'Новый сайт — SaaS Control' };

export default async function NewSitePage() {
  await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-black/60 underline underline-offset-4 dark:text-white/60"
        >
          ← Все сайты
        </Link>

        <h1 className="mt-2 text-xl font-semibold">Новый сайт</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Имя — это поддомен на habibi-erp.com, его потом не переименовать без
          миграции.
        </p>
      </div>

      <Card>
        <SiteCreateForm />
      </Card>
    </div>
  );
}
