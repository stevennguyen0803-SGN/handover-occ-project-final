'use client'

import { useState } from 'react'

import {
  HandoverFilters,
  type HandoverFiltersValue,
} from '@/components/handover/HandoverFilters'
import { HandoverTable } from '@/components/handover/HandoverTable'
import type { HandoverListRow, QuickFilter } from '@/lib/types'

const DEFAULT_FILTERS: HandoverFiltersValue = {
  search: '',
  shift: 'All',
  priority: 'All',
  status: 'All',
  unack: false,
  carryForward: false,
}

export function LogClient({
  rows,
  error,
}: {
  rows: HandoverListRow[]
  error?: string
}) {
  const [filters, setFilters] = useState<HandoverFiltersValue>(DEFAULT_FILTERS)
  const [quick, setQuick] = useState<QuickFilter>('all')

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-fg">Handover Log</h1>
      </header>
      {error && (
        <div className="rounded-md border border-priority-high bg-priority-high-bg px-3 py-2 text-sm text-priority-high-fg">
          {error}.
        </div>
      )}
      <HandoverFilters
        value={filters}
        onChange={setFilters}
        quickFilter={quick}
        onQuickFilterChange={setQuick}
      />
      <HandoverTable handovers={rows} />
    </div>
  )
}
