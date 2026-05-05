'use client';

import { useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { formatKbd, type CommandGroup } from '../../lib/commands';
import { cn } from '../../lib/cn';

const GROUP_KEY: Record<CommandGroup, 'cmdk.group.navigation' | 'cmdk.group.actions' | 'cmdk.group.preferences' | 'cmdk.group.help'> = {
  navigation: 'cmdk.group.navigation',
  actions: 'cmdk.group.actions',
  preferences: 'cmdk.group.preferences',
  help: 'cmdk.group.help',
};

const GROUP_ORDER: ReadonlyArray<CommandGroup> = ['navigation', 'actions', 'preferences', 'help'];

/**
 * "?" overlay that lists every command with a `kbd` chord, grouped by
 * `command.group`. Driven entirely from the command registry — adding
 * a command anywhere in the app makes it show up here automatically.
 */
export function ShortcutsOverlay() {
  const { t } = useI18n();
  const { shortcutsOpen, setShortcutsOpen, commands } = useCommandPalette();

  const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/i.test(navigator.platform);

  useEffect(() => {
    if (!shortcutsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcutsOpen, setShortcutsOpen]);

  if (!shortcutsOpen) return null;

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: commands.filter((c) => c.group === group && c.kbd),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cmdk.shortcuts.title')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShortcutsOpen(false);
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
        <header className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-fg">{t('cmdk.shortcuts.title')}</h2>
            <p className="text-xs text-fg-mute">{t('cmdk.shortcuts.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShortcutsOpen(false)}
            className="rounded-md border border-line px-2 py-1 text-xs text-fg-soft hover:border-accent hover:text-fg"
          >
            Esc
          </button>
        </header>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <ShortcutRow
            label={t('cmdk.command.openPalette')}
            kbd={isMac ? '⌘K' : 'Ctrl+K'}
          />
          <ShortcutRow label={t('cmdk.command.search')} kbd="/" />
          <hr className="border-line-soft" />
          {grouped.map(({ group, items }) => (
            <section key={group}>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-mute">
                {t(GROUP_KEY[group])}
              </h3>
              <ul className="space-y-1">
                {items.map((c) => (
                  <ShortcutRow
                    key={c.id}
                    label={t(c.titleKey)}
                    kbd={c.kbd ? formatKbd(c.kbd, isMac) : ''}
                    icon={c.icon}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ label, kbd, icon }: { label: string; kbd: string; icon?: string }) {
  return (
    <li className={cn('flex items-center justify-between text-sm text-fg-soft')}>
      <span className="flex items-center gap-2">
        {icon && <span aria-hidden className="w-5 text-center">{icon}</span>}
        <span>{label}</span>
      </span>
      <kbd className="rounded border border-line bg-bg-row px-1.5 py-0.5 text-[10px] text-fg">{kbd}</kbd>
    </li>
  );
}
