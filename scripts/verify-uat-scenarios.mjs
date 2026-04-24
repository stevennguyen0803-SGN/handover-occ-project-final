import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UAT_TAG = '[UAT-SEED]'
const REQUIRED_USERS = [
  ['staff@occ.test', 'OCC_STAFF'],
  ['supervisor@occ.test', 'SUPERVISOR'],
  ['viewer@occ.test', 'MANAGEMENT_VIEWER'],
  ['admin@occ.test', 'ADMIN'],
]

const HANDOVER_INCLUDE = {
  aircraftItems: true,
  airportItems: true,
  flightScheduleItems: true,
  crewItems: true,
  weatherItems: true,
  systemItems: true,
  abnormalEvents: true,
  auditLogs: true,
}

function fail(message, details) {
  const error = new Error(message)
  if (details !== undefined) {
    error.details = details
  }
  throw error
}

function toDateOnly(value) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  )
}

function addUtcDays(dateOnly, days) {
  const next = new Date(dateOnly)
  next.setUTCDate(next.getUTCDate() + days)

  return toDateOnly(next)
}

function formatDateOnly(value) {
  return value.toISOString().slice(0, 10)
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label} mismatch`, { expected, actual })
  }
}

function expectTruthy(value, label) {
  if (!value) {
    fail(`${label} is missing or false`)
  }
}

function expectLength(items, expected, label) {
  if (items.length !== expected) {
    fail(`${label} length mismatch`, { expected, actual: items.length })
  }
}

async function verifyUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: REQUIRED_USERS.map(([email]) => email),
      },
    },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  })

  const userByEmail = new Map(users.map((user) => [user.email, user]))

  for (const [email, role] of REQUIRED_USERS) {
    const user = userByEmail.get(email)
    expectTruthy(user, `UAT user ${email}`)
    expectEqual(user.role, role, `UAT user ${email} role`)
    expectEqual(user.isActive, true, `UAT user ${email} active flag`)
    expectTruthy(user.passwordHash, `UAT user ${email} password hash`)
  }
}

async function verifyReferenceSequence() {
  const [maxReference] = await prisma.$queryRaw`
    SELECT COALESCE(MAX(CAST(RIGHT("referenceId", 6) AS BIGINT)), 0) AS "maxSuffix"
    FROM "Handover"
  `
  const [sequenceState] = await prisma.$queryRaw`
    SELECT last_value AS "lastValue", is_called AS "isCalled"
    FROM handover_reference_seq
  `

  const maxSuffix = BigInt(maxReference?.maxSuffix ?? 0)
  const lastValue = BigInt(sequenceState?.lastValue ?? 0)
  const isCalled = Boolean(sequenceState?.isCalled)
  const nextSequenceValue = isCalled ? lastValue + 1n : lastValue

  if (nextSequenceValue <= maxSuffix) {
    fail('handover_reference_seq is behind existing Handover.referenceId values', {
      maxSuffix: maxSuffix.toString(),
      lastValue: lastValue.toString(),
      isCalled,
      nextSequenceValue: nextSequenceValue.toString(),
    })
  }

  return {
    maxSuffix: maxSuffix.toString(),
    nextSequenceValue: nextSequenceValue.toString(),
  }
}

async function getScenario(scenarioLabel) {
  const handover = await prisma.handover.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { generalRemarks: { contains: `${UAT_TAG}[${scenarioLabel}]` } },
        { nextShiftActions: { contains: `${UAT_TAG}[${scenarioLabel}]` } },
      ],
    },
    include: HANDOVER_INCLUDE,
  })

  expectTruthy(handover, `${scenarioLabel} active handover`)

  return handover
}

async function verifyScenarioCount() {
  const count = await prisma.handover.count({
    where: {
      deletedAt: null,
      OR: [
        { generalRemarks: { contains: UAT_TAG } },
        { nextShiftActions: { contains: UAT_TAG } },
      ],
    },
  })

  expectEqual(count, 5, 'active UAT handover count')
}

async function verifyScenario1(today) {
  const handover = await getScenario('SCENARIO 1')

  expectEqual(formatDateOnly(handover.handoverDate), formatDateOnly(today), 'Scenario 1 date')
  expectEqual(handover.shift, 'Morning', 'Scenario 1 shift')
  expectEqual(handover.overallPriority, 'Critical', 'Scenario 1 priority')
  expectEqual(handover.overallStatus, 'Open', 'Scenario 1 status')
  expectLength(handover.aircraftItems, 1, 'Scenario 1 aircraft items')
  expectLength(handover.abnormalEvents, 1, 'Scenario 1 abnormal events')
  expectEqual(handover.aircraftItems[0].registration, '9M-MXA', 'Scenario 1 aircraft registration')
  expectEqual(handover.aircraftItems[0].priority, 'Critical', 'Scenario 1 aircraft priority')
  expectTruthy(handover.aircraftItems[0].ownerId, 'Scenario 1 aircraft owner')
  expectEqual(handover.abnormalEvents[0].eventType, 'AOG', 'Scenario 1 abnormal event type')

  const todayAfternoon = await prisma.handover.findFirst({
    where: {
      deletedAt: null,
      handoverDate: today,
      shift: 'Afternoon',
    },
    select: { referenceId: true },
  })

  if (todayAfternoon) {
    fail('Scenario 1 requires today Afternoon to remain available for live carry-forward creation', {
      referenceId: todayAfternoon.referenceId,
    })
  }

  return handover.referenceId
}

async function verifyScenario2(yesterday) {
  const handover = await getScenario('SCENARIO 2')

  expectEqual(formatDateOnly(handover.handoverDate), formatDateOnly(yesterday), 'Scenario 2 date')
  expectEqual(handover.shift, 'Night', 'Scenario 2 shift')
  expectEqual(handover.overallPriority, 'High', 'Scenario 2 priority')
  expectEqual(handover.isCarriedForward, true, 'Scenario 2 carried-forward flag')
  expectLength(handover.weatherItems, 1, 'Scenario 2 weather items')
  expectLength(handover.flightScheduleItems, 1, 'Scenario 2 flight schedule items')
  expectEqual(handover.weatherItems[0].affectedArea, 'WMKK', 'Scenario 2 weather area')
  expectEqual(
    handover.flightScheduleItems[0].flightNumber,
    'AXA100-AXA120',
    'Scenario 2 flight range'
  )

  const carryForwardLogs = handover.auditLogs.filter(
    (auditLog) => auditLog.action === 'CARRIED_FORWARD'
  )
  expectLength(carryForwardLogs, 2, 'Scenario 2 carry-forward audit logs')

  return handover.referenceId
}

async function verifyScenario3(yesterday) {
  const handover = await getScenario('SCENARIO 3')

  expectEqual(formatDateOnly(handover.handoverDate), formatDateOnly(yesterday), 'Scenario 3 date')
  expectEqual(handover.shift, 'Afternoon', 'Scenario 3 shift')
  expectEqual(handover.overallPriority, 'Critical', 'Scenario 3 priority')
  expectLength(handover.crewItems, 2, 'Scenario 3 crew items')

  const captainIssue = handover.crewItems.find((item) => item.crewName === 'Captain Iskandar')
  expectTruthy(captainIssue, 'Scenario 3 Captain Iskandar item')
  expectEqual(captainIssue.priority, 'Critical', 'Scenario 3 captain priority')
  expectTruthy(captainIssue.ownerId, 'Scenario 3 captain owner')

  return handover.referenceId
}

async function verifyScenario4(yesterday) {
  const handover = await getScenario('SCENARIO 4')

  expectEqual(formatDateOnly(handover.handoverDate), formatDateOnly(yesterday), 'Scenario 4 date')
  expectEqual(handover.shift, 'Morning', 'Scenario 4 shift')
  expectEqual(handover.overallStatus, 'Resolved', 'Scenario 4 status')
  expectLength(handover.systemItems, 1, 'Scenario 4 system items')
  expectEqual(handover.systemItems[0].systemName, 'ACARS', 'Scenario 4 system name')
  expectEqual(handover.systemItems[0].status, 'Resolved', 'Scenario 4 system status')
  expectTruthy(handover.systemItems[0].resolvedAt, 'Scenario 4 resolved timestamp')

  return handover.referenceId
}

async function verifyScenario5(twoDaysAgo) {
  const handover = await getScenario('SCENARIO 5')

  expectEqual(formatDateOnly(handover.handoverDate), formatDateOnly(twoDaysAgo), 'Scenario 5 date')
  expectEqual(handover.shift, 'Night', 'Scenario 5 shift')
  expectEqual(handover.overallPriority, 'Low', 'Scenario 5 priority')
  expectEqual(handover.isCarriedForward, false, 'Scenario 5 carried-forward flag')
  expectLength(handover.airportItems, 1, 'Scenario 5 airport items')
  expectLength(handover.weatherItems, 1, 'Scenario 5 weather items')
  expectLength(handover.systemItems, 1, 'Scenario 5 system items')
  expectEqual(handover.airportItems[0].airport, 'WSSS', 'Scenario 5 airport')
  expectEqual(handover.systemItems[0].systemName, 'Crew Portal', 'Scenario 5 system name')

  const priorities = [
    ...handover.airportItems,
    ...handover.weatherItems,
    ...handover.systemItems,
  ].map((item) => item.priority)

  if (priorities.some((priority) => priority !== 'Low')) {
    fail('Scenario 5 should contain only Low-priority items', { priorities })
  }

  return handover.referenceId
}

async function main() {
  const today = toDateOnly(new Date())
  const yesterday = addUtcDays(today, -1)
  const twoDaysAgo = addUtcDays(today, -2)

  await verifyUsers()
  await verifyScenarioCount()
  const sequence = await verifyReferenceSequence()

  const scenarioRefs = await Promise.all([
    verifyScenario1(today),
    verifyScenario2(yesterday),
    verifyScenario3(yesterday),
    verifyScenario4(yesterday),
    verifyScenario5(twoDaysAgo),
  ])

  console.log('[uat-verify] UAT seed verification passed.')
  console.table([
    {
      check: 'handover_reference_seq',
      maxReferenceSuffix: sequence.maxSuffix,
      nextSequenceValue: sequence.nextSequenceValue,
    },
  ])
  console.table(
    scenarioRefs.map((referenceId, index) => ({
      scenario: `Scenario ${index + 1}`,
      referenceId,
    }))
  )
}

main()
  .catch((error) => {
    console.error('[uat-verify] Verification failed.')
    console.error(error)
    if (error.details !== undefined) {
      console.error(error.details)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

