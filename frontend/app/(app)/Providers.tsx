'use client'

import type { ReactNode } from 'react'

import { ToastProvider } from '@/components/ui/Toast'
import { I18nProvider } from '@/hooks/useI18n'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  )
}
