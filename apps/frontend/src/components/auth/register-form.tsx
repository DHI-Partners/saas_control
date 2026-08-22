'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SubmitForm, optionalText } from '../submit-form';
import { Field, inputClass } from '../ui';

export function RegisterForm() {
  const router = useRouter();

  return (
    <SubmitForm
      submitLabel="Зарегистрироваться"
      pendingLabel="Создаём кабинет…"
      action={(form) =>
        api.auth.register({
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
          name: optionalText(form, 'name'),
        })
      }
      onSuccess={() => {
        router.push('/dashboard');
        router.refresh();
      }}
    >
      <Field label="Почта" hint="На неё придёт письмо со ссылкой подтверждения">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="client@example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Пароль" hint="Не короче 8 символов">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className={inputClass}
        />
      </Field>

      <Field label="Имя">
        <input
          name="name"
          type="text"
          autoComplete="name"
          maxLength={120}
          className={inputClass}
        />
      </Field>
    </SubmitForm>
  );
}
