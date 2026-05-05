'use client';

import { useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CriticalBanner } from './CriticalBanner';
import { FloatingActionButton } from './FloatingActionButton';
import { useShiftTheme } from '../../hooks/useShiftTheme';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { Shift, ThemeMode, UserSummary } from '../../lib/types';

export interface AppShellProps {
  user: UserSummary | null;
  /** Number of unacknowledged Critical handovers; banner hides when 0. */
  unacknowledgedCriticalCount: number;
  /** Force the shift accent (e.g. from the active handover). */
  shiftOverride?: Shift | null;
  initialTheme?: ThemeMode;
  recordCount?: number;
  onSignOut?: () => void;
  children: ReactNode;
}

/**
 * Top-level shell: topbar + sidebar + critical banner + content.
 * Wires global keyboard shortcuts (`N`, `D`, `L`, `T`, `?`).
 */
export function AppShell({
  user,
  unacknowledgedCriticalCount,
  shiftOverride,
  initialTheme,
  recordCount,
  onSignOut,
  children,
}: AppShellProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { toggleTheme } = useTheme(initialTheme);
  const searchRef = useRef<HTMLInputElement>(null);
  useShiftTheme(shiftOverride ?? null);

  useKeyboardShortcuts({
    onNew: () => router.push('/handover/new'),
    onDashboard: () => router.push('/dashboard'),
    onLog: () => router.push('/log'),
    onSearch: () => searchRef.current?.focus(),
    onToggleTheme: toggleTheme,
  });

  return (
    <div className="grid min-h-screen grid-cols-[15rem_1fr]" data-i18n-loaded={t !== undefined ? '1' : '0'}>
      <Sidebar recordCount={recordCount} signOut={onSignOut} />
      <div className="flex min-h-screen flex-col">
        <TopBar user={user} initialTheme={initialTheme} onSignOut={onSignOut} searchInputRef={searchRef} />
        <CriticalBanner count={unacknowledgedCriticalCount} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
      <FloatingActionButton />
    </div>
  );
}
