'use client';

import { useI18n } from '../../hooks/useI18n';
import { Badge } from '../ui/Badge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { CATEGORIES } from '../../lib/constants';
import type { UserSummary } from '../../lib/types';
import type { HandoverDraft } from './HandoverWizard';

export interface StepReviewProps {
  draft: HandoverDraft;
  recipients: UserSummary[];
}

export function StepReview({ draft, recipients }: StepReviewProps) {
  const { t } = useI18n();
  const handedTo = recipients.find((r) => r.id === draft.handedToId);
  const enabledCategories = CATEGORIES.filter((c) => draft.categories[c.code]?.enabled);

  return (
    <section className="rounded-md border border-line bg-bg-elev p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-fg">{t('wizard.step.header')}</h3>
          <dl className="mt-2 text-xs text-fg-soft">
            <div className="flex gap-2"><dt className="text-fg-mute w-24">{t('detail.reference')}</dt><dd>{t('wizard.review.refPlaceholder')}</dd></div>
            <div className="flex gap-2"><dt className="text-fg-mute w-24">{t('wizard.field.date')}</dt><dd>{draft.handoverDate}</dd></div>
            <div className="flex gap-2"><dt className="text-fg-mute w-24">{t('wizard.field.shift')}</dt><dd>{draft.shift}</dd></div>
            <div className="flex gap-2 items-center"><dt className="text-fg-mute w-24">{t('wizard.field.priority')}</dt><dd><PriorityBadge priority={draft.overallPriority} /></dd></div>
            <div className="flex gap-2"><dt className="text-fg-mute w-24">{t('wizard.field.handedTo')}</dt><dd>{handedTo?.name ?? '—'}</dd></div>
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-fg">{t('wizard.step.categories')}</h3>
          {enabledCategories.length === 0 ? (
            <p className="mt-2 text-xs text-fg-mute">No categories enabled yet.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {enabledCategories.map((c) => (
                <Badge key={c.code} tone="neutral">
                  {c.longLabel} · {draft.categories[c.code]?.itemCount ?? 0}
                </Badge>
              ))}
            </ul>
          )}
        </div>
      </div>
      {draft.generalRemarks && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-mute">{t('wizard.field.summary')}</h4>
          <p className="mt-1 text-sm text-fg-soft">{draft.generalRemarks}</p>
        </div>
      )}
      {draft.nextShiftActions && (
        <div className="mt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-fg-mute">{t('wizard.field.nextActions')}</h4>
          <p className="mt-1 text-sm text-fg-soft">{draft.nextShiftActions}</p>
        </div>
      )}
      <p className="mt-4 rounded-md border border-line-soft bg-bg-row px-3 py-2 text-xs text-fg-mute">
        {t('wizard.review.note')}
      </p>
    </section>
  );
}
