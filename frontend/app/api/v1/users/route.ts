import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

export async function GET() {
  try {
    const data = await backendFetch<unknown>('/api/v1/users')
    return NextResponse.json(data)
  } catch (err) {
    return toErrorResponse(err)
  }
}

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
    const user = await backendFetch<unknown>('/api/v1/users', {
      method: 'POST',
      body,
    })
    return NextResponse.json(user, { status: 201 })
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
