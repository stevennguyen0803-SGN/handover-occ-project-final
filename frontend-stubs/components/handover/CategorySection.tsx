'use client';

import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { StatusTimeline } from '../ui/StatusTimeline';
import { formatDateTime } from '../../lib/format';
import type { AnyItem, CategoryCode, ItemStatus, Priority, UserSummary } from '../../lib/types';
import { CATEGORIES } from '../../lib/constants';

export interface ItemViewModel {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: ItemStatus;
  owner?: UserSummary | null;
  flightsAffected?: string | null;
  resolvedAt?: string | null;
}

export interface CategorySectionProps {
  category: CategoryCode;
  items: ItemViewModel[];
  emptyHint?: ReactNode;
}

export function CategorySection({ category, items, emptyHint }: CategorySectionProps) {
  const meta = CATEGORIES.find((c) => c.code === category)!;
  return (
    <section className="rounded-md border border-line bg-bg-elev shadow-soft">
      <header className="flex items-center gap-2 border-b border-line-soft px-3 py-2 text-sm">
        <Badge tone="neutral" className="uppercase">{meta.shortLabel}</Badge>
        <span className="font-semibold text-fg">{meta.longLabel}</span>
        <span className="text-xs text-fg-mute">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <div className="px-3 py-3 text-sm text-fg-mute">{emptyHint ?? meta.hint}</div>
      ) : (
        <ul className="divide-y divide-line-soft">
          {items.map((item) => (
            <li key={item.id} className="px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-fg">{item.title}</span>
                <PriorityBadge priority={item.priority} />
                <StatusBadge status={item.status} />
                <StatusTimeline status={item.status} className="ml-auto" />
              </div>
              <div className="mt-1 text-sm text-fg-soft">{item.description}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-fg-mute">
                {item.owner && (
                  <span className="inline-flex items-center gap-1">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-[10px] text-accent-fg">
                      {item.owner.name?.[0] ?? '?'}
                    </span>
                    {item.owner.name}
                  </span>
                )}
                {item.flightsAffected && <span>→ {item.flightsAffected}</span>}
                {item.resolvedAt && <span>✓ {formatDateTime(item.resolvedAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Helper that converts a typed `AnyItem` from the API into the display
 * shape used by `<CategorySection>`. Pulls the right "title" field per
 * category (registration / airport / flightNumber / crewName / ...).
 */
export function toItemView(item: AnyItem, category: CategoryCode): ItemViewModel {
  const base: Pick<ItemViewModel, 'id' | 'priority' | 'status' | 'owner' | 'flightsAffected' | 'resolvedAt'> = {
    id: item.id,
    priority: item.priority,
    status: item.status,
    owner: item.owner ?? null,
    flightsAffected: 'flightsAffected' in item ? item.flightsAffected ?? null : null,
    resolvedAt: item.resolvedAt ?? null,
  };

  switch (category) {
    case 'aircraft': {
      const i = item as Extract<AnyItem, { registration: string }>;
      return { ...base, title: `${i.registration}${i.type ? ` · ${i.type}` : ''}`, description: i.issue };
    }
    case 'airport': {
      const i = item as Extract<AnyItem, { airport: string }>;
      return { ...base, title: i.airport, description: i.issue };
    }
    case 'flightSchedule': {
      const i = item as Extract<AnyItem, { flightNumber: string }>;
      return { ...base, title: `${i.flightNumber}${i.route ? ` · ${i.route}` : ''}`, description: i.issue };
    }
    case 'crew': {
      const i = item as Extract<AnyItem, { crewName?: string | null }>;
      const name = i.crewName ?? i.crewId ?? '—';
      return { ...base, title: `${name}${i.role ? ` (${i.role})` : ''}`, description: i.issue };
    }
    case 'weather': {
      const i = item as Extract<AnyItem, { weatherType: string }>;
      return { ...base, title: `${i.affectedArea} · ${i.weatherType}`, description: i.issue };
    }
    case 'system': {
      const i = item as Extract<AnyItem, { systemName: string }>;
      return { ...base, title: i.systemName, description: i.issue };
    }
    case 'abnormal': {
      const i = item as Extract<AnyItem, { eventType: string }>;
      return { ...base, title: i.eventType, description: i.description };
    }
  }
}
