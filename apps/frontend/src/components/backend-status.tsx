import { serverApi } from '@/lib/api.server';
import { RecheckButton } from './recheck-button';
import { StatusRow } from './status-row';

/**
 * Серверная часть проверки: Next дёргает NestJS напрямую при рендере.
 */
export async function BackendStatus() {
  let serverCheck: { ok: boolean; detail: string };

  try {
    const health = await serverApi.dbHealth();
    serverCheck = { ok: true, detail: health.now };
  } catch (error) {
    serverCheck = {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  return (
    <section className="w-full max-w-lg rounded-xl border border-black/10 bg-black/[0.02] p-6 dark:border-white/15 dark:bg-white/5">
      <h2 className="text-sm font-medium text-black/70 dark:text-white/70">
        Связь с NestJS API
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        <StatusRow
          kind={serverCheck.ok ? 'ok' : 'error'}
          label="сервер Next → бэкенд"
          detail={serverCheck.detail}
        />
        <RecheckButton />
      </div>
    </section>
  );
}
