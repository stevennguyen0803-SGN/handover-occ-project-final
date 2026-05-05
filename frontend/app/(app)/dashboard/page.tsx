import Link from 'next/link'

import { DashboardKpis } from '@/components/dashboard/DashboardKpis'
import { HandoverTable } from '@/components/handover/HandoverTable'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import type {
  DashboardSummary,
  HandoverListResponse,
  HandoverListRow,
} from '@/lib/types'

const EMPTY_SUMMARY: DashboardSummary = {
  totalHandovers: 0,
  openHandovers: 0,
  highOrCritical: 0,
  flightsAffected: 0,
  awaitingAcknowledgment: 0,
  carriedForwardCount: 0,
  aircraftIssues: 0,
  byCategory: {
    aircraft: 0,
    airport: 0,
    flightSchedule: 0,
    crew: 0,
    weather: 0,
    system: 0,
    abnormal: 0,
  },
  byPriority: { Low: 0, Normal: 0, High: 0, Critical: 0 },
  byShift: { Morning: 0, Afternoon: 0, Night: 0 },
  abnormalEventsByType: {},
}

interface BackendDashboardSummary {
  today: {
    totalHandovers: number
    openItems: number
    monitoringItems: number
    resolvedItems: number
    criticalItems: number
    unacknowledgedHighPriority: number
  }
  openByCategory: {
    aircraft: number
    airport: number
    flightSchedule: number
    crew: number
    weather: number
    system: number
    abnormalEvents: number
  }
  carriedForwardCount: number
}

/**
 * Maps the richer backend dashboard summary to the leaner KPI shape
 * the existing `DashboardKpis` component expects. Fields not provided
 * by the backend (e.g. `flightsAffected`) fall back to 0; we can extend
 * the backend response when those KPIs become product-required.
 */
function mapDashboardSummary(
  backend: BackendDashboardSummary
): DashboardSummary {
  return {
    totalHandovers: backend.today.totalHandovers,
    openHandovers: backend.today.openItems,
    highOrCritical: backend.today.criticalItems,
    flightsAffected: 0,
    awaitingAcknowledgment: backend.today.unacknowledgedHighPriority,
    carriedForwardCount: backend.carriedForwardCount,
    aircraftIssues: backend.openByCategory.aircraft,
    byCategory: {
      aircraft: backend.openByCategory.aircraft,
      airport: backend.openByCategory.airport,
      flightSchedule: backend.openByCategory.flightSchedule,
      crew: backend.openByCategory.crew,
      weather: backend.openByCategory.weather,
      system: backend.openByCategory.system,
      abnormal: backend.openByCategory.abnormalEvents,
    },
    byPriority: { Low: 0, Normal: 0, High: 0, Critical: 0 },
    byShift: { Morning: 0, Afternoon: 0, Night: 0 },
    abnormalEventsByType: {},
  }
}

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
    return { summary: EMPTY_SUMMARY, handovers: [], error: message }
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
