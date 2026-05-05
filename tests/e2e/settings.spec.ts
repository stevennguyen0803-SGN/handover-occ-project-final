import { expect, test } from '@playwright/test'

import { SEED_ACCOUNTS, signIn } from './helpers/auth'

test.describe('Settings → /api/v1/users/me', () => {
  test('GET /api/v1/users/me returns the signed-in profile', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    const res = await page.request.get('/api/v1/users/me')
    expect(res.status()).toBe(200)
    const body = (await res.json()) as {
      email: string
      name: string
      role: string
    }
    expect(body.email).toBe(SEED_ACCOUNTS.supervisor.email)
    expect(body.name).toBe(SEED_ACCOUNTS.supervisor.name)
    expect(body.role).toBe(SEED_ACCOUNTS.supervisor.role)
  })

  test('PATCH /api/v1/users/me updates the display name', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    const original = SEED_ACCOUNTS.supervisor.name
    const updated = `${original} ${Math.floor(Math.random() * 1e6)}`

    const patch = await page.request.patch('/api/v1/users/me', {
      data: { name: updated },
    })
    expect(patch.status()).toBe(200)

    const after = await page.request.get('/api/v1/users/me')
    const body = (await after.json()) as { name: string }
    expect(body.name).toBe(updated)

    // Restore so other tests aren't affected by the rename.
    const restore = await page.request.patch('/api/v1/users/me', {
      data: { name: original },
    })
    expect(restore.status()).toBe(200)
  })

  test('POST /api/v1/users/me/password rejects wrong current password', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    const res = await page.request.post('/api/v1/users/me/password', {
      data: {
        currentPassword: 'definitely-wrong-pw',
        newPassword: 'NewSecret123!',
      },
    })
    expect(res.status()).toBe(400)
    const body = (await res.json()) as { error?: string }
    expect(body.error).toBe('WRONG_CURRENT')
  })

  test('POST /api/v1/users/me/password rejects new password equal to current', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)

    const res = await page.request.post('/api/v1/users/me/password', {
      data: {
        currentPassword: SEED_ACCOUNTS.supervisor.password,
        newPassword: SEED_ACCOUNTS.supervisor.password,
      },
    })
    // The Zod refine surfaces this as VALIDATION_FAILED; the service-level
    // SAME_AS_CURRENT only fires when bcrypt comparison detects a stored
    // duplicate. Either path is acceptable.
    expect([400]).toContain(res.status())
    const body = (await res.json()) as { error?: string }
    expect(['VALIDATION_FAILED', 'SAME_AS_CURRENT']).toContain(body.error)
  })

  test('settings UI loads the profile', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.supervisor)
    await page.goto('/settings')
    // Wait for the loading placeholder to be replaced.
    await expect(
      page.locator('input[type="email"]').first()
    ).toHaveValue(SEED_ACCOUNTS.supervisor.email, { timeout: 15_000 })
  })
})
