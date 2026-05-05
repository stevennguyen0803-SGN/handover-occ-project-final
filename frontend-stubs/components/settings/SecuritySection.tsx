'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useToast } from '../ui/Toast';
import { PasswordStrengthMeter, scorePassword } from './PasswordStrengthMeter';
import type { ChangePasswordInput } from '../../lib/types';

export interface SecuritySectionProps {
  /**
   * Async change-password callback. In the integrated app this hits
   * `POST /api/v1/users/me/password`. The server MUST verify
   * `currentPassword` with bcrypt before accepting `newPassword`.
   *
   * Return either:
   *   - `undefined` on success
   *   - one of `'wrongCurrent' | 'tooShort' | 'sameAsCurrent'` on a
   *     server-validated failure (the UI localises these)
   */
  onChangePassword: (input: ChangePasswordInput) => Promise<'wrongCurrent' | 'tooShort' | 'sameAsCurrent' | undefined>;
  /**
   * Optional callback for the "Sign out from all sessions" button. If
   * omitted, the button is hidden.
   */
  onSignOutAllSessions?: () => Promise<void>;
}

const SERVER_ERROR_KEY = {
  wrongCurrent: 'settings.security.error.wrongCurrent',
  tooShort: 'settings.security.error.tooShort',
  sameAsCurrent: 'settings.security.error.sameAsCurrent',
} as const satisfies Record<'wrongCurrent' | 'tooShort' | 'sameAsCurrent', `settings.security.error.${string}`>;

export function SecuritySection({ onChangePassword, onSignOutAllSessions }: SecuritySectionProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setError(null);

    if (next.length < 8) {
      setError(t('settings.security.error.tooShort'));
      return;
    }
    if (next !== confirm) {
      setError(t('settings.security.error.mismatch'));
      return;
    }
    if (next === current) {
      setError(t('settings.security.error.sameAsCurrent'));
      return;
    }

    setPending(true);
    try {
      const code = await onChangePassword({ currentPassword: current, newPassword: next });
      if (code) {
        setError(t(SERVER_ERROR_KEY[code]));
        return;
      }
      push({ tone: 'success', title: t('settings.toast.passwordChanged') });
      reset();
    } catch {
      push({ tone: 'error', title: t('settings.toast.error') });
    } finally {
      setPending(false);
    }
  };

  const submitDisabled = pending || !current || !next || !confirm || scorePassword(next).strength === 'weak';

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-md border border-line bg-bg-elev p-4"
      >
        <header>
          <h2 className="text-base font-semibold text-fg">{t('settings.security.section')}</h2>
          <p className="mt-1 text-xs text-fg-mute">{t('settings.security.note')}</p>
        </header>

        <Field label={t('settings.security.current')}>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
          />
        </Field>

        <Field label={t('settings.security.new')}>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
          />
          <PasswordStrengthMeter password={next} />
        </Field>

        <Field label={t('settings.security.confirm')}>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-md bg-priority-critical-bg px-3 py-2 text-sm text-priority-critical-fg"
          >
            {error}
          </div>
        )}

        <footer className="flex justify-end gap-2 border-t border-line-soft pt-3">
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-fg disabled:opacity-50"
          >
            {t('settings.action.discard')}
          </button>
          <button
            type="submit"
            disabled={submitDisabled}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-50"
          >
            {pending ? '…' : t('settings.action.save')}
          </button>
        </footer>
      </form>

      {onSignOutAllSessions && (
        <SignOutAllCard onSignOutAllSessions={onSignOutAllSessions} />
      )}
    </div>
  );
}

function SignOutAllCard({ onSignOutAllSessions }: { onSignOutAllSessions: () => Promise<void> }) {
  const { t } = useI18n();
  const { push } = useToast();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onSignOutAllSessions();
    } catch {
      push({ tone: 'error', title: t('settings.toast.error') });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-bg-elev p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-fg">{t('settings.security.signOutAll')}</h3>
        <p className="text-xs text-fg-mute">{t('settings.security.signOutAll.body')}</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-priority-critical-fg px-3 py-1.5 text-sm font-medium text-priority-critical-fg hover:bg-priority-critical-bg disabled:opacity-50"
      >
        {pending ? '…' : t('settings.security.signOutAll')}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-fg-mute">{label}</span>
      {children}
    </label>
  );
}
