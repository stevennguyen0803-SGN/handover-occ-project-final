import { auth } from '@/auth'
import { createBackendAuthHeaders } from '@/lib/server/backend-auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'

/**
 * Streams the backend's CSV export back to the browser. Cannot use the
 * shared `backendFetch<T>` helper because that JSON-decodes responses
 * by design — CSV must be passed through verbatim with the original
 * `Content-Type` and `Content-Disposition` headers preserved.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return new Response(
      JSON.stringify({ error: 'UNAUTHENTICATED', message: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const target = new URL(`/api/v1/handovers/export/csv${url.search}`, BACKEND_URL)

  const authHeaders = createBackendAuthHeaders({
    id: session.user.id,
    name: session.user.name ?? session.user.email,
    email: session.user.email,
    role: session.user.role,
  })

  let res: Response
  try {
    res = await fetch(target, {
      method: 'GET',
      headers: {
        Accept: 'text/csv',
        ...authHeaders,
      },
      cache: 'no-store',
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'INTERNAL', message: 'Backend unreachable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return new Response(body || JSON.stringify({ status: res.status }), {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      },
    })
  }

  const headers = new Headers()
  headers.set(
    'Content-Type',
    res.headers.get('Content-Type') ?? 'text/csv; charset=utf-8'
  )
  const dispo = res.headers.get('Content-Disposition')
  if (dispo) headers.set('Content-Disposition', dispo)
  headers.set('Cache-Control', 'no-store')

  return new Response(res.body, { status: 200, headers })
}
