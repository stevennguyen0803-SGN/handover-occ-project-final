'use client';

import { useI18n } from '../../hooks/useI18n';
import type { UserRole } from '../../lib/types';

const ROLES: ReadonlyArray<UserRole> = ['OCC_STAFF', 'SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'];

export interface RoleSwitcherProps {
  current: UserRole;
  onChange: (next: UserRole) => void;
  /** When false, the component renders nothing. Default: `process.env.NODE_ENV !== 'production'`. */
  enabled?: boolean;
}

/**
 * Dev-only role switcher. Renders a small chip group that lets the
 * developer impersonate a role without going through Auth.js. Hard-
 * gated to non-production environments by default — wire up a feature
 * flag if you also need it on staging.
 *
 * NOTE: This is for **frontend-only** UI testing of role gating. The
 * server still enforces role via the JWT/session — switching here does
 * NOT change the actual `auth()` session.
 */
export function RoleSwitcher({
  current,
  onChange,
  enabled = process.env.NODE_ENV !== 'production',
}: RoleSwitcherProps) {
  const { t } = useI18n();
  if (!enabled) return null;

  return (
    <fieldset
      className="fixed bottom-4 left-4 z-40 flex flex-wrap items-center gap-1 rounded-md border border-dashed border-line bg-bg-elev/95 px-2 py-1 text-xs shadow-soft"
      aria-label={t('auth.devRoleSwitcher')}
    >
      <legend className="px-1 text-[10px] uppercase tracking-wider text-fg-mute">DEV</legend>
      {ROLES.map((r) => (
        <label
          key={r}
          className={`cursor-pointer rounded-pill px-2 py-0.5 ${
            current === r ? 'bg-accent text-accent-fg' : 'text-fg-soft hover:text-fg'
          }`}
        >
          <input
            type="radio"
            name="dev-role"
            value={r}
            checked={current === r}
            onChange={() => onChange(r)}
            className="sr-only"
          />
          {t(`admin.role.${r}`)}
        </label>
      ))}
    </fieldset>
  );
}
