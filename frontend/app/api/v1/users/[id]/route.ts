import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const user = await backendFetch<unknown>(
      `/api/v1/users/${encodeURIComponent(params.id)}`,
      { method: 'PATCH', body }
    )
    return NextResponse.json(user)
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await backendFetch<unknown>(
      `/api/v1/users/${encodeURIComponent(params.id)}`,
      { method: 'DELETE' }
    )
    return NextResponse.json(user)
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
