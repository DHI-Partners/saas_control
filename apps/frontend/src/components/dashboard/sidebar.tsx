'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Боковое меню кабинета. Активный пункт считаем по pathname, поэтому
 * компонент клиентский — сам layout остаётся серверным.
 */

type NavItem = {
  href:
    | '/dashboard/welcome'
    | '/dashboard'
    | '/dashboard/billing'
    | '/dashboard/profile'
    | '/dashboard/status';
  label: string;
  icon: ReactNode;
  /** Вложенные разделы, которые подсвечивают тот же пункт. */
  match?: string;
};

const NAV: NavItem[] = [
  { href: '/dashboard/welcome', label: 'Добро пожаловать', icon: <HomeIcon /> },
  {
    href: '/dashboard',
    label: 'Сайты',
    icon: <SitesIcon />,
    match: '/dashboard/sites',
  },
  { href: '/dashboard/billing', label: 'Оплата', icon: <BillingIcon /> },
  { href: '/dashboard/profile', label: 'Настройки', icon: <SettingsIcon /> },
  { href: '/dashboard/status', label: 'Статус', icon: <StatusIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:pb-0">
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.match ? pathname.startsWith(item.match) : false);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-black/[0.06] font-medium text-foreground dark:bg-white/10'
                : 'text-black/60 hover:bg-black/[0.03] dark:text-white/60 dark:hover:bg-white/5'
            }`}
          >
            <span aria-hidden className="shrink-0 opacity-70">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Иконки: 16px, обводкой в цвет текста — чтобы жили в обеих темах. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <Icon>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Icon>
  );
}

function SitesIcon() {
  return (
    <Icon>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 6.5h.01" />
    </Icon>
  );
}

function BillingIcon() {
  return (
    <Icon>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6.5 14.5h4" />
    </Icon>
  );
}

function SettingsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47 1z" />
    </Icon>
  );
}

function StatusIcon() {
  return (
    <Icon>
      <path d="M3 12h3.5l2.5 7 4-14 2.5 7H21" />
    </Icon>
  );
}
