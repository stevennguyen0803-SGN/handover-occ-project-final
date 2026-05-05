'use client';

import { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';

export interface SignInFormProps {
  /**
   * Async sign-in callback. In the integrated app this calls Auth.js
   * `signIn('credentials', { email, password, redirect: false })` and
   * returns either `undefined` on success or an error code string the
   * UI can localise (e.g. `'CredentialsSignin'`).
   */
  onSubmit: (input: { email: string; password: string }) => Promise<string | undefined>;
  /** Pre-filled error code from `?error=…` URL param (Auth.js convention). */
  initialError?: string;
  /** Optional callback to render the "Forgot password?" link. */
  forgotPasswordHref?: string;
}

const ERROR_KEYS: Record<string, 'auth.error.invalid' | 'auth.error.inactive' | 'auth.error.unknown'> = {
  CredentialsSignin: 'auth.error.invalid',
  AccessDenied: 'auth.error.inactive',
};

/**
 * Email + password form for the credentials provider. Stays controlled
 * so consumers can pre-fill the email field or test with React Testing
 * Library.
 */
export function SignInForm({ onSubmit, initialError, forgotPasswordHref }: SignInFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const code = await onSubmit({ email: email.trim(), password });
      if (code) setError(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown');
    } finally {
      setPending(false);
    }
  };

  const errorLabel = error
    ? t(ERROR_KEYS[error] ?? 'auth.error.unknown')
    : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-mute">{t('auth.email')}</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-mute">{t('auth.password')}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
        />
      </label>

      {errorLabel && (
        <div
          role="alert"
          className="rounded-md bg-priority-critical-bg px-3 py-2 text-sm text-priority-critical-fg"
        >
          {errorLabel}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-50"
      >
        {pending ? '…' : t('auth.signIn')}
      </button>

      {forgotPasswordHref && (
        <a
          href={forgotPasswordHref}
          className="text-center text-xs text-fg-mute underline-offset-2 hover:text-accent hover:underline"
        >
          {t('auth.forgotPwd')}
        </a>
      )}
    </form>
  );
}
