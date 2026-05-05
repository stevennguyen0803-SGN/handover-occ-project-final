'use client';

import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

export interface FilterChipProps {
  label: ReactNode;
  count?: number;
  active?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Compact toggleable chip used by quick filters
 * (Today / Last 7d / High+ / Open only / Carry-forward / Awaiting ack).
 */
export function FilterChip({ label, count, active = false, onToggle, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-sm transition',
        active
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-line bg-bg-elev text-fg-soft hover:border-accent hover:text-accent',
        className
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill px-1 text-xs font-semibold',
            active ? 'bg-accent-fg text-accent' : 'bg-bg-row text-fg-mute'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
