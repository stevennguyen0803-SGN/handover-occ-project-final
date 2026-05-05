import { cn } from '../../lib/cn';
import type { ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'priority-critical'
  | 'priority-high'
  | 'priority-normal'
  | 'priority-low'
  | 'status-open'
  | 'status-monitoring'
  | 'status-resolved'
  | 'ack-awaiting'
  | 'ack-done'
  | 'shift';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-bg-row text-fg-soft border border-line-soft',
  'priority-critical': 'bg-priority-critical-bg text-priority-critical-fg',
  'priority-high': 'bg-priority-high-bg text-priority-high-fg',
  'priority-normal': 'bg-priority-normal-bg text-priority-normal-fg',
  'priority-low': 'bg-priority-low-bg text-priority-low-fg',
  'status-open': 'bg-status-open-bg text-priority-high-fg',
  'status-monitoring': 'bg-status-monitoring-bg text-priority-normal-fg',
  'status-resolved': 'bg-status-resolved-bg text-priority-low-fg',
  'ack-awaiting': 'bg-priority-critical-bg text-priority-critical-fg',
  'ack-done': 'bg-priority-low-bg text-priority-low-fg',
  shift: 'bg-shift-bg text-shift-fg',
};

export interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium tracking-tight',
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
