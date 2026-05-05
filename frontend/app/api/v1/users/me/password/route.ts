import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

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
    await backendFetch<unknown>('/api/v1/users/me/password', {
      method: 'POST',
      body,
    })
    return new NextResponse(null, { status: 204 })
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
