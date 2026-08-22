import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { Card } from '@/components/ui';
import { currentProfile } from '@/lib/session';

export const metadata = { title: 'Регистрация — SaaS Control' };

export default async function RegisterPage() {
  if (await currentProfile()) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Регистрация</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Кабинет открывается сразу, письмо с подтверждением почты придёт
          следом.
        </p>
      </div>

      <Card>
        <RegisterForm />
      </Card>

      <p className="text-sm text-black/60 dark:text-white/60">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="underline underline-offset-4">
          Войти
        </Link>
      </p>
    </main>
  );
}
