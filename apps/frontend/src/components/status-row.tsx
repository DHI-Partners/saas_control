export type StatusKind = 'ok' | 'error' | 'pending' | 'idle';

const DOT: Record<StatusKind, string> = {
  ok: 'bg-emerald-500',
  error: 'bg-red-500',
  pending: 'animate-pulse bg-amber-400',
  idle: 'bg-black/20 dark:bg-white/25',
};

export function StatusRow({
  kind,
  label,
  detail,
}: {
  kind: StatusKind;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span
        aria-hidden
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[kind]}`}
      />
      <span className="min-w-0">
        <span className="text-black/70 dark:text-white/70">{label}</span>
        {detail && (
          <span className="ml-1.5 font-mono text-xs break-all text-black/60 dark:text-white/60">
            {detail}
          </span>
        )}
      </span>
    </div>
  );
}
