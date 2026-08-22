'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  api,
  apiErrorMessages,
  type Site,
  type SitePlan,
  type SiteStatus,
} from '@/lib/api';
import { SubmitForm, nullableText } from '../submit-form';
import { Alert, Button } from '../ui';
import { SiteFields, parseApps, siteName } from './site-fields';

export function SiteEditForm({ site }: { site: Site }) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDeleting] = useTransition();

  function remove() {
    if (!confirm(`Удалить сайт ${site.name} из кабинета?`)) return;

    startDeleting(async () => {
      try {
        await api.sites.remove(site.id);
        router.push('/dashboard');
        router.refresh();
      } catch (error) {
        setDeleteError(apiErrorMessages(error)[0]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SubmitForm
        submitLabel="Сохранить"
        successMessage="Изменения сохранены"
        action={(form) =>
          api.sites.update(site.id, {
            name: siteName(form),
            status: String(form.get('status') ?? site.status) as SiteStatus,
            plan: String(form.get('plan') ?? site.plan) as SitePlan,
            apps: parseApps(form),
            notes: nullableText(form, 'notes'),
          })
        }
        onSuccess={() => router.refresh()}
        aside={
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={remove}
          >
            {deleting ? 'Удаляем…' : 'Удалить сайт'}
          </Button>
        }
      >
        <SiteFields site={site} withStatus />
      </SubmitForm>

      {deleteError && <Alert>{deleteError}</Alert>}
    </div>
  );
}
