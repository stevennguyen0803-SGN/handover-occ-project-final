import type { ItemViewModel } from '@/components/handover/CategorySection.types'
import type { AnyItem, CategoryCode } from '../types'

/**
 * Helper that converts a typed `AnyItem` from the API into the display
 * shape used by `<CategorySection>`. Pulls the right "title" field per
 * category (registration / airport / flightNumber / crewName / ...).
 *
 * Lives in a non-`'use client'` module so it can be imported from server
 * components (e.g. `app/(app)/handover/[id]/page.tsx`) — pure helpers
 * exported from `'use client'` modules become module references on the
 * server and crash with `p is not a function`.
 */
export function toItemView(
  item: AnyItem,
  category: CategoryCode
): ItemViewModel {
  const base: Pick<
    ItemViewModel,
    'id' | 'priority' | 'status' | 'owner' | 'flightsAffected' | 'resolvedAt'
  > = {
    id: item.id,
    priority: item.priority,
    status: item.status,
    owner: item.owner ?? null,
    flightsAffected:
      'flightsAffected' in item ? item.flightsAffected ?? null : null,
    resolvedAt: item.resolvedAt ?? null,
  }

  switch (category) {
    case 'aircraft': {
      const i = item as Extract<AnyItem, { registration: string }>
      return {
        ...base,
        title: `${i.registration}${i.type ? ` · ${i.type}` : ''}`,
        description: i.issue,
      }
    }
    case 'airport': {
      const i = item as Extract<AnyItem, { airport: string }>
      return { ...base, title: i.airport, description: i.issue }
    }
    case 'flightSchedule': {
      const i = item as Extract<AnyItem, { flightNumber: string }>
      return {
        ...base,
        title: `${i.flightNumber}${i.route ? ` · ${i.route}` : ''}`,
        description: i.issue,
      }
    }
    case 'crew': {
      const i = item as Extract<AnyItem, { crewName?: string | null }>
      const name = i.crewName ?? i.crewId ?? '—'
      return {
        ...base,
        title: `${name}${i.role ? ` (${i.role})` : ''}`,
        description: i.issue,
      }
    }
    case 'weather': {
      const i = item as Extract<AnyItem, { weatherType: string }>
      return {
        ...base,
        title: `${i.affectedArea} · ${i.weatherType}`,
        description: i.issue,
      }
    }
    case 'system': {
      const i = item as Extract<AnyItem, { systemName: string }>
      return { ...base, title: i.systemName, description: i.issue }
    }
    case 'abnormal': {
      const i = item as Extract<AnyItem, { eventType: string }>
      return { ...base, title: i.eventType, description: i.description }
    }
  }
}
