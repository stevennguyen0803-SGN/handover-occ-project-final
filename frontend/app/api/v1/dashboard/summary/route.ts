import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

/**
 * Proxy `GET /api/v1/dashboard/summary` to the backend.
 */
export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/dashboard/summary')
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof BackendApiError) {
      return NextResponse.json(err.payload ?? { message: err.message }, {
        status: err.status,
      })
    }
    return NextResponse.json(
      { error: 'INTERNAL', message: 'Backend unreachable' },
      { status: 502 }
    )
  }
}
