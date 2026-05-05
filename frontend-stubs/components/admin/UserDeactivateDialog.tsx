'use client';

import { useId, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { UserDetail } from '../../lib/types';

export interface UserDeactivateDialogProps {
  user: UserDetail | null;
  onClose: () => void;
  /** Async toggle. Receives the user; flip `isActive` server-side via `PATCH /api/v1/users/:id`. */
  onConfirm: (user: UserDetail) => Promise<void>;
}

/**
 * Confirmation dialog for soft-deleting (deactivating) a user. We never
 * hard-delete (AGENTS.md "Do Not"). When the user is already inactive,
 * the same dialog reactivates them.
 */
export function UserDeactivateDialog({ user, onClose, onConfirm }: UserDeactivateDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isReactivate = !user.isActive;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-md border border-line bg-bg-elev p-5 shadow-lg">
        <h2 id={titleId} className="mb-2 text-lg font-semibold text-fg">
          {isReactivate ? t('admin.action.reactivate') : t('admin.confirmDeactivate.title')}
        </h2>
        <p className="text-sm text-fg-soft">{t('admin.confirmDeactivate.body')}</p>
        <p className="mt-3 rounded-md bg-bg-row px-3 py-2 text-sm font-medium text-fg">
          {user.name} <span className="text-fg-faint">· {user.email}</span>
        </p>

        {error && (
          <div className="mt-3 rounded-md bg-priority-critical-bg px-3 py-2 text-sm text-priority-critical-fg">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-accent"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-md bg-priority-critical-fg px-3 py-1.5 text-sm font-medium text-bg-elev hover:opacity-90 disabled:opacity-50"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
