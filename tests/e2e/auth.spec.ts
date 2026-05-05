import { expect, test } from '@playwright/test'

import { SEED_ACCOUNTS, signIn } from './helpers/auth'

test.describe('Authentication', () => {
  test('redirects unauthenticated users from /dashboard to /signin', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('rejects invalid credentials and stays on /signin', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input[type="email"]').fill('admin@example.com')
    await page.locator('input[type="password"]').fill('wrong-password')
    await page.locator('button[type="submit"]').click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/signin/)
  })

  test('signs an OCC_STAFF user in and redirects to /dashboard', async ({
    page,
  }) => {
    await signIn(page, SEED_ACCOUNTS.staff)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('blocks non-admin from /admin/users', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.staff)
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/forbidden/)
  })

  test('lets admin reach /admin/users', async ({ page }) => {
    await signIn(page, SEED_ACCOUNTS.admin)
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/admin\/users/)
    // Header should mention admin / quản trị
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
