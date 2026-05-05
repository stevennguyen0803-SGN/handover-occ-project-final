'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import { fuzzyMatch, highlightMatch } from '../../lib/fuzzy';
import { formatKbd, type Command, type CommandGroup } from '../../lib/commands';
import type { UserRole } from '../../lib/types';
import { cn } from '../../lib/cn';

const GROUP_KEY: Record<CommandGroup, 'cmdk.group.navigation' | 'cmdk.group.actions' | 'cmdk.group.preferences' | 'cmdk.group.help'> = {
  navigation: 'cmdk.group.navigation',
  actions: 'cmdk.group.actions',
  preferences: 'cmdk.group.preferences',
  help: 'cmdk.group.help',
};

const GROUP_ORDER: ReadonlyArray<CommandGroup> = ['navigation', 'actions', 'preferences', 'help'];

interface RankedCommand {
  command: Command;
  score: number;
  /** Indices into the *displayed* title (post-i18n) for highlighting. */
  indices: number[];
}

export interface CommandPaletteProps {
  /** Current user's role — used to filter `availableWhen`. */
  currentRole?: UserRole;
}

export function CommandPalette({ currentRole }: CommandPaletteProps) {
  const { t } = useI18n();
  const { open, setOpen, commands } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/i.test(navigator.platform);

  // Available + ranked commands for the current query.
  const ranked = useMemo<ReadonlyArray<RankedCommand>>(() => {
    const available = commands.filter((c) =>
      !c.availableWhen || (currentRole && c.availableWhen.includes(currentRole))
    );
    if (!query.trim()) {
      return available.map((command) => ({ command, score: 0, indices: [] }));
    }
    const out: RankedCommand[] = [];
    for (const command of available) {
      const title = t(command.titleKey);
      const haystack = [title, ...(command.keywords ?? [])].join(' ');
      const m = fuzzyMatch(query.trim(), haystack);
      if (!m) continue;
      // Re-run on the title alone to derive highlight indices that map
      // 1:1 to the displayed text.
      const titleMatch = fuzzyMatch(query.trim(), title);
      out.push({ command, score: m.score, indices: titleMatch?.indices ?? [] });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  }, [commands, currentRole, query, t]);

  const grouped = useMemo(() => {
    const map = new Map<CommandGroup, RankedCommand[]>();
    for (const group of GROUP_ORDER) map.set(group, []);
    for (const r of ranked) {
      const arr = map.get(r.command.group);
      if (arr) arr.push(r);
    }
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0);
  }, [ranked]);

  // Flat ordering matches what the user sees vertically — used by arrow keys.
  const flat = useMemo(() => grouped.flatMap(([, arr]) => arr), [grouped]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Focus the input after the dialog is in the DOM.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(0);
  }, [activeIndex, flat.length]);

  // Scroll the active row into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLLIElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) return null;

  const runActive = () => {
    const target = flat[activeIndex];
    if (!target) return;
    setOpen(false);
    void target.command.run();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runActive();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cmdk.title')}
      onKeyDown={handleKey}
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay px-4 pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
        <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2">
          <span aria-hidden className="text-fg-mute">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={t('cmdk.placeholder')}
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-mute"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-mute">Esc</kbd>
        </div>

        <ul ref={listRef} className="max-h-[60vh] overflow-y-auto py-1" role="listbox">
          {grouped.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-fg-mute">{t('cmdk.empty')}</li>
          )}
          {grouped.map(([group, items]) => (
            <li key={group}>
              <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-fg-mute">
                {t(GROUP_KEY[group])}
              </div>
              <ul role="presentation">
                {items.map((r) => {
                  const flatIndex = flat.indexOf(r);
                  const active = flatIndex === activeIndex;
                  const title = t(r.command.titleKey);
                  const chunks = r.indices.length ? highlightMatch(title, r.indices) : null;
                  return (
                    <li
                      key={r.command.id}
                      data-index={flatIndex}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setOpen(false);
                        void r.command.run();
                      }}
                      className={cn(
                        'mx-1 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm',
                        active ? 'bg-accent-soft text-fg' : 'text-fg-soft'
                      )}
                    >
                      <span aria-hidden className="w-5 text-center">{r.command.icon ?? '•'}</span>
                      <span className="flex-1 truncate">
                        {chunks
                          ? chunks.map((c, i) => (
                              <span key={i} className={c.match ? 'font-semibold text-fg' : undefined}>
                                {c.text}
                              </span>
                            ))
                          : title}
                      </span>
                      {r.command.kbd && (
                        <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-mute">
                          {formatKbd(r.command.kbd, isMac)}
                        </kbd>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-line-soft bg-bg-row px-3 py-1.5 text-[10px] text-fg-mute">
          <span>
            <kbd className="rounded border border-line bg-bg-elev px-1">↑↓</kbd> {t('cmdk.hint.navigate')} ·{' '}
            <kbd className="rounded border border-line bg-bg-elev px-1">↵</kbd> {t('cmdk.hint.select')}
          </span>
          <span>
            <kbd className="rounded border border-line bg-bg-elev px-1">{isMac ? '⌘' : 'Ctrl'}+K</kbd> {t('cmdk.hint.toggle')}
          </span>
        </div>
      </div>
    </div>
  );
}
