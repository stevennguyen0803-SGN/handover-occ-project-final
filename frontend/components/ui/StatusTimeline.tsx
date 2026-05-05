import { cn } from '../../lib/cn';
import type { ItemStatus } from '../../lib/types';

const STAGES: ItemStatus[] = ['Open', 'Monitoring', 'Resolved'];

const ACTIVE_BG: Record<ItemStatus, string> = {
  Open: 'bg-status-open',
  Monitoring: 'bg-status-monitoring',
  Resolved: 'bg-status-resolved',
};

/**
 * Visual progression Open → Monitoring → Resolved (BR-05). The current
 * stage is filled, prior stages are muted dots, and any unreachable stage
 * after Resolved is also muted (Resolved is terminal).
 */
export function StatusTimeline({ status, className }: { status: ItemStatus; className?: string }) {
  const currentIdx = STAGES.indexOf(status);
  return (
    <ol className={cn('inline-flex items-center gap-2 text-xs text-fg-mute', className)} aria-label="Status timeline">
      {STAGES.map((stage, idx) => {
        const reached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <li key={stage} className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                reached ? ACTIVE_BG[stage] : 'bg-line'
              )}
            />
            <span className={cn(isCurrent ? 'text-fg-soft font-medium' : '')}>{stage}</span>
            {idx < STAGES.length - 1 && <span aria-hidden="true" className="mx-1 text-fg-faint">›</span>}
          </li>
        );
      })}
    </ol>
  );
}
