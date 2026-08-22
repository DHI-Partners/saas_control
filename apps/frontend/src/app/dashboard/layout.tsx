import Link from 'next/link';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { Sidebar } from '@/components/dashboard/sidebar';
import { requireProfile } from '@/lib/session';

export const metadata = { title: 'Личный кабинет — SaaS Control' };

export default async function DashboardLayout({
  children,
}: LayoutProps<'/dashboard'>) {
  const { client } = await requireProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-4 p-4">
          <Link href="/dashboard" className="font-semibold">
            SaaS Control
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-black/60 sm:inline dark:text-white/60">
              {client.name ?? client.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-6">
        <Sidebar />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
