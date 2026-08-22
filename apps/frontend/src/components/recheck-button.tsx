'use client';

import { useState, useTransition } from 'react';
import { api } from '@/lib/api';
import { StatusRow, type StatusKind } from './status-row';

type State =
  | { kind: 'idle' }
  | { kind: 'ok'; detail: string }
  | { kind: 'error'; detail: string };

/**
 * Проверяет путь «браузер -> /api -> NestJS», то есть что rewrite в
 * next.config.ts действительно работает. Запрос идёт из обработчика клика,
 * никаких эффектов на маунте.
 */
export function RecheckButton() {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [isPending, startTransition] = useTransition();

  const check = () => {
    startTransition(async () => {
      try {
        const health = await api.dbHealth();
        setState({ kind: 'ok', detail: health.now });
      } catch (error) {
        setState({
          kind: 'error',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    });
  };

  const kind: StatusKind = isPending ? 'pending' : state.kind;

  return (
    <div className="flex flex-col gap-3">
      <StatusRow
        kind={kind}
        label="браузер → /api → бэкенд"
        detail={state.kind === 'idle' ? undefined : state.detail}
      />
      <button
        type="button"
        onClick={check}
        disabled={isPending}
        className="self-start rounded-md border border-black/10 px-2.5 py-1 text-xs transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
      >
        {isPending ? 'Проверяем…' : 'Проверить из браузера'}
      </button>
    </div>
  );
}
