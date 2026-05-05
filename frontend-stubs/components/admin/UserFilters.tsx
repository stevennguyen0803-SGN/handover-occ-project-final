'use client';

import { useI18n } from '../../hooks/useI18n';
import { FilterChip } from '../ui/FilterChip';
import type { UserFiltersValue, UserRole } from '../../lib/types';

export interface UserFiltersProps {
  value: UserFiltersValue;
  onChange: (next: UserFiltersValue) => void;
  /** Optional counts for the role chips, keyed by `UserRole` plus `'All'`. */
  counts?: Partial<Record<UserRole | 'All', number>>;
}

const ROLE_CHIPS: ReadonlyArray<{ id: UserRole | 'All'; key: 'common.all' | `admin.role.${UserRole}` }> = [
  { id: 'All', key: 'common.all' },
  { id: 'OCC_STAFF', key: 'admin.role.OCC_STAFF' },
  { id: 'SUPERVISOR', key: 'admin.role.SUPERVISOR' },
  { id: 'MANAGEMENT_VIEWER', key: 'admin.role.MANAGEMENT_VIEWER' },
  { id: 'ADMIN', key: 'admin.role.ADMIN' },
];

/**
 * Search + role chips + status select.
 *
 * Designed as a controlled component — your page wires `onChange` to URL
 * search params if you want shareable links to filtered user lists.
 */
export function UserFilters({ value, onChange, counts = {} }: UserFiltersProps) {
  const { t } = useI18n();

  const update = <K extends keyof UserFiltersValue>(key: K, next: UserFiltersValue[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_CHIPS.map((chip) => (
          <FilterChip
            key={chip.id}
            label={t(chip.key)}
            count={counts[chip.id]}
            active={value.role === chip.id}
            onToggle={() => update('role', chip.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 min-w-[220px] flex-col text-xs text-fg-mute">
          <span className="sr-only">{t('common.search')}</span>
          <input
            type="search"
            placeholder={t('admin.filter.searchPlaceholder')}
            value={value.search}
            onChange={(e) => update('search', e.target.value)}
            className="rounded-md border border-line bg-bg-elev px-3 py-1.5 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col text-xs text-fg-mute">
          <span>{t('admin.filter.status')}</span>
          <select
            value={value.status}
            onChange={(e) => update('status', e.target.value as UserFiltersValue['status'])}
            className="min-w-[140px] rounded-md border border-line bg-bg-elev px-2 py-1.5 text-sm"
          >
            <option value="All">{t('common.all')}</option>
            <option value="Active">{t('admin.status.active')}</option>
            <option value="Inactive">{t('admin.status.inactive')}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
