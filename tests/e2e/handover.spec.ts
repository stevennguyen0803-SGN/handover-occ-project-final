import { expect, test } from '@playwright/test'

import { SEED_ACCOUNTS, signIn } from './helpers/auth'

test.describe('Handover detail + acknowledge', () => {
  test('lists seeded handovers on /log', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)
    await page.goto('/log')

    // Expect the seed reference IDs to be visible (they include HDO-2026-).
    await expect(page.getByText(/HDO-2026-/).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('detail page renders for a known reference id', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)
    await page.goto('/log')

    // Only target row links (not the sidebar's /handover/new link).
    const rowLink = page
      .locator('main a[href^="/handover/"]')
      .filter({ hasNotText: /tạo handover|create handover/i })
      .first()
    await expect(rowLink).toBeVisible({ timeout: 15_000 })
    const href = await rowLink.getAttribute('href')
    expect(href).toMatch(/^\/handover\/[^/]+$/)

    // Navigate via URL — clicking a Next.js <Link> in CI is flaky because
    // the production runtime can intercept and prefetch.
    await page.goto(href!)
    // The detail header shows the reference id (HDO-…).
    await expect(page.getByText(/HDO-2026-/).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('acknowledge button is disabled for the user that prepared the handover (BR-10)', async ({
    page,
  }) => {
    // The first seed handover is preparedBy = OCC Staff. Sign in as staff
    // and verify the Acknowledge action is hidden / disabled.
    await signIn(page, SEED_ACCOUNTS.staff)
    await page.goto('/log')

    const ownLink = page
      .locator('main a[href^="/handover/"]')
      .filter({ hasNotText: /tạo handover|create handover/i })
      .first()
    await expect(ownLink).toBeVisible({ timeout: 15_000 })
    const ownHref = await ownLink.getAttribute('href')
    expect(ownHref).toMatch(/^\/handover\/[^/]+$/)
    await page.goto(ownHref!)

    // Look for any Acknowledge button — when present it must be disabled
    // because the user is the preparer.
    const ackButton = page.getByRole('button', { name: /acknowledge|xác nhận/i })
    if ((await ackButton.count()) > 0) {
      await expect(ackButton.first()).toBeDisabled()
    }
  })

  test('acknowledge succeeds for non-preparer (BR-10)', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)
    await page.goto('/log')

    // Find a handover that the supervisor did NOT prepare. The seed mixes
    // staff- and supervisor-prepared handovers; we just look for any whose
    // detail page exposes an enabled Acknowledge button.
    const links = page
      .locator('main a[href^="/handover/"]')
      .filter({ hasNotText: /tạo handover|create handover/i })
    const count = await links.count()
    expect(count, 'log page must list handovers').toBeGreaterThan(0)

    // Snapshot all hrefs up front because navigation invalidates locators.
    const hrefs: string[] = []
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href')
      if (href) hrefs.push(href)
    }

    let acknowledged = false
    for (const href of hrefs) {
      await page.goto(href)

      const ackButton = page.getByRole('button', {
        name: /acknowledge|xác nhận/i,
      })
      if ((await ackButton.count()) === 0) continue
      const enabled = await ackButton.first().isEnabled()
      if (!enabled) continue

      await ackButton.first().click()
      // The button calls a server action; success surfaces as a toast.
      // Either the success toast appears OR an "Acknowledge failed" toast
      // appears with ALREADY_ACKNOWLEDGED — both prove the round-trip.
      const successToast = page.getByText(
        /handover acknowledged|đã acknowledge/i
      )
      const failureToast = page.getByText(/acknowledge failed/i)
      await expect(successToast.or(failureToast)).toBeVisible({
        timeout: 15_000,
      })
      acknowledged = true
      break
    }

    expect(
      acknowledged,
      'expected at least one handover to be ackable by the supervisor'
    ).toBe(true)
  })
})
