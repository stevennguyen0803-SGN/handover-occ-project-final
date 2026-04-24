import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  applyDatabaseRuntimeConfig,
  logDatabaseRuntimeConfig,
} from './apply-database-runtime-config.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const rootEnvPath = resolve(scriptDirectory, '../.env')
const [, , entryPoint, ...entryArgs] = process.argv

if (!entryPoint) {
  console.error('Usage: node scripts/run-node-with-root-env.mjs <entry-point> [...args]')
  process.exit(1)
}

process.loadEnvFile(rootEnvPath)
logDatabaseRuntimeConfig(applyDatabaseRuntimeConfig(process.env))

const resolvedEntryPoint = resolve(process.cwd(), entryPoint)
const child = spawn(process.execPath, [resolvedEntryPoint, ...entryArgs], {
  stdio: 'inherit',
  env: process.env,
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
