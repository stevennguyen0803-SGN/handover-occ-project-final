import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

/**
 * Proxy `GET /api/v1/handovers` to the backend, forwarding all query
 * parameters. Used by the reports page and the log/list page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  try {
    const data = await backendFetch<unknown>(
      `/api/v1/handovers${url.search}`
    )
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

/**
 * Proxy `POST /api/v1/handovers` to the backend with the caller's
 * signed `X-OCC-AUTH-*` headers. Used by the wizard's submit step.
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Body must be JSON' },
      { status: 400 }
    )
  }

  try {
    const created = await backendFetch<unknown>('/api/v1/handovers', {
      method: 'POST',
      body,
    })
    return NextResponse.json(created, { status: 201 })
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
