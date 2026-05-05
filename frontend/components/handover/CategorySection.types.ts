import type { ItemStatus, Priority, UserSummary } from '@/lib/types'

export interface ItemViewModel {
  id: string
  title: string
  description: string
  priority: Priority
  status: ItemStatus
  owner?: UserSummary | null
  flightsAffected?: string | null
  resolvedAt?: string | null
}
