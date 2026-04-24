import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const rootGeneratedClientDirectory = resolve(scriptDirectory, '../node_modules/.prisma/client')
const frontendPrismaDirectory = resolve(scriptDirectory, '../frontend/node_modules/.prisma')
const frontendGeneratedClientDirectory = resolve(frontendPrismaDirectory, 'client')

if (!existsSync(rootGeneratedClientDirectory)) {
  console.error('Root Prisma client is missing. Run `npm run db:generate` first.')
  process.exit(1)
}

mkdirSync(frontendPrismaDirectory, { recursive: true })
mkdirSync(frontendGeneratedClientDirectory, { recursive: true })
cpSync(rootGeneratedClientDirectory, frontendGeneratedClientDirectory, {
  recursive: true,
  force: true,
})
