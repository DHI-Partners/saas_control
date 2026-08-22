'use client';

import { useRouter } from 'next/navigation';
import { api, type Client } from '@/lib/api';
import { SubmitForm } from '../submit-form';
import { Field, inputClass } from '../ui';

export function ProfileForm({ client }: { client: Client }) {
  const router = useRouter();

  return (
    <SubmitForm
      submitLabel="Сохранить"
      successMessage="Профиль обновлён"
      action={(form) =>
        api.me.update({
          name: String(form.get('name') ?? '').trim(),
        })
      }
      onSuccess={() => router.refresh()}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя">
          <input
            name="name"
            defaultValue={client.name ?? ''}
            maxLength={120}
            className={inputClass}
          />
        </Field>
      </div>
    </SubmitForm>
  );
}
