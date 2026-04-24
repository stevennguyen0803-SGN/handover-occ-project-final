import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const rootDirectory = resolve(scriptDirectory, '..')
const startScriptEntry = resolve(rootDirectory, 'scripts/start-staging.mjs')

const frontendPort = process.env.FRONTEND_PORT ?? '3000'
const backendPort = process.env.BACKEND_PORT ?? '4000'
const frontendUrl = `http://localhost:${frontendPort}`
const backendUrl = `http://localhost:${backendPort}`
const timeoutMs = Number(process.env.STAGING_VERIFY_TIMEOUT_MS ?? 60_000)
const pollIntervalMs = 2_000

const child = spawn(process.execPath, [startScriptEntry], {
  cwd: rootDirectory,
  env: {
    ...process.env,
    FRONTEND_PORT: frontendPort,
    BACKEND_PORT: backendPort,
    NEXTAUTH_URL: frontendUrl,
    BACKEND_URL: backendUrl,
  },
  stdio: 'inherit',
})

let childExit = null

child.on('exit', (code, signal) => {
  childExit = { code: code ?? 0, signal }
})

child.on('error', (error) => {
  console.error('[staging-verify] Failed to launch the staging process.')
  console.error(error)
})

async function stopChild() {
  if (child.exitCode !== null || child.signalCode !== null) {
    return
  }

  child.kill('SIGTERM')

  await Promise.race([
    new Promise((resolve) => {
      child.once('exit', () => resolve())
    }),
    delay(10_000).then(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL')
      }
    }),
  ])
}

async function assertFrontendReady() {
  const response = await fetch(`${frontendUrl}/login`)

  if (!response.ok) {
    throw new Error(
      `Frontend readiness probe failed with status ${response.status} at ${frontendUrl}/login`
    )
  }
}

async function assertBackendReady() {
  const response = await fetch(`${backendUrl}/health`)

  if (!response.ok) {
    throw new Error(
      `Backend readiness probe failed with status ${response.status} at ${backendUrl}/health`
    )
  }

  const payload = await response.json()

  if (payload?.status !== 'ok') {
    throw new Error(
      `Backend readiness probe returned an unexpected payload: ${JSON.stringify(payload)}`
    )
  }
}

async function waitForReadiness() {
  const deadline = Date.now() + timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    if (childExit) {
      throw new Error(
        `Staging process exited before becoming ready${
          childExit.signal
            ? ` (signal ${childExit.signal})`
            : ` (code ${childExit.code})`
        }`
      )
    }

    try {
      await Promise.all([assertFrontendReady(), assertBackendReady()])
      return
    } catch (error) {
      lastError = error
      await delay(pollIntervalMs)
    }
  }

  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1_000)}s waiting for local staging readiness.${
      lastError instanceof Error ? ` Last error: ${lastError.message}` : ''
    }`
  )
}

async function main() {
  const handleSignal = async () => {
    await stopChild()
    process.exit(1)
  }

  process.on('SIGINT', handleSignal)
  process.on('SIGTERM', handleSignal)

  try {
    console.log(
      `[staging-verify] Starting local staging on ${frontendUrl} (frontend) and ${backendUrl} (backend)...`
    )
    await waitForReadiness()
    console.log(
      `[staging-verify] Local staging is ready. Frontend login endpoint and backend health check both responded within ${Math.round(
        timeoutMs / 1_000
      )}s.`
    )
  } finally {
    await stopChild()
  }
}

main().catch((error) => {
  console.error('[staging-verify] Verification failed.')
  console.error(error)
  process.exit(1)
})
