'use client';

import type { ReactNode } from 'react';
import { useShiftTheme } from '../../hooks/useShiftTheme';
import { useI18n } from '../../hooks/useI18n';

export interface SignInLayoutProps {
  children: ReactNode;
  /** Optional headline displayed above the form (defaults to localised app title). */
  title?: ReactNode;
  /** Optional sub-text (defaults to localised app subtitle). */
  subtitle?: ReactNode;
}

/**
 * Branded auth shell used by sign-in / forgot-password pages. Reuses
 * the friendly-redesign tokens — shift accent ribbon at the top stays
 * subtle so the page feels operational but not loud.
 */
export function SignInLayout({ children, title, subtitle }: SignInLayoutProps) {
  useShiftTheme();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-md border border-line bg-bg-elev shadow-elev md:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-shift-bg p-8 text-shift-fg md:flex">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-80">OCC Handover</div>
            <h1 className="mt-2 font-mono text-2xl font-semibold leading-tight">
              Operations
              <br />
              Control Centre
            </h1>
          </div>
          <p className="text-xs leading-relaxed opacity-80">
            Shift handovers · BR-08 critical alerts · BR-09 audit trail · BR-12 role-based access.
          </p>
        </aside>
        <main className="flex flex-col justify-center p-8">
          <header className="mb-5">
            <h2 className="text-xl font-semibold text-fg">{title ?? t('app.title')}</h2>
            <p className="text-sm text-fg-mute">{subtitle ?? t('app.subtitle')}</p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
