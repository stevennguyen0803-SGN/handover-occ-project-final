import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  try {
    const result = await backendFetch<unknown>(
      `/api/v1/handovers/${encodeURIComponent(params.id)}/acknowledge`,
      { method: 'POST', body }
    )
    return NextResponse.json(result)
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
