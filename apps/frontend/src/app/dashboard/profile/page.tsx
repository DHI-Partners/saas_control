import { PasswordForm } from '@/components/dashboard/password-form';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { VerifyBanner } from '@/components/dashboard/verify-banner';
import { Card } from '@/components/ui';
import { requireProfile } from '@/lib/session';

export default async function ProfilePage() {
  const { client, sites } = await requireProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Профиль</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {client.email} · сайтов: {sites.total} · в кабинете с{' '}
          {new Date(client.createdAt).toLocaleDateString('ru-RU')}
        </p>
      </div>

      {!client.emailVerifiedAt && <VerifyBanner email={client.email} />}

      <Card>
        <h2 className="mb-4 text-sm font-medium text-black/70 dark:text-white/70">
          Данные клиента
        </h2>
        <ProfileForm client={client} />
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-medium text-black/70 dark:text-white/70">
          Смена пароля
        </h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
