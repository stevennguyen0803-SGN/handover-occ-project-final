'use client'

import type { ReactNode } from 'react'

import { I18nProvider } from '@/hooks/useI18n'

export function AuthProviders({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>
}
