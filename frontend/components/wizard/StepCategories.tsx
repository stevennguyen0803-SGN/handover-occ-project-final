'use client';

import { useI18n } from '../../hooks/useI18n';
import { CATEGORIES } from '../../lib/constants';
import { cn } from '../../lib/cn';
import type { CategoryCode } from '../../lib/types';

/**
 * Per-category draft: enabled or not + opaque count of items the user
 * has filled in. The actual item editor lives in your existing form
 * stack; this step just tracks which categories will appear.
 */
export interface CategoryDraft {
  enabled: boolean;
  itemCount: number;
}

export interface StepCategoriesProps {
  value: Partial<Record<CategoryCode, CategoryDraft>>;
  onChange: (next: Partial<Record<CategoryCode, CategoryDraft>>) => void;
}

export function StepCategories({ value, onChange }: StepCategoriesProps) {
  const { t } = useI18n();

  const toggle = (code: CategoryCode) => {
    const current = value[code] ?? { enabled: false, itemCount: 0 };
    onChange({ ...value, [code]: { ...current, enabled: !current.enabled } });
  };

  return (
    <section className="rounded-md border border-line bg-bg-elev p-4">
      <p className="mb-3 text-sm text-fg-mute">{t('wizard.cat.toggleHint')}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const draft = value[cat.code] ?? { enabled: false, itemCount: 0 };
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => toggle(cat.code)}
              className={cn(
                'flex items-start justify-between gap-3 rounded-md border p-3 text-left transition',
                draft.enabled
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-bg-row text-fg-soft hover:border-accent'
              )}
            >
              <div>
                <div className="text-sm font-semibold">{cat.longLabel}</div>
                <div className="text-xs opacity-80">{cat.hint}</div>
              </div>
              <div className="text-xs">
                {draft.enabled
                  ? t('wizard.cat.itemCount', { n: draft.itemCount })
                  : t('wizard.cat.enable')}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
