'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../lib/cn';

interface NavItem {
  href: string;
  labelKey: Parameters<ReturnType<typeof useI18n>['t']>[0];
  icon: string;
  group: 'main' | 'tools';
}

const NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: '▦', group: 'main' },
  { href: '/handover/new', labelKey: 'nav.newHandover', icon: '＋', group: 'main' },
  { href: '/log', labelKey: 'nav.handoverLog', icon: '☰', group: 'main' },
  { href: '/audit', labelKey: 'nav.audit', icon: '◷', group: 'tools' },
  { href: '/help', labelKey: 'nav.help', icon: '?', group: 'tools' },
];

export interface SidebarProps {
  /** Number of records cached locally, shown in the footer for parity with the prototype. */
  recordCount?: number;
  signOut?: () => void;
}

export function Sidebar({ recordCount, signOut }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const groups: Array<{ key: 'main' | 'tools'; titleKey: 'nav.main' | 'nav.tools' }> = [
    { key: 'main', titleKey: 'nav.main' },
    { key: 'tools', titleKey: 'nav.tools' },
  ];

  return (
    <aside className="flex w-60 flex-col border-r border-line bg-bg-side">
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
        {groups.map(({ key, titleKey }) => (
          <div key={key} className="mb-4">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-fg-mute">
              {t(titleKey)}
            </div>
            <ul className="flex flex-col gap-1">
              {NAV.filter((item) => item.group === key).map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 transition',
                        active
                          ? 'bg-accent-soft text-accent'
                          : 'text-fg-soft hover:bg-bg-row hover:text-fg'
                      )}
                    >
                      <span aria-hidden="true" className="w-5 text-center">{item.icon}</span>
                      <span>{t(item.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line px-3 py-3 text-xs text-fg-mute">
        {signOut && (
          <button
            type="button"
            onClick={signOut}
            className="mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-soft hover:bg-bg-row hover:text-fg"
          >
            <span aria-hidden="true">↩</span>
            <span>{t('auth.signOut')}</span>
          </button>
        )}
        {recordCount !== undefined && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span aria-hidden="true">▢</span>
            <span>Local cache · {recordCount} records</span>
          </div>
        )}
      </div>
    </aside>
  );
}
