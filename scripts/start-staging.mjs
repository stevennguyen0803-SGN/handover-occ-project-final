import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

import {
  applyDatabaseRuntimeConfig,
  logDatabaseRuntimeConfig,
} from './apply-database-runtime-config.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const rootDirectory = resolve(scriptDirectory, '..')
const rootEnvPath = resolve(rootDirectory, '.env')
const frontendDirectory = resolve(rootDirectory, 'frontend')
const backendEntry = resolve(rootDirectory, 'backend/dist/server.js')
const nextCliEntry = resolve(
  rootDirectory,
  'frontend/node_modules/next/dist/bin/next'
)
const frontendBuildIdEntry = resolve(frontendDirectory, '.next/BUILD_ID')
const prismaCliEntry = resolve(rootDirectory, 'node_modules/prisma/build/index.js')
const frontendPrismaSyncEntry = resolve(
  rootDirectory,
  'scripts/sync-frontend-prisma-client.mjs'
)
const prismaSchemaPath = resolve(rootDirectory, 'database/prisma/schema.prisma')

if (existsSync(rootEnvPath)) {
  process.loadEnvFile(rootEnvPath)
}

logDatabaseRuntimeConfig(applyDatabaseRuntimeConfig(process.env))

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
]

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (key) => !process.env[key]
)

if (missingEnvironmentVariables.length > 0) {
  console.error(
    `[staging] Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  )
  process.exit(1)
}

const requiredBuildArtifacts = [
  backendEntry,
  nextCliEntry,
  frontendBuildIdEntry,
  prismaCliEntry,
  frontendPrismaSyncEntry,
]

const missingArtifacts = requiredBuildArtifacts.filter((filePath) => !existsSync(filePath))

if (missingArtifacts.length > 0) {
  console.error(
    `[staging] Missing runtime artifacts. Run \`npm run build\` first.\n${missingArtifacts.join('\n')}`
  )
  process.exit(1)
}

function runNodeCommand(
  entryPoint,
  args = [],
  { cwd = rootDirectory, env = process.env } = {}
) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entryPoint, ...args], {
      cwd,
      env,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${entryPoint} exited with signal ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`${entryPoint} exited with code ${code ?? 1}`))
        return
      }

      resolve()
    })
  })
}

async function runPrismaMigrateDeploy() {
  await runNodeCommand(
    prismaCliEntry,
    ['migrate', 'deploy', '--schema', prismaSchemaPath]
  )
}

async function runPrismaMigrateDeployWithRetry(maxAttempts = 20, delayMs = 3_000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await runPrismaMigrateDeploy()
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }

      console.error(
        `[staging] Database migration attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round(
          delayMs / 1_000
        )}s...`
      )
      await delay(delayMs)
    }
  }
}

function spawnManagedProcess(
  label,
  entryPoint,
  args,
  env,
  cwd = rootDirectory
) {
  const child = spawn(process.execPath, [entryPoint, ...args], {
    cwd,
    env,
    stdio: 'inherit',
  })

  child.on('error', (error) => {
    console.error(`[staging] Failed to start ${label}:`, error)
  })

  return child
}

async function main() {
  const frontendPort = process.env.FRONTEND_PORT ?? '3000'
  const backendPort = process.env.BACKEND_PORT ?? '4000'
  const backendUrl = process.env.BACKEND_URL ?? `http://127.0.0.1:${backendPort}`

  console.log('[staging] Syncing frontend Prisma client...')
  await runNodeCommand(frontendPrismaSyncEntry)

  // Retry migrations so the app container can wait for Postgres readiness on first boot.
  console.log('[staging] Running database migrations...')
  await runPrismaMigrateDeployWithRetry()

  const managedChildren = new Set()
  let shuttingDown = false

  const stopChildren = async (signal = 'SIGTERM') => {
    if (shuttingDown) {
      return
    }

    shuttingDown = true

    for (const child of managedChildren) {
      if (!child.killed) {
        child.kill(signal)
      }
    }

    await Promise.allSettled(
      Array.from(managedChildren).map(
        (child) =>
          new Promise((resolve) => {
            if (child.exitCode !== null || child.signalCode !== null) {
              resolve()
              return
            }

            child.once('exit', () => resolve())
          })
      )
    )
  }

  const backendProcess = spawnManagedProcess('backend', backendEntry, [], {
    ...process.env,
    NODE_ENV: 'production',
    PORT: backendPort,
  })
  const frontendProcess = spawnManagedProcess(
    'frontend',
    nextCliEntry,
    ['start', '-H', '0.0.0.0', '-p', frontendPort],
    {
      ...process.env,
      NODE_ENV: 'production',
      PORT: frontendPort,
      BACKEND_URL: backendUrl,
    },
    frontendDirectory
  )

  managedChildren.add(backendProcess)
  managedChildren.add(frontendProcess)

  const exitPromises = [
    ['backend', backendProcess],
    ['frontend', frontendProcess],
  ].map(
    ([label, child]) =>
      new Promise((resolve) => {
        child.once('exit', (code, signal) => {
          resolve({
            label,
            code: code ?? 0,
            signal,
          })
        })
      })
  )

  const handleSignal = async (signal) => {
    await stopChildren(signal)
    process.exit(0)
  }

  process.on('SIGINT', handleSignal)
  process.on('SIGTERM', handleSignal)

  const firstExit = await Promise.race(exitPromises)

  if (!shuttingDown) {
    console.error(
      `[staging] ${firstExit.label} exited unexpectedly${
        firstExit.signal
          ? ` with signal ${firstExit.signal}`
          : ` with code ${firstExit.code}`
      }. Stopping the remaining service...`
    )
    await stopChildren()
  }

  process.exit(typeof firstExit.code === 'number' ? firstExit.code : 1)
}

main().catch((error) => {
  console.error('[staging] Startup failed.')
  console.error(error)
  process.exit(1)
})
