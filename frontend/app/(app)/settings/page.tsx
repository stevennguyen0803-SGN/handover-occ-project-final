'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'

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

type ChangePasswordCode =
  | 'wrongCurrent'
  | 'tooShort'
  | 'sameAsCurrent'
  | undefined

function mapPasswordError(payload: unknown): ChangePasswordCode {
  if (!payload || typeof payload !== 'object') return undefined
  const code = (payload as { error?: unknown }).error
  if (code === 'WRONG_CURRENT') return 'wrongCurrent'
  if (code === 'SAME_AS_CURRENT') return 'sameAsCurrent'
  if (code === 'VALIDATION_FAILED') return 'tooShort'
  return undefined
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SelfProfile | null>(null)
  const [prefs] = useState<PreferenceState>(DEFAULT_PREFERENCES)

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/users/me', { cache: 'no-store' })
      .then(async (res) => (res.ok ? ((await res.json()) as SelfProfile) : null))
      .then((data) => {
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
    const res = await fetch('/api/v1/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      throw new Error('Failed to update profile')
    }
    const next = (await res.json()) as SelfProfile
    setProfile(next)
    return next
  }

  const changePassword = async (
    input: ChangePasswordInput
  ): Promise<ChangePasswordCode> => {
    const res = await fetch('/api/v1/users/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (res.ok) return undefined
    const payload = await res.json().catch(() => null)
    const mapped = mapPasswordError(payload)
    if (mapped) return mapped
    throw new Error('Failed to change password')
  }

  const savePreferences = (_next: PreferenceState): void => undefined

  const revokeAllSessions = async (): Promise<void> => {
    const res = await fetch('/api/v1/users/me/sessions/revoke', {
      method: 'POST',
    })
    if (!res.ok && res.status !== 204) {
      throw new Error('Failed to revoke sessions')
    }
    // Backend has stamped sessionsRevokedAt; sign out the current tab so
    // NextAuth's cookie disappears too. Other devices will get 403 on
    // their next backend call and bounce to /signin.
    await signOut({ callbackUrl: '/signin' })
  }

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
            onSignOutAllSessions={revokeAllSessions}
          />
        )
      }}
    </SettingsLayout>
  )
}
