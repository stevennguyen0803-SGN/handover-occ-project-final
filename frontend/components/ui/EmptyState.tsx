import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface EmptyStateProps {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Friendly empty state used by lists/wizard steps when there's no data. */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line bg-bg-elev p-8 text-center',
        className
      )}
    >
      <div className="text-base font-semibold text-fg">{title}</div>
      {body && <div className="max-w-sm text-sm text-fg-mute">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
