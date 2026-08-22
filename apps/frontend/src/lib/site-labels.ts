import type { SitePlan, SiteStatus } from './api';

export const SITE_STATUSES: SiteStatus[] = [
  'PROVISIONING',
  'ACTIVE',
  'FAILED',
  'SUSPENDED',
  'ARCHIVED',
];

export const SITE_PLANS: SitePlan[] = ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'];

export const SITE_STATUS_LABEL: Record<SiteStatus, string> = {
  PROVISIONING: 'Разворачивается',
  ACTIVE: 'Работает',
  FAILED: 'Не развернулся',
  SUSPENDED: 'Приостановлен',
  ARCHIVED: 'В архиве',
};

export const SITE_PLAN_LABEL: Record<SitePlan, string> = {
  TRIAL: 'Пробный',
  BASIC: 'Базовый',
  PRO: 'Про',
  ENTERPRISE: 'Корпоративный',
};

export const SITE_STATUS_BADGE: Record<SiteStatus, string> = {
  PROVISIONING:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  ACTIVE:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  FAILED: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  SUSPENDED: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  ARCHIVED:
    'bg-black/[0.04] text-black/60 dark:bg-white/10 dark:text-white/60 border-black/10 dark:border-white/15',
};
