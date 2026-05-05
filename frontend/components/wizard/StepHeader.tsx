'use client';

import { useI18n } from '../../hooks/useI18n';
import { PRIORITY_CHOICES, SHIFT_ORDER } from '../../lib/constants';
import type { Priority, Shift, UserSummary } from '../../lib/types';

export interface HeaderDraft {
  handoverDate: string;
  shift: Shift;
  overallPriority: Priority;
  handedToId: string | null;
  generalRemarks: string;
  nextShiftActions: string;
}

export interface StepHeaderProps {
  value: HeaderDraft;
  recipients: UserSummary[];
  onChange: (next: HeaderDraft) => void;
}

export function StepHeader({ value, recipients, onChange }: StepHeaderProps) {
  const { t } = useI18n();
  const update = <K extends keyof HeaderDraft>(key: K, next: HeaderDraft[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <section className="grid gap-4 rounded-md border border-line bg-bg-elev p-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-soft">{t('wizard.field.date')}</span>
        <input
          type="date"
          value={value.handoverDate}
          onChange={(e) => update('handoverDate', e.target.value)}
          className="rounded-md border border-line bg-bg-row px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-soft">{t('wizard.field.shift')}</span>
        <select
          value={value.shift}
          onChange={(e) => update('shift', e.target.value as Shift)}
          className="rounded-md border border-line bg-bg-row px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
        >
          {SHIFT_ORDER.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-soft">{t('wizard.field.priority')}</span>
        <select
          value={value.overallPriority}
          onChange={(e) => update('overallPriority', e.target.value as Priority)}
          className="rounded-md border border-line bg-bg-row px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
        >
          {PRIORITY_CHOICES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-soft">{t('wizard.field.handedTo')}</span>
        <select
          value={value.handedToId ?? ''}
          onChange={(e) => update('handedToId', e.target.value || null)}
          className="rounded-md border border-line bg-bg-row px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">{t('wizard.field.handedToPlaceholder')}</option>
          {recipients.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        <span className="text-fg-soft">{t('wizard.field.summary')}</span>
        <textarea
          rows={3}
          value={value.generalRemarks}
          onChange={(e) => update('generalRemarks', e.target.value)}
          placeholder={t('wizard.field.summaryHint')}
          className="rounded-md border border-line bg-bg-row px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        <span className="text-fg-soft">{t('wizard.field.nextActions')}</span>
        <textarea
          rows={3}
          value={value.nextShiftActions}
          onChange={(e) => update('nextShiftActions', e.target.value)}
          placeholder={t('wizard.field.nextActionsHint')}
          className="rounded-md border border-line bg-bg-row px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>
    </section>
  );
}
