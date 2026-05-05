import { NextResponse } from 'next/server'

import { BackendApiError, backendFetch } from '@/lib/server/api-client'

/**
 * Proxy `POST /api/v1/users/me/sessions/revoke`. Stamps
 * `User.sessionsRevokedAt = now()` server-side; subsequent requests
 * signed before that cut-off are rejected as 403.
 */
export async function POST() {
  try {
    await backendFetch<unknown>('/api/v1/users/me/sessions/revoke', {
      method: 'POST',
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
