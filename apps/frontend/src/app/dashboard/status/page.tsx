import { Suspense } from 'react';
import { BackendStatus } from '@/components/backend-status';

export const metadata = { title: 'Статус — SaaS Control' };

export default function StatusPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Статус</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Живая проверка связи кабинета с API.
        </p>
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
    </div>
  );
}
