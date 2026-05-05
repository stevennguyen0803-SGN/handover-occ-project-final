'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../ui/Toast';

export interface AcknowledgeButtonProps {
  /**
   * Server action / fetch wrapper. Must POST to
   * `/api/v1/handovers/:id/acknowledge` and return the new
   * `acknowledgedAt` ISO string.
   *
   * Intentionally async + injectable so the same component can be
   * unit-tested with a stub and used with React Server Actions or
   * client-side fetch in production.
   */
  acknowledge: () => Promise<{ acknowledgedAt: string; referenceId: string }>;
  /** Hide the button when the current user can't acknowledge (e.g. own handover, BR-10). */
  disabled?: boolean;
  /** Hide entirely once acknowledged so we don't double-fire. */
  alreadyAcknowledged?: boolean;
}

export function AcknowledgeButton({ acknowledge, disabled, alreadyAcknowledged }: AcknowledgeButtonProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [pending, setPending] = useState(false);

  if (alreadyAcknowledged) return null;

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={async () => {
        setPending(true);
        try {
          const result = await acknowledge();
          push({
            tone: 'success',
            title: t('toast.acknowledged'),
            body: result.referenceId,
          });
        } catch (err) {
          push({
            tone: 'error',
            title: 'Acknowledge failed',
            body: err instanceof Error ? err.message : String(err),
          });
        } finally {
          setPending(false);
        }
      }}
      className="inline-flex items-center gap-2 rounded-pill bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg shadow-soft transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true">✓</span>
      <span>{t('detail.acknowledge')}</span>
    </button>
  );
}
