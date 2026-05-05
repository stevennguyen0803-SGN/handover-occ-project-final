'use client';

import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

export type KpiKind = 'active' | 'alert' | 'issues' | 'opsImpact' | 'trace' | 'ok';

const KIND_CLASSES: Record<KpiKind, string> = {
  active: 'bg-priority-low-bg text-priority-low-fg',
  alert: 'bg-priority-high-bg text-priority-high-fg',
  issues: 'bg-priority-normal-bg text-priority-normal-fg',
  opsImpact: 'bg-priority-critical-bg text-priority-critical-fg',
  trace: 'bg-status-monitoring-bg text-priority-normal-fg',
  ok: 'bg-status-resolved-bg text-priority-low-fg',
};

const KIND_LABEL: Record<KpiKind, string> = {
  active: 'Active',
  alert: 'Alert',
  issues: 'Issues',
  opsImpact: 'Ops Impact',
  trace: 'Trace',
  ok: 'OK',
};

export interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  kind?: KpiKind;
  onClick?: () => void;
  className?: string;
}

/**
 * Dashboard KPI tile. Optional `onClick` makes it deep-link to the
 * filtered Handover Log (e.g. clicking "Awaiting ack" → log filtered by
 * `priority=Critical&unack=1`).
 */
export function KpiCard({ label, value, hint, kind = 'active', onClick, className }: KpiCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-2 rounded-md border border-line bg-bg-elev p-4 text-left shadow-soft transition',
        onClick && 'hover:border-accent hover:shadow-elev focus-visible:border-accent',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-mute">{label}</span>
        <span className={cn('rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase', KIND_CLASSES[kind])}>
          {KIND_LABEL[kind]}
        </span>
      </div>
      <div className="text-3xl font-bold leading-tight text-fg">{value}</div>
      {hint && <div className="text-xs text-fg-mute">{hint}</div>}
    </Tag>
  );
}
