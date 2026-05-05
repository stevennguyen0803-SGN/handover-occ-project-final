import { expect, test } from '@playwright/test'

import { SEED_ACCOUNTS, signIn } from './helpers/auth'

test.describe('Export PDF', () => {
  test('GET /api/v1/handovers/:id/export/pdf returns printable HTML', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    // Find any seeded handover to export.
    const list = await page.request.get('/api/v1/handovers?limit=1')
    expect(list.status()).toBe(200)
    const listBody = (await list.json()) as {
      data: Array<{ id: string; referenceId: string }>
    }
    expect(listBody.data.length).toBeGreaterThan(0)
    const target = listBody.data[0]

    const res = await page.request.get(
      `/api/v1/handovers/${target.id}/export/pdf`
    )
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/text\/html/)
    const body = await res.text()
    // Backend HTML always includes the reference id in the <h1>.
    expect(body).toContain(target.referenceId)
    // Without ?autoPrint the response should not contain the print script.
    expect(body).not.toContain('window.print()')
  })

  test('?autoPrint=1 injects window.print()', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    const list = await page.request.get('/api/v1/handovers?limit=1')
    const listBody = (await list.json()) as {
      data: Array<{ id: string }>
    }
    const target = listBody.data[0]

    const res = await page.request.get(
      `/api/v1/handovers/${target.id}/export/pdf?autoPrint=1`
    )
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('window.print()')
  })

  test('export endpoint requires authentication', async ({ request }) => {
    const res = await request.get(
      '/api/v1/handovers/cln-fake-id/export/pdf'
    )
    // Either the route returns 401 (no session), or NextAuth.js
    // middleware redirects to /signin (which doesn't accept GET for an
    // API path either, returning 200 HTML for /signin or 405 redirect).
    expect([200, 401, 403, 405]).toContain(res.status())
    if (res.status() === 200) {
      // If middleware redirected to /signin, the response should NOT be
      // the backend HTML export — verify by checking it's the signin
      // page (no `<h1>HDO-` reference).
      const body = await res.text()
      expect(body).not.toMatch(/<h1>HDO-/)
    }
  })
})
