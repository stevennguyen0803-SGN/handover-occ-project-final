import {
  AuditAction,
  ItemStatus,
  Prisma,
  Priority,
  Shift,
  UserRole,
} from '@prisma/client'

import { prisma } from '../lib/prisma'
import { ServiceError } from '../lib/service-error'
import type { AuthenticatedUser } from '../middleware/auth.middleware'
import type {
  CreateHandoverInput,
  HandoverCategoriesInput,
  UpdateHandoverInput,
} from '../schemas/handover.schema'
import { buildChangedFields, writeAuditLog } from './audit.service'
import { carryForwardOpenItems, getPreviousShift } from './carryForward.service'
import {
  buildHandoverListWhereClause,
  buildHandoverOrderByClause,
  type HandoverFilters as HandoverQueryFilters,
} from './handover-query.service'

type DbClient = Prisma.TransactionClient | typeof prisma

type HandoverFilters = HandoverQueryFilters

const HANDOVER_RELATION_SELECT = {
  preparedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  handedTo: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.HandoverInclude

const HANDOVER_LIST_INCLUDE = {
  ...HANDOVER_RELATION_SELECT,
  aircraftItems: {
    select: {
      status: true,
    },
  },
  airportItems: {
    select: {
      status: true,
    },
  },
  flightScheduleItems: {
    select: {
      status: true,
    },
  },
  crewItems: {
    select: {
      status: true,
    },
  },
  weatherItems: {
    select: {
      status: true,
    },
  },
  systemItems: {
    select: {
      status: true,
    },
  },
  abnormalEvents: {
    select: {
      status: true,
    },
  },
} satisfies Prisma.HandoverInclude

const HANDOVER_DETAIL_INCLUDE = {
  ...HANDOVER_RELATION_SELECT,
  aircraftItems: true,
  airportItems: true,
  flightScheduleItems: true,
  crewItems: true,
  weatherItems: true,
  systemItems: true,
  abnormalEvents: true,
  auditLogs: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  acknowledgments: {
    orderBy: {
      acknowledgedAt: 'asc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.HandoverInclude

const CATEGORY_RELATION_MAP = {
  aircraft: 'aircraftItems',
  airport: 'airportItems',
  flightSchedule: 'flightScheduleItems',
  crew: 'crewItems',
  weather: 'weatherItems',
  system: 'systemItems',
  abnormalEvents: 'abnormalEvents',
} as const

const ITEM_COUNT_TABLES = [
  'AircraftItem',
  'AirportItem',
  'FlightScheduleItem',
  'CrewItem',
  'WeatherItem',
  'SystemItem',
  'AbnormalEvent',
] as const

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function normalizeDateTime(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return parsedValue
}

function toCount(value: number | bigint | null | undefined) {
  return Number(value ?? 0)
}

function parseBooleanFilter(rawValue: string | undefined): boolean {
  return rawValue === 'true' || rawValue === '1'
}

function coerceDateTimeField(value: string | undefined) {
  return value ? new Date(value) : undefined
}

function mapCategoriesForCreate(categories: HandoverCategoriesInput) {
  const mappedData: Record<string, unknown> = {}

  for (const [categoryKey, relationKey] of Object.entries(CATEGORY_RELATION_MAP)) {
    const items = categories[categoryKey as keyof HandoverCategoriesInput]

    if (!items || items.length === 0) {
      continue
    }

    mappedData[relationKey] = {
      create: items.map((item) => ({
        ...item,
        dueTime: coerceDateTimeField(item.dueTime),
      })),
    }
  }

  return mappedData
}

function getItemCounts(handover: {
  aircraftItems: Array<{ status: ItemStatus }>
  airportItems: Array<{ status: ItemStatus }>
  flightScheduleItems: Array<{ status: ItemStatus }>
  crewItems: Array<{ status: ItemStatus }>
  weatherItems: Array<{ status: ItemStatus }>
  systemItems: Array<{ status: ItemStatus }>
  abnormalEvents: Array<{ status: ItemStatus }>
}) {
  const counts = {
    open: 0,
    monitoring: 0,
    resolved: 0,
  }

  const items = [
    ...handover.aircraftItems,
    ...handover.airportItems,
    ...handover.flightScheduleItems,
    ...handover.crewItems,
    ...handover.weatherItems,
    ...handover.systemItems,
    ...handover.abnormalEvents,
  ]

  items.forEach((item) => {
    if (item.status === ItemStatus.Open) {
      counts.open += 1
    }

    if (item.status === ItemStatus.Monitoring) {
      counts.monitoring += 1
    }

    if (item.status === ItemStatus.Resolved) {
      counts.resolved += 1
    }
  })

  return counts
}

type FastHandoverListRow = {
  id: string
  referenceId: string
  handoverDate: string
  shift: Shift | string
  overallPriority: Priority | string
  overallStatus: ItemStatus | string
  isCarriedForward: boolean
  createdAtEpoch: number | string
  acknowledgedAtEpoch: number | string | null
  preparedById: string
  preparedByName: string
  handedToId: string | null
  handedToName: string | null
  openItems: number | bigint
  monitoringItems: number | bigint
  resolvedItems: number | bigint
  totalCount: number | bigint
}

function sqlItemStatus(status: ItemStatus) {
  return Prisma.sql`CAST(${status} AS "ItemStatus")`
}

function epochToIsoString(value: number | string) {
  return new Date(Number(value) * 1000).toISOString()
}

function nullableEpochToIsoString(value: number | string | null) {
  return value == null ? null : epochToIsoString(value)
}

function hasOnlyFastListFilters(filters: HandoverFilters) {
  const unsupportedFilters = [
    filters.status,
    filters.priority,
    filters.shift,
    filters.from,
    filters.to,
    filters.search,
    filters.carriedForwardOnly,
    filters.overdueOnly,
  ]

  if (unsupportedFilters.some((value) => value !== undefined && value !== '')) {
    return false
  }

  if (filters.sortBy !== 'createdAt') {
    return false
  }

  return !filters.sortOrder || filters.sortOrder === 'desc'
}

function buildFastListItemUnionSql() {
  return Prisma.join(
    ITEM_COUNT_TABLES.map((tableName) => {
      const table = Prisma.raw(`"${tableName}"`)

      return Prisma.sql`
        SELECT item."handoverId", item.status
        FROM ${table} item
        WHERE item."deletedAt" IS NULL
          AND item."handoverId" IN (SELECT id FROM filtered)
      `
    }),
    ' UNION ALL '
  )
}

async function listHandoversFastPath(
  user: AuthenticatedUser,
  page: number,
  limit: number,
  filters: HandoverFilters
) {
  const offset = (page - 1) * limit
  const shouldScopeToUser =
    user.role === UserRole.OCC_STAFF || parseBooleanFilter(filters.mine)
  const userScope = shouldScopeToUser
    ? Prisma.sql` AND h."preparedById" = ${user.id}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<FastHandoverListRow[]>(Prisma.sql`
    WITH filtered AS (
      SELECT
        h.id,
        h."referenceId",
        h."handoverDate"::text AS "handoverDate",
        h.shift::text AS shift,
        h."overallPriority"::text AS "overallPriority",
        h."overallStatus"::text AS "overallStatus",
        h."isCarriedForward",
        EXTRACT(EPOCH FROM h."createdAt")::double precision AS "createdAtEpoch",
        EXTRACT(EPOCH FROM h."acknowledgedAt")::double precision AS "acknowledgedAtEpoch",
        h."preparedById",
        h."handedToId"
      FROM "Handover" h
      WHERE h."deletedAt" IS NULL
        ${userScope}
      ORDER BY h."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    ),
    total AS (
      SELECT COUNT(*)::int AS count
      FROM "Handover" h
      WHERE h."deletedAt" IS NULL
        ${userScope}
    ),
    item_counts AS (
      SELECT
        items."handoverId",
        COUNT(*) FILTER (WHERE items.status = ${sqlItemStatus(ItemStatus.Open)})::int AS "openItems",
        COUNT(*) FILTER (WHERE items.status = ${sqlItemStatus(ItemStatus.Monitoring)})::int AS "monitoringItems",
        COUNT(*) FILTER (WHERE items.status = ${sqlItemStatus(ItemStatus.Resolved)})::int AS "resolvedItems"
      FROM (${buildFastListItemUnionSql()}) items
      GROUP BY items."handoverId"
    )
    SELECT
      filtered.id,
      filtered."referenceId",
      filtered."handoverDate",
      filtered.shift,
      filtered."overallPriority",
      filtered."overallStatus",
      filtered."isCarriedForward",
      filtered."createdAtEpoch",
      filtered."acknowledgedAtEpoch",
      prepared_by.id AS "preparedById",
      prepared_by.name AS "preparedByName",
      handed_to.id AS "handedToId",
      handed_to.name AS "handedToName",
      COALESCE(item_counts."openItems", 0)::int AS "openItems",
      COALESCE(item_counts."monitoringItems", 0)::int AS "monitoringItems",
      COALESCE(item_counts."resolvedItems", 0)::int AS "resolvedItems",
      total.count AS "totalCount"
    FROM filtered
    INNER JOIN "User" prepared_by ON prepared_by.id = filtered."preparedById"
    LEFT JOIN "User" handed_to ON handed_to.id = filtered."handedToId"
    LEFT JOIN item_counts ON item_counts."handoverId" = filtered.id
    CROSS JOIN total
    ORDER BY filtered."createdAtEpoch" DESC
  `)

  const total =
    rows.length > 0
      ? toCount(rows[0]?.totalCount)
      : await prisma.handover.count({
          where: {
            deletedAt: null,
            ...(shouldScopeToUser ? { preparedById: user.id } : {}),
          },
        })

  return {
    data: rows.map((row) => ({
      id: row.id,
      referenceId: row.referenceId,
      handoverDate: row.handoverDate,
      shift: row.shift,
      preparedBy: {
        id: row.preparedById,
        name: row.preparedByName,
      },
      handedTo: row.handedToId
        ? {
            id: row.handedToId,
            name: row.handedToName ?? '',
          }
        : null,
      overallPriority: row.overallPriority,
      overallStatus: row.overallStatus,
      isCarriedForward: row.isCarriedForward,
      itemCounts: {
        open: toCount(row.openItems),
        monitoring: toCount(row.monitoringItems),
        resolved: toCount(row.resolvedItems),
      },
      createdAt: epochToIsoString(row.createdAtEpoch),
      acknowledgedAt: nullableEpochToIsoString(row.acknowledgedAtEpoch),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

function serializeCategoryItems<T extends Record<string, unknown>>(
  items: Array<T & { dueTime?: Date | null; resolvedAt?: Date | null; deletedAt?: Date | null; createdAt: Date; updatedAt: Date }>
) {
  return items.map((item) => ({
    ...item,
    dueTime: normalizeDateTime(item.dueTime),
    resolvedAt: normalizeDateTime(item.resolvedAt),
    deletedAt: normalizeDateTime(item.deletedAt),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }))
}

async function ensureActiveUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
    },
  })

  if (!user) {
    throw new ServiceError(400, 'VALIDATION_FAILED', 'User must be active', {
      userId,
    })
  }

  return user
}

async function ensureActiveUsers(userIds: Array<string | undefined>) {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter((userId): userId is string => Boolean(userId)))
  )

  if (uniqueUserIds.length === 0) {
    return
  }

  const activeUsers = await prisma.user.findMany({
    where: {
      id: { in: uniqueUserIds },
      isActive: true,
    },
    select: {
      id: true,
    },
  })
  const activeUserIds = new Set(activeUsers.map((user) => user.id))
  const inactiveUserId = uniqueUserIds.find((userId) => !activeUserIds.has(userId))

  if (inactiveUserId) {
    throw new ServiceError(400, 'VALIDATION_FAILED', 'User must be active', {
      userId: inactiveUserId,
    })
  }
}

async function generateReferenceId(db: Pick<DbClient, '$queryRawUnsafe'>) {
  const result = await db.$queryRawUnsafe<Array<{ value: bigint | number }>>(
    "SELECT nextval('handover_reference_seq') AS value"
  )
  const sequenceValue = result[0]?.value

  if (sequenceValue == null) {
    throw new ServiceError(500, 'REFERENCE_ID_SEQUENCE_FAILED', 'Failed to generate referenceId')
  }

  const year = new Date().getUTCFullYear()

  return `HDO-${year}-${sequenceValue.toString().padStart(6, '0')}`
}

async function findPreviousShiftHandoverId(handoverDate: Date, shift: Shift) {
  const previous = getPreviousShift(handoverDate, shift)
  const previousDateOnly = new Date(
    Date.UTC(
      previous.date.getUTCFullYear(),
      previous.date.getUTCMonth(),
      previous.date.getUTCDate()
    )
  )

  return prisma.handover.findFirst({
    where: {
      handoverDate: previousDateOnly,
      shift: previous.shift,
    },
    select: {
      id: true,
    },
  })
}

async function getHandoverForAccessCheck(id: string) {
  const handover = await prisma.handover.findFirst({
    where: {
      id,
    },
    select: {
      id: true,
      preparedById: true,
    },
  })

  if (!handover) {
    throw new ServiceError(404, 'NOT_FOUND', 'Handover not found')
  }

  return handover
}

function assertCanAccessHandover(user: AuthenticatedUser, preparedById: string) {
  if (user.role === UserRole.OCC_STAFF && preparedById !== user.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'You do not have access to this handover')
  }
}

async function serializeHandoverDetail(handoverId: string) {
  const handover = await prisma.handover.findFirst({
    where: {
      id: handoverId,
    },
    include: HANDOVER_DETAIL_INCLUDE,
  })

  if (!handover) {
    throw new ServiceError(404, 'NOT_FOUND', 'Handover not found')
  }

  return {
    id: handover.id,
    referenceId: handover.referenceId,
    handoverDate: formatDateOnly(handover.handoverDate),
    shift: handover.shift,
    preparedBy: handover.preparedBy,
    handedTo: handover.handedTo,
    overallPriority: handover.overallPriority,
    overallStatus: handover.overallStatus,
    generalRemarks: handover.generalRemarks,
    nextShiftActions: handover.nextShiftActions,
    isCarriedForward: handover.isCarriedForward,
    carriedFromId: handover.carriedFromId,
    submittedAt: normalizeDateTime(handover.submittedAt),
    acknowledgedAt: normalizeDateTime(handover.acknowledgedAt),
    categories: {
      aircraft: serializeCategoryItems(handover.aircraftItems),
      airport: serializeCategoryItems(handover.airportItems),
      flightSchedule: serializeCategoryItems(handover.flightScheduleItems),
      crew: serializeCategoryItems(handover.crewItems),
      weather: serializeCategoryItems(handover.weatherItems),
      system: serializeCategoryItems(handover.systemItems),
      abnormalEvents: serializeCategoryItems(handover.abnormalEvents),
    },
    auditLog: handover.auditLogs.map((auditLog) => ({
      id: auditLog.id,
      action: auditLog.action,
      targetModel: auditLog.targetModel,
      targetId: auditLog.targetId,
      user: auditLog.user,
      oldValue: auditLog.oldValue,
      newValue: auditLog.newValue,
      createdAt: auditLog.createdAt.toISOString(),
    })),
    acknowledgments: handover.acknowledgments.map((acknowledgment) => ({
      id: acknowledgment.id,
      user: acknowledgment.user,
      notes: acknowledgment.notes,
      acknowledgedAt: acknowledgment.acknowledgedAt.toISOString(),
    })),
  }
}

async function assertNoDuplicateShiftHandover(
  handoverDate: string,
  shift: Shift,
  excludeId?: string
) {
  const existingHandover = await prisma.handover.findFirst({
    where: {
      handoverDate: toDateOnly(handoverDate),
      shift,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
    },
  })

  if (existingHandover) {
    throw new ServiceError(
      409,
      'DUPLICATE_SHIFT_HANDOVER',
      'An active handover already exists for the selected date and shift'
    )
  }
}

export async function createHandover(
  input: CreateHandoverInput,
  user: AuthenticatedUser
) {
  const handoverDate = toDateOnly(input.handoverDate)
  const shift = input.shift as Shift

  const [previousHandover] = await Promise.all([
    findPreviousShiftHandoverId(handoverDate, shift),
    ensureActiveUsers([user.id, input.handedToId]),
    assertNoDuplicateShiftHandover(input.handoverDate, shift),
  ])

  const result = await prisma.$transaction(async (tx) => {
    const referenceId = await generateReferenceId(tx)
    const createdHandover = await tx.handover.create({
      data: {
        referenceId,
        handoverDate,
        shift,
        preparedById: user.id,
        overallPriority: input.overallPriority as Priority,
        ...(input.handedToId ? { handedToId: input.handedToId } : {}),
        ...(input.generalRemarks !== undefined
          ? { generalRemarks: input.generalRemarks }
          : {}),
        ...(input.nextShiftActions !== undefined
          ? { nextShiftActions: input.nextShiftActions }
          : {}),
        ...mapCategoriesForCreate(input.categories),
      },
    })

    await writeAuditLog({
      db: tx,
      handoverId: createdHandover.id,
      userId: user.id,
      action: AuditAction.CREATED,
      targetModel: 'Handover',
      targetId: createdHandover.id,
      newValue: {
        referenceId: createdHandover.referenceId,
        handoverDate: formatDateOnly(createdHandover.handoverDate),
        shift: createdHandover.shift,
        overallPriority: createdHandover.overallPriority,
      },
    })

    return {
      id: createdHandover.id,
      referenceId: createdHandover.referenceId,
      createdAt: createdHandover.createdAt.toISOString(),
    }
  })

  // Auto carry-forward: copy open/monitoring items from the previous shift.
  // Runs outside the creation transaction so it cannot block handover creation.
  try {
    const cfResult = previousHandover
      ? await carryForwardOpenItems(previousHandover.id, result.id, user.id)
      : null

    if (cfResult) {
      return {
        ...result,
        carryForward: cfResult,
      }
    }
  } catch (error) {
    // Log but do not fail the handover creation
    console.error('[carry-forward] Auto carry-forward failed:', error)
  }

  return result
}

export async function listHandovers(user: AuthenticatedUser, filters: HandoverFilters) {
  const page = parsePositiveInt(filters.page, 1)
  const limit = Math.min(parsePositiveInt(filters.limit, 20), 100)

  if (hasOnlyFastListFilters(filters)) {
    return listHandoversFastPath(user, page, limit, filters)
  }

  const where = buildHandoverListWhereClause(user, filters)
  const orderBy = buildHandoverOrderByClause(filters)

  const [handovers, total] = await prisma.$transaction([
    prisma.handover.findMany({
      where,
      include: HANDOVER_LIST_INCLUDE,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.handover.count({
      where,
    }),
  ])

  return {
    data: handovers.map((handover) => ({
      id: handover.id,
      referenceId: handover.referenceId,
      handoverDate: formatDateOnly(handover.handoverDate),
      shift: handover.shift,
      preparedBy: handover.preparedBy,
      handedTo: handover.handedTo,
      overallPriority: handover.overallPriority,
      overallStatus: handover.overallStatus,
      isCarriedForward: handover.isCarriedForward,
      itemCounts: getItemCounts(handover),
      createdAt: handover.createdAt.toISOString(),
      acknowledgedAt: normalizeDateTime(handover.acknowledgedAt),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

export async function getHandoverDetail(id: string, user: AuthenticatedUser) {
  const handover = await getHandoverForAccessCheck(id)

  assertCanAccessHandover(user, handover.preparedById)

  return serializeHandoverDetail(id)
}

export async function updateHandover(
  id: string,
  input: UpdateHandoverInput,
  user: AuthenticatedUser
) {
  const existingHandover = await prisma.handover.findFirst({
    where: {
      id,
    },
    include: {
      preparedBy: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!existingHandover) {
    throw new ServiceError(404, 'NOT_FOUND', 'Handover not found')
  }

  assertCanAccessHandover(user, existingHandover.preparedById)

  const nextHandoverDate = input.handoverDate ?? formatDateOnly(existingHandover.handoverDate)
  const nextShift = (input.shift ?? existingHandover.shift) as Shift

  if (input.handoverDate || input.shift) {
    await assertNoDuplicateShiftHandover(nextHandoverDate, nextShift, existingHandover.id)
  }

  if (input.handedToId) {
    await ensureActiveUser(input.handedToId)
  }

  const previousSnapshot = {
    handoverDate: formatDateOnly(existingHandover.handoverDate),
    shift: existingHandover.shift,
    handedToId: existingHandover.handedToId,
    overallPriority: existingHandover.overallPriority,
    overallStatus: existingHandover.overallStatus,
    generalRemarks: existingHandover.generalRemarks,
    nextShiftActions: existingHandover.nextShiftActions,
  }

  const nextSnapshot = {
    handoverDate: nextHandoverDate,
    shift: nextShift,
    handedToId:
      input.handedToId !== undefined ? input.handedToId : existingHandover.handedToId,
    overallPriority:
      input.overallPriority !== undefined
        ? input.overallPriority
        : existingHandover.overallPriority,
    overallStatus:
      input.overallStatus !== undefined
        ? input.overallStatus
        : existingHandover.overallStatus,
    generalRemarks:
      input.generalRemarks !== undefined
        ? input.generalRemarks
        : existingHandover.generalRemarks,
    nextShiftActions:
      input.nextShiftActions !== undefined
        ? input.nextShiftActions
        : existingHandover.nextShiftActions,
  }

  const changes = buildChangedFields(previousSnapshot, nextSnapshot)

  await prisma.$transaction(async (tx) => {
    await tx.handover.update({
      where: {
        id,
      },
      data: {
        ...(input.handoverDate ? { handoverDate: toDateOnly(input.handoverDate) } : {}),
        ...(input.shift ? { shift: input.shift as Shift } : {}),
        ...(input.handedToId !== undefined ? { handedToId: input.handedToId } : {}),
        ...(input.overallPriority
          ? { overallPriority: input.overallPriority as Priority }
          : {}),
        ...(input.overallStatus
          ? { overallStatus: input.overallStatus as ItemStatus }
          : {}),
        ...(input.generalRemarks !== undefined
          ? { generalRemarks: input.generalRemarks }
          : {}),
        ...(input.nextShiftActions !== undefined
          ? { nextShiftActions: input.nextShiftActions }
          : {}),
      },
    })

    if (changes.oldValue || changes.newValue) {
      await writeAuditLog({
        db: tx,
        handoverId: id,
        userId: user.id,
        action: AuditAction.UPDATED,
        targetModel: 'Handover',
        targetId: id,
        oldValue: changes.oldValue,
        newValue: changes.newValue,
      })
    }
  })

  return getHandoverDetail(id, user)
}
