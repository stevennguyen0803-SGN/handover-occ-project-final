import { createHmac } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { AuditAction, PrismaClient, UserRole } from '@prisma/client'
import {
  applyDatabaseRuntimeConfig,
  logDatabaseRuntimeConfig,
} from './apply-database-runtime-config.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const rootDirectory = resolve(scriptDirectory, '..')
const rootEnvPath = resolve(rootDirectory, '.env')

const shouldLoadRootEnv =
  !process.env.DATABASE_URL ||
  (!process.env.NEXTAUTH_SECRET && !process.env.AUTH_SECRET) ||
  !process.env.NEXTAUTH_URL

if (existsSync(rootEnvPath) && shouldLoadRootEnv) {
  process.loadEnvFile(rootEnvPath)
}

logDatabaseRuntimeConfig(applyDatabaseRuntimeConfig(process.env))

const prisma = new PrismaClient()

const FRONTEND_URL =
  process.env.PERF_FRONTEND_URL ??
  process.env.NEXTAUTH_URL ??
  'http://localhost:3000'
const BACKEND_URL =
  process.env.PERF_BACKEND_URL ??
  process.env.BACKEND_URL ??
  'http://localhost:4000'
const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

const PERF_TAG = '[PERF-CHECK]'
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-')
const BASELINE_READ_REQUESTS = Number(process.env.PERF_BASELINE_READ_REQUESTS ?? 10)
const BASELINE_WRITE_REQUESTS = Number(process.env.PERF_BASELINE_WRITE_REQUESTS ?? 5)
const READ_STAGES = [
  { concurrency: 5, durationSeconds: 30 },
  { concurrency: 10, durationSeconds: 30 },
  { concurrency: 20, durationSeconds: 30 },
]
const WRITE_STAGES = [
  { concurrency: 2, durationSeconds: 20 },
  { concurrency: 5, durationSeconds: 20 },
]

const ENDPOINT_TARGETS = {
  dashboardSummary: {
    avgMs: 200,
    p95Ms: 500,
    p99Ms: 1000,
  },
  handoverList: {
    avgMs: 300,
    p95Ms: 600,
    p99Ms: 1000,
  },
  createHandover: {
    avgMs: 500,
    p95Ms: 1000,
    p99Ms: 2000,
  },
}

function assertRequiredConfiguration() {
  if (!AUTH_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET or AUTH_SECRET must be set before running perf:check.'
    )
  }
}

function formatDateOnly(value) {
  return value.toISOString().slice(0, 10)
}

function addUtcDays(date, days) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)

  return next
}

function buildBackendAuthHeaders(user) {
  const timestamp = Date.now().toString()
  const payload = [
    user.id,
    user.name,
    user.email,
    user.role,
    timestamp,
  ].join(':')
  const signature = createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url')

  return {
    'x-occ-auth-user-id': user.id,
    'x-occ-auth-user-name': user.name,
    'x-occ-auth-user-email': user.email,
    'x-occ-auth-user-role': user.role,
    'x-occ-auth-timestamp': timestamp,
    'x-occ-auth-signature': signature,
  }
}

async function fetchWithDrain(url, options) {
  const response = await fetch(url, options)
  await response.arrayBuffer()

  return response
}

async function backendRequest(path, user, options = {}) {
  const url = new URL(path.startsWith('/api/v1') ? path : `/api/v1${path}`, BACKEND_URL)

  return fetchWithDrain(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...buildBackendAuthHeaders(user),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  })
}

async function requireUser(email, role) {
  const user = await prisma.user.findFirst({
    where: {
      email,
      role,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (!user) {
    throw new Error(
      `Active user not found for ${email}. Run "npm run db:seed:uat" before perf:check.`
    )
  }

  return user
}

async function assertEnvironmentReachable() {
  const frontendResponse = await fetchWithDrain(new URL('/login', FRONTEND_URL))
  if (frontendResponse.status !== 200) {
    throw new Error(
      `Frontend reachability check failed with status ${frontendResponse.status}.`
    )
  }

  const backendResponse = await fetch(new URL('/health', BACKEND_URL))
  const payload = await backendResponse.json()
  if (backendResponse.status !== 200 || payload?.status !== 'ok') {
    throw new Error(
      `Backend health check failed with status ${backendResponse.status} and payload ${JSON.stringify(payload)}.`
    )
  }
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) {
    return 0
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil(sortedValues.length * percentileValue) - 1
  )

  return sortedValues[index]
}

function roundMetric(value) {
  return Number(value.toFixed(2))
}

function summariseMetrics({
  profile,
  endpoint,
  latencies,
  errorCount,
  requestCount,
  successCount,
  statusCounts,
  startedAt,
  completedAt,
}) {
  const durationMs = Math.max(1, completedAt - startedAt)
  const sortedLatencies = [...latencies].sort((left, right) => left - right)
  const averageLatency =
    latencies.length === 0
      ? 0
      : latencies.reduce((sum, value) => sum + value, 0) / latencies.length

  return {
    profile,
    endpoint,
    requestCount,
    successCount,
    errorCount,
    durationMs: roundMetric(durationMs),
    requestsPerSecond: roundMetric((requestCount / durationMs) * 1000),
    minMs: roundMetric(sortedLatencies[0] ?? 0),
    avgMs: roundMetric(averageLatency),
    p95Ms: roundMetric(percentile(sortedLatencies, 0.95)),
    p99Ms: roundMetric(percentile(sortedLatencies, 0.99)),
    maxMs: roundMetric(sortedLatencies[sortedLatencies.length - 1] ?? 0),
    statusSummary: Object.entries(statusCounts)
      .sort((left, right) => Number(left[0]) - Number(right[0]))
      .map(([status, count]) => `${status}:${count}`)
      .join(', '),
  }
}

async function runSequentialStage({ endpoint, profile, requestCount, executeRequest }) {
  const latencies = []
  const statusCounts = {}
  let successCount = 0
  let errorCount = 0
  const startedAt = performance.now()

  for (let index = 0; index < requestCount; index += 1) {
    const requestStartedAt = performance.now()

    try {
      const response = await executeRequest(index)
      latencies.push(performance.now() - requestStartedAt)
      statusCounts[response.status] = (statusCounts[response.status] ?? 0) + 1

      if (response.ok) {
        successCount += 1
      } else {
        errorCount += 1
      }
    } catch {
      latencies.push(performance.now() - requestStartedAt)
      errorCount += 1
    }
  }

  return summariseMetrics({
    profile,
    endpoint,
    latencies,
    errorCount,
    requestCount,
    successCount,
    statusCounts,
    startedAt,
    completedAt: performance.now(),
  })
}

async function runTimedStage({
  endpoint,
  profile,
  concurrency,
  durationSeconds,
  executeRequest,
}) {
  const latencies = []
  const statusCounts = {}
  let requestCount = 0
  let successCount = 0
  let errorCount = 0
  let nextIndex = 0
  const startedAt = performance.now()
  const deadline = Date.now() + durationSeconds * 1000

  async function worker() {
    while (Date.now() < deadline) {
      const currentIndex = nextIndex
      nextIndex += 1
      const requestStartedAt = performance.now()

      try {
        const response = await executeRequest(currentIndex)
        latencies.push(performance.now() - requestStartedAt)
        statusCounts[response.status] = (statusCounts[response.status] ?? 0) + 1
        requestCount += 1

        if (response.ok) {
          successCount += 1
        } else {
          errorCount += 1
        }
      } catch {
        latencies.push(performance.now() - requestStartedAt)
        requestCount += 1
        errorCount += 1
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  return summariseMetrics({
    profile,
    endpoint,
    latencies,
    errorCount,
    requestCount,
    successCount,
    statusCounts,
    startedAt,
    completedAt: performance.now(),
  })
}

function chunkArray(values, size) {
  const chunks = []

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }

  return chunks
}

async function archiveExistingPerfHandovers(adminUser) {
  const handovers = await prisma.handover.findMany({
    where: {
      deletedAt: null,
      OR: [
        { generalRemarks: { contains: PERF_TAG } },
        { nextShiftActions: { contains: PERF_TAG } },
      ],
    },
    select: {
      id: true,
      referenceId: true,
    },
  })

  if (handovers.length === 0) {
    return 0
  }

  const deletedAt = new Date()
  const ids = handovers.map((handover) => handover.id)

  await prisma.$transaction(async (tx) => {
    await tx.handover.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        deletedAt,
      },
    })

    for (const chunk of chunkArray(handovers, 500)) {
      await tx.auditLog.createMany({
        data: chunk.map((handover) => ({
          handoverId: handover.id,
          userId: adminUser.id,
          action: AuditAction.DELETED,
          targetModel: 'Handover',
          targetId: handover.id,
          newValue: {
            perfTag: PERF_TAG,
            deletedAt: deletedAt.toISOString(),
            referenceId: handover.referenceId,
          },
        })),
      })
    }
  })

  return handovers.length
}

function createWritePayloadFactory(supervisorUser) {
  const baseDate = new Date('2024-01-01T00:00:00.000Z')
  let nextSlotIndex = 0

  return () => {
    const slotDate = addUtcDays(baseDate, nextSlotIndex)
    const slotLabel = `${RUN_ID}-${nextSlotIndex}`
    nextSlotIndex += 1

    return {
      handoverDate: formatDateOnly(slotDate),
      shift: 'Night',
      overallPriority: 'Normal',
      handedToId: supervisorUser.id,
      generalRemarks: `${PERF_TAG} ${slotLabel} create handover benchmark`,
      nextShiftActions: `${PERF_TAG} ${slotLabel} cleanup after perf check`,
      categories: {},
    }
  }
}

function evaluateAgainstTargets(metrics, targets) {
  return (
    metrics.errorCount === 0 &&
    metrics.avgMs < targets.avgMs &&
    metrics.p95Ms < targets.p95Ms &&
    metrics.p99Ms < targets.p99Ms
  )
}

async function main() {
  assertRequiredConfiguration()
  await assertEnvironmentReachable()

  const [staffUser, supervisorUser, adminUser] = await Promise.all([
    requireUser('staff@occ.test', UserRole.OCC_STAFF),
    requireUser('supervisor@occ.test', UserRole.SUPERVISOR),
    requireUser('admin@occ.test', UserRole.ADMIN),
  ])

  const archivedBeforeRun = await archiveExistingPerfHandovers(adminUser)
  const createWritePayload = createWritePayloadFactory(supervisorUser)

  console.log(`[perf] Frontend OK at ${FRONTEND_URL}`)
  console.log(`[perf] Backend OK at ${BACKEND_URL}`)
  console.log(`[perf] Archived ${archivedBeforeRun} previous active perf handover(s) before this run.`)

  const stageResults = []

  console.log('[perf] Running baseline sequential checks...')
  stageResults.push(
    await runSequentialStage({
      endpoint: 'GET /api/v1/dashboard/summary',
      profile: `${BASELINE_READ_REQUESTS} sequential`,
      requestCount: BASELINE_READ_REQUESTS,
      executeRequest: () => backendRequest('/dashboard/summary', supervisorUser),
    })
  )
  stageResults.push(
    await runSequentialStage({
      endpoint: 'GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc',
      profile: `${BASELINE_READ_REQUESTS} sequential`,
      requestCount: BASELINE_READ_REQUESTS,
      executeRequest: () =>
        backendRequest(
          '/handovers?limit=20&sortBy=createdAt&sortOrder=desc',
          supervisorUser
        ),
    })
  )
  stageResults.push(
    await runSequentialStage({
      endpoint: 'POST /api/v1/handovers',
      profile: `${BASELINE_WRITE_REQUESTS} sequential`,
      requestCount: BASELINE_WRITE_REQUESTS,
      executeRequest: () =>
        backendRequest('/handovers', staffUser, {
          method: 'POST',
          body: createWritePayload(),
        }),
    })
  )

  console.log('[perf] Running sustained read load...')
  for (const stage of READ_STAGES) {
    const profile = `${stage.concurrency} concurrent x ${stage.durationSeconds}s`
    stageResults.push(
      await runTimedStage({
        endpoint: 'GET /api/v1/dashboard/summary',
        profile,
        concurrency: stage.concurrency,
        durationSeconds: stage.durationSeconds,
        executeRequest: () => backendRequest('/dashboard/summary', supervisorUser),
      })
    )
    stageResults.push(
      await runTimedStage({
        endpoint: 'GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc',
        profile,
        concurrency: stage.concurrency,
        durationSeconds: stage.durationSeconds,
        executeRequest: () =>
          backendRequest(
            '/handovers?limit=20&sortBy=createdAt&sortOrder=desc',
            supervisorUser
          ),
      })
    )
  }

  console.log('[perf] Running controlled write load...')
  for (const stage of WRITE_STAGES) {
    stageResults.push(
      await runTimedStage({
        endpoint: 'POST /api/v1/handovers',
        profile: `${stage.concurrency} concurrent x ${stage.durationSeconds}s`,
        concurrency: stage.concurrency,
        durationSeconds: stage.durationSeconds,
        executeRequest: () =>
          backendRequest('/handovers', staffUser, {
            method: 'POST',
            body: createWritePayload(),
          }),
      })
    )
  }

  const archivedAfterRun = await archiveExistingPerfHandovers(adminUser)
  await assertEnvironmentReachable()

  const summaryRows = [
    {
      endpoint: 'GET /api/v1/dashboard/summary',
      loadProfile: '20 concurrent x 30s',
      ...stageResults.find(
        (result) =>
          result.endpoint === 'GET /api/v1/dashboard/summary' &&
          result.profile === '20 concurrent x 30s'
      ),
      pass: 'PENDING',
    },
    {
      endpoint: 'GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc',
      loadProfile: '20 concurrent x 30s',
      ...stageResults.find(
        (result) =>
          result.endpoint ===
            'GET /api/v1/handovers?limit=20&sortBy=createdAt&sortOrder=desc' &&
          result.profile === '20 concurrent x 30s'
      ),
      pass: 'PENDING',
    },
    {
      endpoint: 'POST /api/v1/handovers',
      loadProfile: '5 concurrent x 20s',
      ...stageResults.find(
        (result) =>
          result.endpoint === 'POST /api/v1/handovers' &&
          result.profile === '5 concurrent x 20s'
      ),
      pass: 'PENDING',
    },
  ]

  summaryRows[0].pass = evaluateAgainstTargets(
    summaryRows[0],
    ENDPOINT_TARGETS.dashboardSummary
  )
    ? 'PASS'
    : 'FAIL'
  summaryRows[1].pass = evaluateAgainstTargets(
    summaryRows[1],
    ENDPOINT_TARGETS.handoverList
  )
    ? 'PASS'
    : 'FAIL'
  summaryRows[2].pass = evaluateAgainstTargets(
    summaryRows[2],
    ENDPOINT_TARGETS.createHandover
  )
    ? 'PASS'
    : 'FAIL'

  console.log('[perf] Stage results')
  console.table(
    stageResults.map((result) => ({
      endpoint: result.endpoint,
      profile: result.profile,
      requests: result.requestCount,
      success: result.successCount,
      errors: result.errorCount,
      rps: result.requestsPerSecond,
      avgMs: result.avgMs,
      p95Ms: result.p95Ms,
      p99Ms: result.p99Ms,
      maxMs: result.maxMs,
      statusSummary: result.statusSummary,
    }))
  )

  console.log('[perf] Summary rows')
  console.table(
    summaryRows.map((result) => ({
      endpoint: result.endpoint,
      loadProfile: result.loadProfile,
      avgMs: result.avgMs,
      p95Ms: result.p95Ms,
      p99Ms: result.p99Ms,
      errors: result.errorCount,
      pass: result.pass,
    }))
  )

  console.log(`[perf] Archived ${archivedAfterRun} active perf handover(s) after the run.`)

  const output = {
    generatedAt: new Date().toISOString(),
    frontendUrl: FRONTEND_URL,
    backendUrl: BACKEND_URL,
    archivedBeforeRun,
    archivedAfterRun,
    stageResults,
    summaryRows,
  }

  console.log('[perf] RESULT_JSON_START')
  console.log(JSON.stringify(output, null, 2))
  console.log('[perf] RESULT_JSON_END')

  const hasFailure = summaryRows.some((row) => row.pass !== 'PASS')
  process.exitCode = hasFailure ? 1 : 0
}

main()
  .catch((error) => {
    console.error('[perf] Performance check failed.')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
