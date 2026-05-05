'use client'

import { useEffect, useState } from 'react'

import { PreferencesSection } from '@/components/settings/PreferencesSection'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { SecuritySection } from '@/components/settings/SecuritySection'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import type {
  ChangePasswordInput,
  PreferenceState,
  ProfileUpdateInput,
  SelfProfile,
} from '@/lib/types'

const DEFAULT_PREFERENCES: PreferenceState = {
  theme: 'light',
  locale: 'vi',
  density: 'comfortable',
  defaultShift: '',
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SelfProfile | null>(null)
  const [prefs] = useState<PreferenceState>(DEFAULT_PREFERENCES)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/users/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SelfProfile | null) => {
        if (!cancelled && data) setProfile(data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const updateProfile = async (
    patch: ProfileUpdateInput
  ): Promise<SelfProfile> => {
    if (!profile) throw new Error('Profile not loaded')
    const next: SelfProfile = {
      ...profile,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    setProfile(next)
    return next
  }

  const changePassword = async (
    _input: ChangePasswordInput
  ): Promise<'wrongCurrent' | 'tooShort' | 'sameAsCurrent' | undefined> => {
    return undefined
  }

  const signOutAllSessions = async (): Promise<void> => undefined

  const savePreferences = (_next: PreferenceState): void => undefined

  if (!profile) {
    return (
      <div className="rounded-md border border-line bg-bg-elev p-6 text-fg-soft">
        Loading profile…
      </div>
    )
  }

  return (
    <SettingsLayout>
      {(active) => {
        if (active === 'profile') {
          return (
            <ProfileSection
              profile={profile}
              onSave={updateProfile}
              canEditPrivilegedFields={profile.role === 'ADMIN'}
            />
          )
        }
        if (active === 'preferences') {
          return (
            <PreferencesSection
              initial={prefs}
              onChange={savePreferences}
            />
          )
        }
        return (
          <SecuritySection
            onChangePassword={changePassword}
            onSignOutAllSessions={signOutAllSessions}
          />
        )
      }}
    </SettingsLayout>
  )
}
