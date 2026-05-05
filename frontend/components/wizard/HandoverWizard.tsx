'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../ui/Toast';
import { WizardStepper, type WizardStep } from './WizardStepper';
import { StepHeader, type HeaderDraft } from './StepHeader';
import { StepCategories, type CategoryDraft } from './StepCategories';
import { StepReview } from './StepReview';
import type { CategoryCode, Priority, Shift, UserSummary } from '../../lib/types';

export interface HandoverDraft {
  handoverDate: string;
  shift: Shift;
  overallPriority: Priority;
  handedToId: string | null;
  generalRemarks: string;
  nextShiftActions: string;
  categories: Partial<Record<CategoryCode, CategoryDraft>>;
}

export interface HandoverWizardProps {
  initialDraft?: Partial<HandoverDraft>;
  /** Eligible recipients for handover (typically all SUPERVISOR / OCC_STAFF). */
  recipients: UserSummary[];
  /**
   * Submits the draft. The server is responsible for generating
   * `referenceId` (BR-02). Return value is the new handover row.
   */
  submitDraft: (draft: HandoverDraft) => Promise<{ id: string; referenceId: string }>;
  saveDraft?: (draft: HandoverDraft) => Promise<void>;
}

const EMPTY_DRAFT: HandoverDraft = {
  handoverDate: new Date().toISOString().slice(0, 10),
  shift: 'Morning',
  overallPriority: 'Normal',
  handedToId: null,
  generalRemarks: '',
  nextShiftActions: '',
  categories: {},
};

/**
 * Three-step wizard: Header → Categories → Review.
 * Mirrors the prototype flow. The wizard never sets `referenceId`; the
 * server returns one after creation and we navigate to its detail page.
 */
export function HandoverWizard({ initialDraft, recipients, submitDraft, saveDraft }: HandoverWizardProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<HandoverDraft>({ ...EMPTY_DRAFT, ...initialDraft });
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const steps: WizardStep[] = useMemo(
    () => [
      { id: 'header', label: t('wizard.step.header') },
      { id: 'categories', label: t('wizard.step.categories') },
      { id: 'review', label: t('wizard.step.review') },
    ],
    [t]
  );

  const updateHeader = (next: HeaderDraft) =>
    setDraft((prev) => ({
      ...prev,
      handoverDate: next.handoverDate,
      shift: next.shift,
      overallPriority: next.overallPriority,
      handedToId: next.handedToId,
      generalRemarks: next.generalRemarks,
      nextShiftActions: next.nextShiftActions,
    }));

  const updateCategories = (categories: HandoverDraft['categories']) =>
    setDraft((prev) => ({ ...prev, categories }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const created = await submitDraft(draft);
      push({ tone: 'success', title: t('toast.created'), body: created.referenceId });
      router.push(`/handover/${created.id}`);
    } catch (err) {
      push({
        tone: 'error',
        title: 'Submit failed',
        body: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">{t('wizard.title')}</h1>
          <p className="text-sm text-fg-mute">{t('wizard.subtitle')}</p>
        </div>
        <WizardStepper
          steps={steps}
          currentIndex={stepIndex}
          onStepClick={(i) => i <= stepIndex && setStepIndex(i)}
        />
      </header>

      {stepIndex === 0 && (
        <StepHeader
          value={{
            handoverDate: draft.handoverDate,
            shift: draft.shift,
            overallPriority: draft.overallPriority,
            handedToId: draft.handedToId,
            generalRemarks: draft.generalRemarks,
            nextShiftActions: draft.nextShiftActions,
          }}
          recipients={recipients}
          onChange={updateHeader}
        />
      )}
      {stepIndex === 1 && (
        <StepCategories value={draft.categories} onChange={updateCategories} />
      )}
      {stepIndex === 2 && <StepReview draft={draft} recipients={recipients} />}

      <footer className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => router.push('/log')}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
        >
          {t('wizard.cancel')}
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
            >
              {t('wizard.back')}
            </button>
          )}
          {saveDraft && (
            <button
              type="button"
              onClick={() => saveDraft(draft)}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
            >
              {t('wizard.saveDraft')}
            </button>
          )}
          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg shadow-soft hover:bg-accent-strong"
            >
              {t('wizard.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-pill bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg shadow-soft hover:bg-accent-strong disabled:opacity-60"
            >
              {submitting ? '…' : t('wizard.submit')}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
