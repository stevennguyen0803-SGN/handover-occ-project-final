/**
 * Example Settings page. Drop at `app/(app)/settings/page.tsx`.
 *
 * Replace the stub fetchers (`loadProfile`, `updateProfile`,
 * `changePassword`, `signOutAllSessions`, `savePreferences`) with real
 * fetches into your API. The Settings page is per-user — every endpoint
 * should authenticate via `auth()` and operate on `session.user.id`.
 */

'use client';

import { useEffect, useState } from 'react';
import { SettingsLayout } from '../../components/settings/SettingsLayout';
import { ProfileSection } from '../../components/settings/ProfileSection';
import { PreferencesSection } from '../../components/settings/PreferencesSection';
import { SecuritySection } from '../../components/settings/SecuritySection';
import type {
  ChangePasswordInput,
  PreferenceState,
  ProfileUpdateInput,
  SelfProfile,
  UserRole,
} from '../../lib/types';

// Demo seed values — replace with real fetch calls.
const DEMO_PROFILE: SelfProfile = {
  id: 'usr_demo_002',
  email: 'hau.nguyen@vietjet.example',
  name: 'Nguyễn Hậu',
  role: 'SUPERVISOR',
  isActive: true,
  createdAt: '2025-09-01T03:00:00.000Z',
  updatedAt: '2026-04-30T12:30:00.000Z',
  lastLoginAt: '2026-05-04T22:15:00.000Z',
};

const DEMO_PREFERENCES: PreferenceState = {
  theme: 'light',
  locale: 'vi',
  density: 'comfortable',
  defaultShift: '',
};

const CURRENT_USER_ROLE: UserRole = DEMO_PROFILE.role;

export default function SettingsPage() {
  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [prefs] = useState<PreferenceState>(DEMO_PREFERENCES);

  useEffect(() => {
    // 👉 Replace with: const res = await fetch('/api/v1/users/me');
    setProfile(DEMO_PROFILE);
  }, []);

  // 👉 Replace stubs with real fetches.
  const updateProfile = async (patch: ProfileUpdateInput): Promise<SelfProfile> => {
    if (!profile) throw new Error('Profile not loaded');
    const next: SelfProfile = {
      ...profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setProfile(next);
    return next;
  };

  const changePassword = async (
    _input: ChangePasswordInput
  ): Promise<'wrongCurrent' | 'tooShort' | 'sameAsCurrent' | undefined> => {
    void _input;
    // POST /api/v1/users/me/password — server verifies bcrypt(current) and
    // returns one of the codes above on validation failure.
    return undefined;
  };

  const signOutAllSessions = async (): Promise<void> => {
    // POST /api/v1/users/me/sessions/revoke
    return;
  };

  const savePreferences = (next: PreferenceState): void => {
    // Persist via cookie OR /api/v1/users/me/preferences if you want
    // server-side persistence (e.g. for cross-device sync).
    void next;
  };

  if (!profile) return null;

  return (
    <SettingsLayout>
      {(active) => {
        if (active === 'profile') {
          return (
            <ProfileSection
              profile={profile}
              onSave={updateProfile}
              canEditPrivilegedFields={CURRENT_USER_ROLE === 'ADMIN'}
            />
          );
        }
        if (active === 'preferences') {
          return <PreferencesSection initial={prefs} onChange={savePreferences} />;
        }
        return (
          <SecuritySection
            onChangePassword={changePassword}
            onSignOutAllSessions={signOutAllSessions}
          />
        );
      }}
    </SettingsLayout>
  );
}
