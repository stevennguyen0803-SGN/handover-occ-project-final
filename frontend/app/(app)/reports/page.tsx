'use client'

import { useState } from 'react'

import { ExportButton } from '@/components/reports/ExportButton'
import {
  DEFAULT_REPORT_FILTERS,
  ReportFilters,
} from '@/components/reports/ReportFilters'
import { ReportPreview } from '@/components/reports/ReportPreview'
import type {
  ExportFormat,
  ReportDataset,
  ReportFiltersValue,
} from '@/lib/types'

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersValue>(
    DEFAULT_REPORT_FILTERS
  )
  const [dataset, setDataset] = useState<ReportDataset | null>(null)

  const loadDataset = async (next: ReportFiltersValue) => {
    setDataset({
      filters: next,
      generatedAt: new Date().toISOString(),
      totalHandovers: 0,
      rows: [],
      totals: {
        byShift: { Morning: 0, Afternoon: 0, Night: 0 },
        byPriority: { Low: 0, Normal: 0, High: 0, Critical: 0 },
        byStatus: { Open: 0, Monitoring: 0, Resolved: 0 },
      },
    })
  }

  const exportTo = async (
    _format: ExportFormat,
    _filters: ReportFiltersValue
  ) => {
    // Real implementation triggers a navigation to the CSV/PDF endpoint
    // on the backend; the browser handles the download via the
    // Content-Disposition header.
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-fg">Reports & Export</h1>
          <p className="text-sm text-fg-mute">
            Filter handovers by date range and export to PDF / CSV.
          </p>
        </div>
        <ExportButton
          filters={filters}
          exportTo={exportTo}
          onPrint={() => window.print()}
        />
      </header>

      <div className="print:hidden">
        <ReportFilters
          value={filters}
          onChange={setFilters}
          onApply={() => loadDataset(filters)}
          onReset={() => {
            setFilters(DEFAULT_REPORT_FILTERS)
            setDataset(null)
          }}
        />
      </div>

      <ReportPreview dataset={dataset} />
    </div>
  )
}
