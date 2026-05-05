import { Badge, type BadgeTone } from './Badge';
import type { ItemStatus } from '../../lib/types';

const TONE_BY_STATUS: Record<ItemStatus, BadgeTone> = {
  Open: 'status-open',
  Monitoring: 'status-monitoring',
  Resolved: 'status-resolved',
};

export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  return (
    <Badge tone={TONE_BY_STATUS[status]} className={className}>
      {status}
    </Badge>
  );
}
