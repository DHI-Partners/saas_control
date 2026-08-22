'use client';

import { api } from '@/lib/api';
import { SubmitForm } from '../submit-form';
import { Field, inputClass } from '../ui';

export function PasswordForm() {
  return (
    <SubmitForm
      submitLabel="Сменить пароль"
      successMessage="Пароль изменён"
      resetOnSuccess
      action={(form) =>
        api.me.changePassword({
          currentPassword: String(form.get('currentPassword') ?? ''),
          newPassword: String(form.get('newPassword') ?? ''),
        })
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Текущий пароль">
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </Field>

        <Field label="Новый пароль" hint="Не короче 8 символов">
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className={inputClass}
          />
        </Field>
      </div>
    </SubmitForm>
  );
}
