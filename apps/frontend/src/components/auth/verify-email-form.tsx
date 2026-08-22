'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SubmitForm } from '../submit-form';

/**
 * Подтверждение — по кнопке, а не автоматически при открытии: почтовые
 * сканеры ходят по ссылкам из писем сами, и токен сгорал бы до клиента.
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const router = useRouter();

  return (
    <SubmitForm
      submitLabel="Подтвердить почту"
      pendingLabel="Подтверждаем…"
      successMessage="Почта подтверждена — можно продолжать работу в кабинете."
      action={() => api.auth.verifyEmail(token)}
      onSuccess={() => router.refresh()}
    >
      <p className="text-sm text-black/60 dark:text-white/60">
        Нажмите кнопку, чтобы подтвердить адрес почты.
      </p>
    </SubmitForm>
  );
}
