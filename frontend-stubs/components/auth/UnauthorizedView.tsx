import { useI18n } from '../../hooks/useI18n';

export interface UnauthorizedViewProps {
  /** Where to send the user when they click the primary CTA. Defaults to `/dashboard`. */
  homeHref?: string;
  /** Optional message shown above the title (e.g. role required). */
  detail?: string;
}

/**
 * 403 page rendered when middleware redirects an authenticated user
 * away from a route they cannot access. Mirrors the API response codes
 * in `shared/API_SPEC.md` (`401` → /signin, `403` → /forbidden).
 */
export function UnauthorizedView({ homeHref = '/dashboard', detail }: UnauthorizedViewProps) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="rounded-pill bg-priority-critical-bg px-3 py-1 text-xs font-semibold uppercase text-priority-critical-fg">
        403
      </span>
      <h1 className="text-2xl font-semibold text-fg">{t('auth.forbidden.title')}</h1>
      <p className="text-sm text-fg-soft">{detail ?? t('auth.forbidden.body')}</p>
      <a
        href={homeHref}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-strong"
      >
        {t('auth.forbidden.cta')}
      </a>
    </div>
  );
}
