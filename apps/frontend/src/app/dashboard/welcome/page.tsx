import Link from 'next/link';
import { VerifyBanner } from '@/components/dashboard/verify-banner';
import { Card } from '@/components/ui';
import { requireProfile } from '@/lib/session';

export const metadata = { title: 'Добро пожаловать — SaaS Control' };

export default async function WelcomePage() {
  const { client, sites } = await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">
          Здравствуйте, {client.name ?? client.email}
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Кабинет для сайтов Frappe: разворачиваем, следим за статусом, считаем
          тариф.
        </p>
      </div>

      {!client.emailVerifiedAt && <VerifyBanner email={client.email} />}

      <Card>
        <h2 className="text-sm font-medium text-black/70 dark:text-white/70">
          С чего начать
        </h2>

        <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 text-sm text-black/70 dark:text-white/70">
          <li>Подтвердите почту — без неё сайт не развернётся.</li>
          <li>
            Заведите сайт: имя — поддомен на habibi-erp.com, приложения через
            запятую.{' '}
            <Link href="/dashboard" className="underline underline-offset-4">
              Мои сайты
            </Link>
          </li>
          <li>Дождитесь статуса «Работает» и войдите в свой Frappe.</li>
        </ol>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-black/70 dark:text-white/70">
          Сейчас в кабинете
        </h2>
        <p className="mt-3 text-sm text-black/60 dark:text-white/60">
          Сайтов: {sites.total} · работает {sites.byStatus.ACTIVE ?? 0} ·
          разворачивается {sites.byStatus.PROVISIONING ?? 0}
        </p>
      </Card>
    </div>
  );
}
