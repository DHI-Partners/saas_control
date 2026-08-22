import Link from 'next/link';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';
import { Alert, Card } from '@/components/ui';

export const metadata = { title: 'Подтверждение почты — SaaS Control' };

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<'/verify-email'>) {
  const { token } = await searchParams;
  const value = typeof token === 'string' ? token : '';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Подтверждение почты</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Ссылка из письма действует 24 часа.
        </p>
      </div>

      <Card>
        {value ? (
          <VerifyEmailForm token={value} />
        ) : (
          <Alert>
            В ссылке нет токена — откройте письмо ещё раз или запросите новое
            письмо в кабинете.
          </Alert>
        )}
      </Card>

      <p className="text-sm text-black/60 dark:text-white/60">
        <Link href="/dashboard" className="underline underline-offset-4">
          Вернуться в кабинет
        </Link>
      </p>
    </main>
  );
}
