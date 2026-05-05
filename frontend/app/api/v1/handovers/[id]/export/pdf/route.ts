import { auth } from '@/auth'
import { createBackendAuthHeaders } from '@/lib/server/backend-auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'

interface RouteContext {
  params: { id: string }
}

/**
 * Streams the per-handover printable HTML the backend produces at
 * `GET /api/v1/handovers/:id/export/pdf` (BR-14: PDF is per-handover,
 * never list-level). The browser is expected to render the response
 * and trigger Print → Save as PDF; if the caller adds `?autoPrint=1`
 * to the URL we inject a tiny `<script>window.print()</script>` so
 * the dialog opens automatically.
 *
 * We can't use the shared `backendFetch<T>` helper because that helper
 * JSON-decodes responses by design — HTML must be passed through with
 * the original Content-Type intact.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return new Response(
      JSON.stringify({
        error: 'UNAUTHENTICATED',
        message: 'Not authenticated',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url)
  const autoPrint = url.searchParams.get('autoPrint') === '1'
  const target = new URL(
    `/api/v1/handovers/${encodeURIComponent(params.id)}/export/pdf`,
    BACKEND_URL
  )

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
      headers: { Accept: 'text/html', ...authHeaders },
      cache: 'no-store',
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'INTERNAL', message: 'Backend unreachable' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const rawBody = await res.text()

  if (!res.ok) {
    return new Response(rawBody || JSON.stringify({ status: res.status }), {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      },
    })
  }

  const body = autoPrint
    ? injectAutoPrint(rawBody)
    : rawBody

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':
        res.headers.get('Content-Type') ?? 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * Inject `window.print()` just before the closing `</body>` tag so the
 * print dialog opens as soon as the document is parsed. Falls back to
 * appending the script if the response is malformed and lacks `</body>`.
 */
function injectAutoPrint(html: string): string {
  const script =
    '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},250)});</script>'
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`)
  }
  return `${html}${script}`
}
