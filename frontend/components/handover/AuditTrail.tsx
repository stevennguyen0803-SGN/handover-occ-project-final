'use client';

import { useI18n } from '../../hooks/useI18n';
import { formatDateTime } from '../../lib/format';
import type { AuditAction, AuditLogEntry } from '../../lib/types';

const GLYPH: Record<AuditAction, string> = {
  CREATED: '＋',
  UPDATED: '✎',
  STATUS_CHANGED: '↻',
  ACKNOWLEDGED: '✓',
  CARRIED_FORWARD: '↺',
  DELETED: '✕',
};

const TONE: Record<AuditAction, string> = {
  CREATED: 'bg-priority-low-bg text-priority-low-fg',
  UPDATED: 'bg-status-monitoring-bg text-priority-normal-fg',
  STATUS_CHANGED: 'bg-status-monitoring-bg text-priority-normal-fg',
  ACKNOWLEDGED: 'bg-priority-low-bg text-priority-low-fg',
  CARRIED_FORWARD: 'bg-shift-bg text-shift-fg',
  DELETED: 'bg-priority-critical-bg text-priority-critical-fg',
};

export interface AuditTrailProps {
  entries: AuditLogEntry[];
  /** Optional summary text generator — defaults to action + targetModel. */
  summarise?: (entry: AuditLogEntry) => string;
}

export function AuditTrail({ entries, summarise }: AuditTrailProps) {
  const { t } = useI18n();
  return (
    <aside className="rounded-md border border-line bg-bg-elev shadow-soft">
      <header className="border-b border-line-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-fg-mute">
        {t('audit.title')}
      </header>
      <ul className="divide-y divide-line-soft">
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-3 px-3 py-3 text-xs">
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${TONE[entry.action]}`}
            >
              {GLYPH[entry.action]}
            </span>
            <div className="leading-tight">
              <div className="font-semibold uppercase tracking-wide text-fg">{entry.action}</div>
              <div className="text-fg-soft">{summarise ? summarise(entry) : `${entry.targetModel}`}</div>
              <div className="mt-0.5 text-[11px] text-fg-mute">
                {entry.user.name} · {formatDateTime(entry.createdAt)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
