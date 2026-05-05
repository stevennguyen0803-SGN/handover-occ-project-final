import type { Page } from '@playwright/test'

export type SeedAccount = {
  email: string
  password: string
  name: string
  role: 'OCC_STAFF' | 'SUPERVISOR' | 'MANAGEMENT_VIEWER' | 'ADMIN'
}

/**
 * The seed script (`npm run db:seed`) creates these three accounts with the
 * password `Password123!`.
 */
export const SEED_ACCOUNTS = {
  staff: {
    email: 'occ.staff@example.com',
    password: 'Password123!',
    name: 'OCC Staff',
    role: 'OCC_STAFF',
  },
  supervisor: {
    email: 'supervisor@example.com',
    password: 'Password123!',
    name: 'Shift Supervisor',
    role: 'SUPERVISOR',
  },
  admin: {
    email: 'admin@example.com',
    password: 'Password123!',
    name: 'System Admin',
    role: 'ADMIN',
  },
} as const satisfies Record<string, SeedAccount>

export async function signIn(page: Page, account: SeedAccount): Promise<void> {
  await page.goto('/signin')
  await page.locator('input[type="email"]').fill(account.email)
  await page.locator('input[type="password"]').fill(account.password)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/signin'), {
      timeout: 15_000,
    }),
    page.locator('button[type="submit"]').click(),
  ])
}
