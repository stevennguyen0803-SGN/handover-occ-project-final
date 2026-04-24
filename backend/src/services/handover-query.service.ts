import {
  ItemStatus,
  Priority,
  Shift,
  type Prisma,
  UserRole,
} from '@prisma/client'

import type { AuthenticatedUser } from '../middleware/auth.middleware'

export type HandoverFilters = {
  status?: string
  priority?: string
  shift?: string
  from?: string
  to?: string
  search?: string
  carriedForwardOnly?: string
  mine?: string
  overdueOnly?: string
  page?: string
  limit?: string
  sortBy?: string
  sortOrder?: string
}

const STATUS_VALUES = Object.values(ItemStatus)
const PRIORITY_VALUES = Object.values(Priority)
const SHIFT_VALUES = Object.values(Shift)
const ACTIVE_ITEM_STATUSES = [ItemStatus.Open, ItemStatus.Monitoring]

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'handoverDate',
  'overallPriority',
  'overallStatus',
  'referenceId',
  'shift',
])

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function parseEnumFilter<T extends string>(
  rawValue: string | undefined,
  allowedValues: readonly T[]
): T[] {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is T => allowedValues.includes(value as T))
}

function parseBooleanFilter(rawValue: string | undefined): boolean {
  return rawValue === 'true' || rawValue === '1'
}

export function getValidatedSortOrder(
  sortOrder: string | undefined
): Prisma.SortOrder {
  return sortOrder === 'asc' ? 'asc' : 'desc'
}

export function getValidatedSortField(sortBy: string | undefined) {
  if (!sortBy || !ALLOWED_SORT_FIELDS.has(sortBy)) {
    return null
  }

  return sortBy as keyof Prisma.HandoverOrderByWithRelationInput
}

export function buildHandoverSearchFilter(
  search: string
): Prisma.HandoverWhereInput {
  return {
    OR: [
      { referenceId: { contains: search, mode: 'insensitive' } },
      { generalRemarks: { contains: search, mode: 'insensitive' } },
      { nextShiftActions: { contains: search, mode: 'insensitive' } },
      {
        aircraftItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { registration: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        airportItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { airport: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        flightScheduleItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { flightNumber: { contains: search, mode: 'insensitive' } },
              { route: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        crewItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { crewName: { contains: search, mode: 'insensitive' } },
              { role: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        weatherItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { affectedArea: { contains: search, mode: 'insensitive' } },
              { weatherType: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        systemItems: {
          some: {
            deletedAt: null,
            OR: [
              { issue: { contains: search, mode: 'insensitive' } },
              { systemName: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
      {
        abnormalEvents: {
          some: {
            deletedAt: null,
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { eventType: { contains: search, mode: 'insensitive' } },
              { notificationRef: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
    ],
  }
}

export function buildOverdueItemsFilter(
  now = new Date()
): Prisma.HandoverWhereInput {
  const overdueCondition = {
    deletedAt: null,
    dueTime: { lt: now },
    status: { in: ACTIVE_ITEM_STATUSES },
  }

  return {
    OR: [
      { aircraftItems: { some: overdueCondition } },
      { airportItems: { some: overdueCondition } },
      { flightScheduleItems: { some: overdueCondition } },
      { crewItems: { some: overdueCondition } },
      { weatherItems: { some: overdueCondition } },
      { systemItems: { some: overdueCondition } },
      { abnormalEvents: { some: overdueCondition } },
    ],
  }
}

export function buildHandoverListWhereClause(
  user: AuthenticatedUser,
  filters: HandoverFilters,
  options?: {
    now?: Date
  }
): Prisma.HandoverWhereInput {
  const andClauses: Prisma.HandoverWhereInput[] = [{ deletedAt: null }]
  const status = parseEnumFilter(filters.status, STATUS_VALUES)
  const priority = parseEnumFilter(filters.priority, PRIORITY_VALUES)
  const search = filters.search?.trim()
  const mineOnly = parseBooleanFilter(filters.mine)
  const carriedForwardOnly = parseBooleanFilter(filters.carriedForwardOnly)
  const overdueOnly = parseBooleanFilter(filters.overdueOnly)

  if (user.role === UserRole.OCC_STAFF || mineOnly) {
    andClauses.push({ preparedById: user.id })
  }

  if (status.length > 0) {
    andClauses.push({
      overallStatus: {
        in: status,
      },
    })
  }

  if (priority.length > 0) {
    andClauses.push({
      overallPriority: {
        in: priority,
      },
    })
  }

  if (filters.shift && SHIFT_VALUES.includes(filters.shift as Shift)) {
    andClauses.push({
      shift: filters.shift as Shift,
    })
  }

  if (filters.from || filters.to) {
    andClauses.push({
      handoverDate: {
        ...(filters.from ? { gte: toDateOnly(filters.from) } : {}),
        ...(filters.to ? { lte: toDateOnly(filters.to) } : {}),
      },
    })
  }

  if (carriedForwardOnly) {
    andClauses.push({
      isCarriedForward: true,
    })
  }

  if (overdueOnly) {
    andClauses.push(buildOverdueItemsFilter(options?.now))
  }

  if (search) {
    andClauses.push(buildHandoverSearchFilter(search))
  }

  return andClauses.length > 0 ? { AND: andClauses } : {}
}

export function buildHandoverOrderByClause(
  filters: HandoverFilters
): Prisma.HandoverOrderByWithRelationInput[] {
  const sortField = getValidatedSortField(filters.sortBy)
  const sortOrder = getValidatedSortOrder(filters.sortOrder)

  if (!sortField) {
    return [
      { overallPriority: 'desc' },
      { createdAt: 'desc' },
    ]
  }

  return [
    { [sortField]: sortOrder },
    { createdAt: 'desc' },
  ] as Prisma.HandoverOrderByWithRelationInput[]
}
