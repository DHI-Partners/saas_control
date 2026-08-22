import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Card } from '@/components/ui';
import { currentProfile } from '@/lib/session';

export const metadata = { title: 'Вход — SaaS Control' };

export default async function LoginPage() {
  if (await currentProfile()) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Вход в кабинет</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Логин — почта, указанная при регистрации.
        </p>
      </div>

      <Card>
        <LoginForm />
      </Card>

      <p className="text-sm text-black/60 dark:text-white/60">
        Нет аккаунта?{' '}
        <Link href="/register" className="underline underline-offset-4">
          Зарегистрироваться
        </Link>
      </p>
    </main>
  );
}
