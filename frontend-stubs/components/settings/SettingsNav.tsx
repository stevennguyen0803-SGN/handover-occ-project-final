'use client';

import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';

export type SettingsTab = 'profile' | 'preferences' | 'security';

export interface SettingsNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const TABS: ReadonlyArray<{ id: SettingsTab; key: 'settings.nav.profile' | 'settings.nav.preferences' | 'settings.nav.security'; icon: string }> = [
  { id: 'profile', key: 'settings.nav.profile', icon: '👤' },
  { id: 'preferences', key: 'settings.nav.preferences', icon: '🎨' },
  { id: 'security', key: 'settings.nav.security', icon: '🔒' },
];

/**
 * Sidebar nav for the Settings page. Tabs are exposed as buttons (not
 * `<a href>`) because section state lives in the URL hash, which the
 * parent page synchronises — keeping it inside Next.js App Router
 * without a full route per section.
 */
export function SettingsNav({ active, onChange }: SettingsNavProps) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('settings.title')} className="flex flex-col gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-fg-soft hover:border-line hover:text-fg',
            active === tab.id && 'border-line bg-bg-row text-fg shadow-soft'
          )}
        >
          <span aria-hidden>{tab.icon}</span>
          <span>{t(tab.key)}</span>
        </button>
      ))}
    </nav>
  );
}
