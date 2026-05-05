import { defineConfig, devices } from '@playwright/test'

const PORT_FRONTEND = Number(process.env.E2E_FRONTEND_PORT ?? 3000)
const PORT_BACKEND = Number(process.env.E2E_BACKEND_PORT ?? 4000)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT_FRONTEND}`

const startBackend = `node backend/dist/server.js`
const startFrontend = `npm --prefix frontend run start -- -p ${PORT_FRONTEND}`

const requiredAuthSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? ''

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_NO_WEB_SERVER
    ? undefined
    : [
        {
          command: startBackend,
          port: PORT_BACKEND,
          timeout: 120_000,
          reuseExistingServer: !process.env.CI,
          env: {
            PORT: String(PORT_BACKEND),
            NODE_ENV: 'production',
            NEXTAUTH_SECRET: requiredAuthSecret,
            AUTH_SECRET: requiredAuthSecret,
            DATABASE_URL: process.env.DATABASE_URL ?? '',
            DIRECT_URL: process.env.DIRECT_URL ?? '',
          },
        },
        {
          command: startFrontend,
          url: BASE_URL,
          timeout: 180_000,
          reuseExistingServer: !process.env.CI,
          env: {
            PORT: String(PORT_FRONTEND),
            NODE_ENV: 'production',
            BACKEND_URL: `http://localhost:${PORT_BACKEND}`,
            AUTH_TRUST_HOST: 'true',
            NEXTAUTH_SECRET: requiredAuthSecret,
            AUTH_SECRET: requiredAuthSecret,
            NEXTAUTH_URL: BASE_URL,
            DATABASE_URL: process.env.DATABASE_URL ?? '',
            DIRECT_URL: process.env.DIRECT_URL ?? '',
          },
        },
      ],
})
