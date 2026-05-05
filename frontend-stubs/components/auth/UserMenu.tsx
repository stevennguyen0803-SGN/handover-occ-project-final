'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Badge } from '../ui/Badge';
import type { UserRole, UserSummary } from '../../lib/types';

export interface UserMenuProps {
  user: UserSummary;
  /** Async sign-out callback. In the integrated app this is `signOut()` from `auth.ts`. */
  onSignOut: () => Promise<void> | void;
  /** Optional href to the user profile / settings page. */
  profileHref?: string;
}

const ROLE_TONE: Record<UserRole, 'priority-high' | 'shift' | 'priority-normal' | 'neutral'> = {
  ADMIN: 'priority-high',
  SUPERVISOR: 'shift',
  OCC_STAFF: 'priority-normal',
  MANAGEMENT_VIEWER: 'neutral',
};

/**
 * Small avatar dropdown used inside `<TopBar>`. Closes on outside-click
 * and on Escape. Replace the visual avatar with your initials/photo.
 */
export function UserMenu({ user, onSignOut, profileHref }: UserMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-line bg-bg-elev px-2 py-1 text-sm hover:border-accent"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {initials || '·'}
        </span>
        <span className="hidden text-left md:block">
          <span className="block leading-tight text-fg">{user.name}</span>
          {user.role && (
            <Badge tone={ROLE_TONE[user.role]} className="!px-1 !py-0 text-[10px]">
              {t(`admin.role.${user.role}`)}
            </Badge>
          )}
        </span>
        <span aria-hidden className="text-xs text-fg-mute">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-md border border-line bg-bg-elev shadow-elev"
        >
          <div className="border-b border-line-soft px-3 py-2 text-xs text-fg-mute">
            {user.email ?? user.name}
          </div>
          {profileHref && (
            <a
              href={profileHref}
              role="menuitem"
              className="block px-3 py-2 text-sm text-fg-soft hover:bg-bg-row hover:text-fg"
            >
              {t('auth.profile')}
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
            className="block w-full px-3 py-2 text-left text-sm text-fg-soft hover:bg-bg-row hover:text-fg"
          >
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
