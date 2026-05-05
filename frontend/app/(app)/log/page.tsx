import { LogClient } from './LogClient'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import type { HandoverListResponse, HandoverListRow } from '@/lib/types'

async function loadLog(): Promise<{ rows: HandoverListRow[]; error?: string }> {
  try {
    const list = await backendFetch<HandoverListResponse>(
      '/api/v1/handovers?limit=50'
    )
    return { rows: list.data }
  } catch (err) {
    const message =
      err instanceof BackendApiError
        ? `Backend ${err.status}: ${err.message}`
        : 'Backend unreachable'
    return { rows: [], error: message }
  }
}

export default async function LogPage() {
  const { rows, error } = await loadLog()
  return <LogClient rows={rows} error={error} />
}
