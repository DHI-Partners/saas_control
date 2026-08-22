import type { ComponentProps, ReactNode } from 'react';

/** Общие примитивы оформления: одна рамка и один радиус на весь кабинет. */

export const inputClass =
  'w-full rounded-md border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-black/30 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:placeholder:text-white/30 dark:focus:border-white/35';

/** Ссылка, которая выглядит как основная кнопка. */
export const linkButtonClass =
  'inline-flex items-center rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85';

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-black/10 bg-black/[0.02] p-6 dark:border-white/15 dark:bg-white/5 ${className}`}
    >
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-black/60 dark:text-white/60">
        {label}
      </span>
      {children}
      {hint && (
        <span className="text-xs text-black/45 dark:text-white/40">{hint}</span>
      )}
    </label>
  );
}

const BUTTON_VARIANT = {
  primary: 'bg-foreground text-background hover:opacity-85 disabled:opacity-40',
  secondary:
    'border border-black/10 hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10',
  danger:
    'border border-red-500/40 text-red-700 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300',
} as const;

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: keyof typeof BUTTON_VARIANT }) {
  return (
    <button
      {...props}
      className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${BUTTON_VARIANT[variant]} ${className}`}
    />
  );
}

const ALERT_KIND = {
  error: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  info: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
} as const;

export function Alert({
  kind = 'error',
  children,
}: {
  kind?: keyof typeof ALERT_KIND;
  children: ReactNode;
}) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-md border px-3 py-2 text-sm ${ALERT_KIND[kind]}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
