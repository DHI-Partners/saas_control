import Link from 'next/link';
import { Suspense } from 'react';
import { BackendStatus } from '@/components/backend-status';
import { currentProfile } from '@/lib/session';

export default async function Home() {
  const profile = await currentProfile();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">SaaS Control</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Личный кабинет клиента: сайты Frappe, тарифы и статусы в одном месте.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {profile ? (
          <Link
            href="/dashboard"
            className="rounded-md bg-foreground px-3.5 py-2 font-medium text-background transition-opacity hover:opacity-85"
          >
            Открыть кабинет
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="rounded-md bg-foreground px-3.5 py-2 font-medium text-background transition-opacity hover:opacity-85"
            >
              Зарегистрироваться
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-black/10 px-3.5 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Войти
            </Link>
          </>
        )}
      </div>

      <Suspense
        fallback={
          <div className="text-sm text-black/50 dark:text-white/50">
            Проверяем бэкенд…
          </div>
        }
      >
        <BackendStatus />
      </Suspense>
    </main>
  );
}
