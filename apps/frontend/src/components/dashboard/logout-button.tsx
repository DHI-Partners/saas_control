'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { api } from '@/lib/api';
import { Button } from '../ui';

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          // ошибку глотаем осознанно: кука всё равно сбрасывается ответом,
          // а на странице входа сессия уже не нужна
          await api.auth.logout().catch(() => undefined);
          router.push('/login');
          router.refresh();
        })
      }
    >
      {pending ? 'Выходим…' : 'Выйти'}
    </Button>
  );
}
