'use client';

import { useEffect, useId, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { UserCreateInput, UserDetail, UserRole, UserUpdateInput } from '../../lib/types';

const ROLES: ReadonlyArray<UserRole> = ['OCC_STAFF', 'SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'];

export type UserFormResult =
  | { mode: 'create'; payload: UserCreateInput }
  | { mode: 'edit'; userId: string; payload: UserUpdateInput };

export interface UserFormDialogProps {
  /** When `null` the dialog is closed. When set, opens in the matching mode. */
  open: { mode: 'create' } | { mode: 'edit'; user: UserDetail } | null;
  onClose: () => void;
  onSubmit: (result: UserFormResult) => Promise<void> | void;
}

interface FormState {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

const EMPTY: FormState = { name: '', email: '', role: 'OCC_STAFF', password: '' };

/**
 * Modal-style form for creating or editing a user. Lightweight (no Radix
 * dependency) so it ports cleanly into any setup. Replace the outer
 * `<dialog>` with your project's modal component if you already have one.
 */
export function UserFormDialog({ open, onClose, onSubmit }: UserFormDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [state, setState] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (open.mode === 'edit') {
      setState({ name: open.user.name, email: open.user.email, role: open.user.role, password: '' });
    } else {
      setState(EMPTY);
    }
    setError(null);
  }, [open]);

  if (!open) return null;

  const isEdit = open.mode === 'edit';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!state.name.trim() || !state.email.trim()) {
      setError(t('common.required'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        const payload: UserUpdateInput = {
          name: state.name.trim(),
          email: state.email.trim(),
          role: state.role,
        };
        if (state.password) payload.password = state.password;
        await onSubmit({ mode: 'edit', userId: open.user.id, payload });
      } else {
        const payload: UserCreateInput = {
          name: state.name.trim(),
          email: state.email.trim(),
          role: state.role,
        };
        if (state.password) payload.password = state.password;
        await onSubmit({ mode: 'create', payload });
      }
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
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-md border border-line bg-bg-elev p-5 shadow-lg"
      >
        <h2 id={titleId} className="mb-4 text-lg font-semibold text-fg">
          {isEdit ? t('admin.editUser') : t('admin.createUser')}
        </h2>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-mute">{t('admin.field.name')}</span>
            <input
              type="text"
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              required
              className="rounded-md border border-line bg-bg px-2 py-1.5 text-fg focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-mute">{t('admin.field.email')}</span>
            <input
              type="email"
              value={state.email}
              onChange={(e) => setState({ ...state, email: e.target.value })}
              required
              className="rounded-md border border-line bg-bg px-2 py-1.5 text-fg focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-mute">{t('admin.field.role')}</span>
            <select
              value={state.role}
              onChange={(e) => setState({ ...state, role: e.target.value as UserRole })}
              className="rounded-md border border-line bg-bg px-2 py-1.5 text-fg focus:border-accent focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`admin.role.${r}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-mute">{t('admin.field.password')}</span>
            <input
              type="password"
              value={state.password}
              onChange={(e) => setState({ ...state, password: e.target.value })}
              autoComplete="new-password"
              minLength={state.password ? 8 : undefined}
              placeholder={isEdit ? '••••••••' : ''}
              className="rounded-md border border-line bg-bg px-2 py-1.5 text-fg focus:border-accent focus:outline-none"
            />
            <span className="text-xs text-fg-faint">{t('admin.field.passwordHint')}</span>
          </label>
        </div>

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
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
