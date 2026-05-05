'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SettingsNav, type SettingsTab } from './SettingsNav';

const TABS: ReadonlyArray<SettingsTab> = ['profile', 'preferences', 'security'];

export interface SettingsLayoutProps {
  /** Initial tab — defaults to `profile`. The component then mirrors the URL hash. */
  initialTab?: SettingsTab;
  children: (active: SettingsTab) => React.ReactNode;
}

function parseHash(hash: string): SettingsTab | null {
  const id = hash.replace(/^#/, '') as SettingsTab;
  return TABS.includes(id) ? id : null;
}

/**
 * 2-column shell: sidebar nav + content. Section state syncs with the
 * URL hash (`#profile` / `#preferences` / `#security`) so deep links
 * land on the right pane and back/forward navigation works.
 */
export function SettingsLayout({ initialTab = 'profile', children }: SettingsLayoutProps) {
  const { t } = useI18n();
  const [active, setActive] = useState<SettingsTab>(initialTab);

  // Sync hash → state on mount and on hashchange.
  useEffect(() => {
    const apply = () => {
      const next = parseHash(window.location.hash);
      if (next) setActive(next);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const handleChange = (next: SettingsTab) => {
    setActive(next);
    if (typeof window !== 'undefined') {
      // Use history.replaceState to avoid pushing a new entry per click.
      window.history.replaceState(null, '', `#${next}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-fg">{t('settings.title')}</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside>
          <SettingsNav active={active} onChange={handleChange} />
        </aside>
        <section>{children(active)}</section>
      </div>
    </div>
  );
}
