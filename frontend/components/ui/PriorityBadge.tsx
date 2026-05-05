import { Badge, type BadgeTone } from './Badge';
import type { Priority } from '../../lib/types';

const TONE_BY_PRIORITY: Record<Priority, BadgeTone> = {
  Critical: 'priority-critical',
  High: 'priority-high',
  Normal: 'priority-normal',
  Low: 'priority-low',
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <Badge tone={TONE_BY_PRIORITY[priority]} className={className}>
      {priority}
    </Badge>
  );
}
