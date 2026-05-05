'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import type { ProfileUpdateInput, SelfProfile, UserRole } from '../../lib/types';

export interface ProfileSectionProps {
  profile: SelfProfile;
  /**
   * Async save callback. In the integrated app this hits
   * `PATCH /api/v1/users/me` (or `/users/:id` with the session id).
   */
  onSave: (patch: ProfileUpdateInput) => Promise<SelfProfile>;
  /**
   * Whether the *current* signed-in user is allowed to edit
   * `email` / `role` for THIS profile (e.g. `currentUser.role === 'ADMIN'`).
   * Defaults to `false` (self-service: name only).
   */
  canEditPrivilegedFields?: boolean;
}

const ROLE_TONE: Record<UserRole, 'priority-high' | 'shift' | 'priority-normal' | 'neutral'> = {
  ADMIN: 'priority-high',
  SUPERVISOR: 'shift',
  OCC_STAFF: 'priority-normal',
  MANAGEMENT_VIEWER: 'neutral',
};

export function ProfileSection({ profile, onSave, canEditPrivilegedFields = false }: ProfileSectionProps) {
  const { t } = useI18n();
  const { push } = useToast();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile.id, profile.name, profile.email]);

  const dirty = name.trim() !== profile.name || (canEditPrivilegedFields && email.trim() !== profile.email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    setPending(true);
    try {
      const patch: ProfileUpdateInput = {};
      if (name.trim() !== profile.name) patch.name = name.trim();
      if (canEditPrivilegedFields && email.trim() !== profile.email) patch.email = email.trim();
      await onSave(patch);
      push({ tone: 'success', title: t('settings.toast.saved') });
    } catch {
      push({ tone: 'error', title: t('settings.toast.error') });
    } finally {
      setPending(false);
    }
  };

  const discard = () => {
    setName(profile.name);
    setEmail(profile.email);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-line bg-bg-elev p-4"
    >
      <header>
        <h2 className="text-base font-semibold text-fg">{t('settings.profile.section')}</h2>
        {!canEditPrivilegedFields && (
          <p className="mt-1 text-xs text-fg-mute">{t('settings.profile.adminOnly')}</p>
        )}
      </header>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-mute">{t('settings.profile.name')}</span>
        <input
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-mute">{t('settings.profile.email')}</span>
        <input
          type="email"
          required
          value={email}
          readOnly={!canEditPrivilegedFields}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-line bg-bg px-3 py-2 text-fg focus:border-accent focus:outline-none read-only:bg-bg-row read-only:text-fg-mute"
        />
      </label>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <ReadOnlyField label={t('settings.profile.role')}>
          <Badge tone={ROLE_TONE[profile.role]}>{t(`admin.role.${profile.role}`)}</Badge>
        </ReadOnlyField>
        <ReadOnlyField label={t('settings.profile.createdAt')}>
          <span className="font-mono text-xs text-fg-soft">
            {new Date(profile.createdAt).toLocaleDateString()}
          </span>
        </ReadOnlyField>
        <ReadOnlyField label={t('settings.profile.lastLoginAt')}>
          <span className="font-mono text-xs text-fg-soft">
            {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : '—'}
          </span>
        </ReadOnlyField>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-line-soft pt-3">
        <button
          type="button"
          onClick={discard}
          disabled={!dirty || pending}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-fg-soft hover:border-accent hover:text-fg disabled:opacity-50"
        >
          {t('settings.action.discard')}
        </button>
        <button
          type="submit"
          disabled={!dirty || pending}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg hover:bg-accent-strong disabled:opacity-50"
        >
          {pending ? '…' : t('settings.action.save')}
        </button>
      </footer>
    </form>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-fg-mute">{label}</span>
      <div>{children}</div>
    </div>
  );
}
