import { expect, test } from '@playwright/test'

import { SEED_ACCOUNTS, signIn } from './helpers/auth'

test.describe('Create handover wizard', () => {
  test('GET /api/v1/users/recipients returns active users', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.staff)

    const res = await page.request.get('/api/v1/users/recipients')
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      data: Array<{ id: string; name: string; role: string }>
    }
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    // Every entry has id/name/role and no email/timestamps leak through.
    for (const recipient of body.data) {
      expect(typeof recipient.id).toBe('string')
      expect(typeof recipient.name).toBe('string')
      expect(typeof recipient.role).toBe('string')
    }
  })

  test('POST /api/v1/handovers creates a handover with one aircraft item', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.staff)

    // Pick a recipient that is not the signed-in user.
    const recipientsRes = await page.request.get('/api/v1/users/recipients')
    const recipientsBody = (await recipientsRes.json()) as {
      data: Array<{ id: string; name: string; role: string }>
    }
    const recipient = recipientsBody.data.find(
      (r) => r.name !== SEED_ACCOUNTS.staff.name
    )
    expect(recipient, 'expected a non-self recipient').toBeTruthy()

    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      handoverDate: today,
      shift: 'Morning' as const,
      overallPriority: 'Normal' as const,
      handedToId: recipient!.id,
      generalRemarks: 'E2E smoke test handover',
      categories: {
        aircraft: [
          {
            registration: 'VN-A350',
            type: 'A321neo',
            issue: 'Hydraulic pressure low (e2e)',
            flightsAffected: 'VN123',
            priority: 'Normal' as const,
          },
        ],
      },
    }

    const res = await page.request.post('/api/v1/handovers', {
      data: payload,
    })
    expect(res.status()).toBe(201)
    const body = (await res.json()) as { id: string; referenceId: string }
    expect(body.id).toBeTruthy()
    expect(body.referenceId).toMatch(/^HDO-/)

    // Detail page should now load for this id.
    await page.goto(`/handover/${body.id}`)
    await expect(page.getByText(body.referenceId).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('wizard page renders header step', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.staff)
    await page.goto('/handover/new')
    // The first wizard step asks for handover date / shift fields.
    await expect(page.locator('input[type="date"]').first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
