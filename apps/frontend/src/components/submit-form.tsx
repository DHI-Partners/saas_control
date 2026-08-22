'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { apiErrorMessages } from '@/lib/api';
import { Alert, Button } from './ui';

/**
 * Форма, которая шлёт данные в API: сабмит, ошибки бэкенда, блокировка
 * кнопки на время запроса. Сессия живёт в куке, её ставит и снимает сам
 * бэкенд через proxy /api, поэтому странице остаётся только router.refresh().
 */
export function SubmitForm({
  submitLabel,
  pendingLabel = 'Сохраняем…',
  action,
  onSuccess,
  successMessage,
  resetOnSuccess = false,
  aside,
  children,
}: {
  submitLabel: string;
  pendingLabel?: string;
  action: (form: FormData) => Promise<unknown>;
  onSuccess?: (result: unknown) => void;
  successMessage?: string;
  resetOnSuccess?: boolean;
  /** Кнопки рядом с основной: «Отмена», «Удалить». */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [succeeded, setSucceeded] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setErrors([]);
    setSucceeded(false);

    startTransition(async () => {
      try {
        const result = await action(form);
        if (resetOnSuccess) formElement.reset();
        setSucceeded(true);
        onSuccess?.(result);
      } catch (error) {
        setErrors(apiErrorMessages(error));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {children}

      {errors.length > 0 && (
        <Alert>
          <ul className="flex flex-col gap-1">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {succeeded && successMessage && (
        <Alert kind="success">{successMessage}</Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {aside}
      </div>
    </form>
  );
}

/** Пустое необязательное поле не отправляем: бэкенд оставит прежнее значение. */
export function optionalText(form: FormData, key: string): string | undefined {
  const value = String(form.get(key) ?? '').trim();
  return value === '' ? undefined : value;
}

/** То же, но для полей, которые можно очистить: пустое значение — null. */
export function nullableText(form: FormData, key: string): string | null {
  const value = String(form.get(key) ?? '').trim();
  return value === '' ? null : value;
}
