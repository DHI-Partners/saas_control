'use client';

import { useState, useTransition } from 'react';
import { api, apiErrorMessages } from '@/lib/api';
import { Alert, Button } from '../ui';

/** Почта не подтверждена — предлагаем переотправить письмо. */
export function VerifyBanner({ email }: { email: string }) {
  const [state, setState] = useState<{
    kind: 'idle' | 'sent' | 'error';
    text?: string;
  }>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  if (state.kind === 'sent') {
    return (
      <Alert kind="success">
        Письмо отправлено на {email}. Ссылка действует 24 часа.
      </Alert>
    );
  }

  return (
    <Alert kind="info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          Почта {email} не подтверждена — перейдите по ссылке из письма.
          {state.kind === 'error' && ` Ошибка: ${state.text}`}
        </span>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await api.auth.resendVerification();
                setState({ kind: 'sent' });
              } catch (error) {
                setState({ kind: 'error', text: apiErrorMessages(error)[0] });
              }
            })
          }
        >
          {pending ? 'Отправляем…' : 'Отправить письмо ещё раз'}
        </Button>
      </div>
    </Alert>
  );
}
