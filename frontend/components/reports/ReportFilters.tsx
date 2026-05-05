'use client';

import { useI18n } from '../../hooks/useI18n';
import { CATEGORIES, PRIORITY_CHOICES, SHIFT_ORDER } from '../../lib/constants';
import type { ReportFiltersValue } from '../../lib/types';

export interface ReportFiltersProps {
  value: ReportFiltersValue;
  onChange: (next: ReportFiltersValue) => void;
  onApply?: () => void;
  onReset?: () => void;
}

export const DEFAULT_REPORT_FILTERS: ReportFiltersValue = {
  dateFrom: null,
  dateTo: null,
  shift: 'All',
  priority: 'All',
  category: 'All',
  preparedById: null,
  openOnly: false,
  carryForwardOnly: false,
};

/**
 * Filter form for the Reports page. Output is a `ReportFiltersValue`
 * which the page should round-trip through the URL search params so
 * exports are reproducible (the CSV endpoint accepts the same query).
 */
export function ReportFilters({ value, onChange, onApply, onReset }: ReportFiltersProps) {
  const { t } = useI18n();

  const update = <K extends keyof ReportFiltersValue>(key: K, next: ReportFiltersValue[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <form
      className="flex flex-col gap-3 rounded-md border border-line bg-bg-elev p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onApply?.();
      }}
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-fg-mute">
          <span>{t('reports.filter.dateFrom')}</span>
          <input
            type="date"
            value={value.dateFrom ?? ''}
            onChange={(e) => update('dateFrom', e.target.value || null)}
            className="rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-fg-mute">
          <span>{t('reports.filter.dateTo')}</span>
          <input
            type="date"
            value={value.dateTo ?? ''}
            onChange={(e) => update('dateTo', e.target.value || null)}
            className="rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-fg-mute">
          <span>{t('reports.filter.shift')}</span>
          <select
            value={value.shift}
            onChange={(e) => update('shift', e.target.value as ReportFiltersValue['shift'])}
            className="min-w-[140px] rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-fg"
          >
            <option value="All">{t('common.all')}</option>
            {SHIFT_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-fg-mute">
          <span>{t('reports.filter.priority')}</span>
          <select
            value={value.priority}
            onChange={(e) => update('priority', e.target.value as ReportFiltersValue['priority'])}
            className="min-w-[140px] rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-fg"
          >
            <option value="All">{t('common.all')}</option>
            {PRIORITY_CHOICES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-fg-mute">
          <span>{t('reports.filter.category')}</span>
          <select
            value={value.category}
            onChange={(e) => update('category', e.target.value as ReportFiltersValue['category'])}
            className="min-w-[180px] rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-fg"
          >
            <option value="All">{t('common.all')}</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.longLabel}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-fg-soft">
          <input
            type="checkbox"
            checked={value.openOnly}
            onChange={(e) => update('openOnly', e.target.checked)}
          />
          {t('reports.filter.openOnly')}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-fg-soft">
          <input
            type="checkbox"
            checked={value.carryForwardOnly}
            onChange={(e) => update('carryForwardOnly', e.target.checked)}
          />
          {t('reports.filter.carryForwardOnly')}
        </label>

        <div className="ml-auto flex gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
            >
              {t('reports.filter.reset')}
            </button>
          )}
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong"
          >
            {t('reports.filter.apply')}
          </button>
        </div>
      </div>
    </form>
  );
}
