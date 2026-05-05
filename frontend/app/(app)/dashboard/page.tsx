import Link from 'next/link'

import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { HandoverTable } from '@/components/handover/HandoverTable'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import {
  EMPTY_DASHBOARD_SUMMARY,
  mapDashboardSummary,
  type BackendDashboardSummary,
} from '@/lib/dashboard/mapDashboardSummary'
import type {
  DashboardSummary,
  HandoverListResponse,
  HandoverListRow,
} from '@/lib/types'

async function loadDashboard(): Promise<{
  summary: DashboardSummary
  handovers: HandoverListRow[]
  error?: string
}> {
  try {
    const [backendSummary, list] = await Promise.all([
      backendFetch<BackendDashboardSummary>('/api/v1/dashboard/summary'),
      backendFetch<HandoverListResponse>('/api/v1/handovers?limit=10'),
    ])
    return {
      summary: mapDashboardSummary(backendSummary),
      handovers: list.data,
    }
  } catch (err) {
    const message =
      err instanceof BackendApiError
        ? `Backend ${err.status}: ${err.message}`
        : 'Backend unreachable'
    return { summary: EMPTY_DASHBOARD_SUMMARY, handovers: [], error: message }
  }
}

export default async function DashboardPage() {
  const { summary, handovers, error } = await loadDashboard()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
        <p className="text-sm text-fg-mute">Active operational overview</p>
      </header>
      {error && (
        <div className="rounded-md border border-priority-high bg-priority-high-bg px-3 py-2 text-sm text-priority-high-fg">
          {error}. Showing empty state — start the backend at{' '}
          <code className="font-mono">{process.env.BACKEND_URL ?? 'http://localhost:4000'}</code>{' '}
          and reload.
        </div>
      )}
      <DashboardKpis summary={summary} />
      <section>
        <header className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-fg">Recent handovers</h2>
          <Link href="/log" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </header>
        <HandoverTable handovers={handovers} />
      </section>
    </div>
  )
}
