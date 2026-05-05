'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { formatDate, formatTime, shiftForTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { ThemeMode, UserSummary } from '../../lib/types';

export interface TopBarProps {
  user: UserSummary | null;
  initialTheme?: ThemeMode;
  onSearch?: (value: string) => void;
  onSignOut?: () => void;
  /** Bind to focus the search input from a `/` keyboard shortcut. */
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function TopBar({ user, initialTheme, onSearch, onSignOut, searchInputRef }: TopBarProps) {
  const { t, locale, toggle } = useI18n();
  const { theme, toggleTheme } = useTheme(initialTheme);
  const [now, setNow] = useState<Date>(() => new Date());
  const fallbackRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? fallbackRef;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const shift = shiftForTime(now);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-line bg-bg-elev px-4">
      <button
        type="button"
        aria-label="Open navigation"
        className="rounded-md border border-line p-2 text-fg-soft hover:border-accent hover:text-accent md:hidden"
      >
        ☰
      </button>
      <div className="flex items-center gap-2 font-semibold text-fg">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-fg">⚡</span>
        <div className="leading-tight">
          <div>{t('app.title')}</div>
          <div className="text-[11px] font-normal text-fg-mute">{t('app.subtitle')}</div>
        </div>
      </div>

      <div className="ml-2 flex flex-1 items-center">
        <label className="relative flex w-full max-w-xl items-center">
          <span className="absolute left-3 text-fg-faint" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder={t('topbar.search')}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full rounded-pill border border-line bg-bg-row py-2 pl-9 pr-10 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none"
          />
          <kbd className="absolute right-3 rounded border border-line bg-bg-elev px-1.5 text-[10px] text-fg-mute">/</kbd>
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs text-fg-mute">
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold text-fg">{formatTime(now)}</div>
          <div>{formatDate(now)}</div>
        </div>
        <span
          className={cn(
            'rounded-pill border border-shift bg-shift-bg px-2 py-0.5 text-[11px] font-semibold uppercase text-shift-fg'
          )}
        >
          ● {shift}
        </span>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label="Toggle language"
        className="rounded-md border border-line px-2 py-1 text-xs font-semibold uppercase text-fg-soft hover:border-accent hover:text-accent"
      >
        {locale === 'vi' ? 'VI' : 'EN'}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="rounded-md border border-line p-2 text-fg-soft hover:border-accent hover:text-accent"
      >
        {theme === 'dark' ? '☾' : '☀'}
      </button>

      {user && (
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-fg text-xs font-semibold">
            {user.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') ?? '?'}
          </div>
          <div className="leading-tight text-right">
            <div className="text-sm font-semibold text-fg">{user.name}</div>
            <div className="text-[11px] uppercase text-fg-mute">{user.role}</div>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-line px-2 py-1 text-xs text-fg-soft hover:border-accent hover:text-accent"
            >
              {t('auth.signOut')}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
