import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

export async function GET() {
  try {
    const profile = await backendFetch<unknown>('/api/v1/users/me')
    return NextResponse.json(profile)
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(req: Request) {
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
    const profile = await backendFetch<unknown>('/api/v1/users/me', {
      method: 'PATCH',
      body,
    })
    return NextResponse.json(profile)
  } catch (err) {
    return toErrorResponse(err)
  }
}

function toErrorResponse(err: unknown): NextResponse {
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
