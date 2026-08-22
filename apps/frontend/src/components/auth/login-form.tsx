'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SubmitForm } from '../submit-form';
import { Field, inputClass } from '../ui';

export function LoginForm() {
  const router = useRouter();

  return (
    <SubmitForm
      submitLabel="Войти"
      pendingLabel="Входим…"
      action={(form) =>
        api.auth.login({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        })
      }
      onSuccess={() => {
        router.push('/dashboard');
        router.refresh();
      }}
    >
      <Field label="Почта">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="client@example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Пароль">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
    </SubmitForm>
  );
}
