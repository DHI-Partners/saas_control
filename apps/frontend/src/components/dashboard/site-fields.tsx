import type { Site } from '@/lib/api';
import {
  SITE_PLANS,
  SITE_PLAN_LABEL,
  SITE_STATUSES,
  SITE_STATUS_LABEL,
} from '@/lib/site-labels';
import { Field, inputClass } from '../ui';

/** Все сайты живут на одном домене: клиент выбирает только поддомен. */
export const SITE_DOMAIN_SUFFIX = '.habibi-erp.com';

/** Рамка вокруг инпута с приклеенным суффиксом домена. */
const suffixWrapClass =
  'flex w-full items-center rounded-md border border-black/10 bg-white/60 px-3 text-sm transition-colors focus-within:border-black/30 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-white/35';

/** «crm.habibi-erp.com» -> «crm» */
export function siteSubdomain(name?: string): string {
  if (!name) return '';
  return name.endsWith(SITE_DOMAIN_SUFFIX)
    ? name.slice(0, -SITE_DOMAIN_SUFFIX.length)
    : name;
}

/** Поддомен из формы -> полное имя сайта. */
export function siteName(form: FormData): string {
  const subdomain = String(form.get('subdomain') ?? '')
    .trim()
    .toLowerCase();
  return `${subdomain}${SITE_DOMAIN_SUFFIX}`;
}

/** Поля сайта: одинаковые в форме создания и в форме правки. */
export function SiteFields({
  site,
  withStatus = false,
}: {
  site?: Site;
  withStatus?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Имя сайта" hint="Только поддомен: латиница, цифры и дефис">
        <div className={suffixWrapClass}>
          <input
            name="subdomain"
            required
            defaultValue={siteSubdomain(site?.name)}
            placeholder="crm"
            pattern="[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?"
            title="Латиница, цифры и дефис; начинается и заканчивается буквой или цифрой"
            maxLength={63}
            className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-black/35 dark:placeholder:text-white/30"
          />
          <span className="shrink-0 pl-1 text-black/45 dark:text-white/40">
            {SITE_DOMAIN_SUFFIX}
          </span>
        </div>
      </Field>

      <Field label="Тариф">
        <select
          name="plan"
          defaultValue={site?.plan ?? 'TRIAL'}
          className={inputClass}
        >
          {SITE_PLANS.map((plan) => (
            <option key={plan} value={plan}>
              {SITE_PLAN_LABEL[plan]}
            </option>
          ))}
        </select>
      </Field>

      {withStatus && (
        <Field label="Статус">
          <select
            name="status"
            defaultValue={site?.status ?? 'PROVISIONING'}
            className={inputClass}
          >
            {SITE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SITE_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Приложения" hint="Через запятую: erpnext, hrms">
        <input
          name="apps"
          defaultValue={site?.apps.join(', ') ?? ''}
          placeholder="erpnext, hrms"
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Заметки">
          <textarea
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={site?.notes ?? ''}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

/** «erpnext, hrms» -> ['erpnext', 'hrms'] */
export function parseApps(form: FormData): string[] {
  return String(form.get('apps') ?? '')
    .split(/[\s,]+/)
    .filter(Boolean);
}
