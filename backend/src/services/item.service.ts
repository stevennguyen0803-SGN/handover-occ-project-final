import { AuditAction, ItemStatus, UserRole } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { ServiceError } from '../lib/service-error'
import type { AuthenticatedUser } from '../middleware/auth.middleware'
import {
  CategoryItemSchemas,
  CategoryItemUpdateSchemas,
} from '../schemas/item.schema'
import { ItemStatusTransitionSchema } from '../schemas/item-status-transition.schema'
import { getDueTimeWindowErrors } from '../schemas/shared.schema'
import { buildChangedFields, writeAuditLog } from './audit.service'

type ItemModelDelegate = {
  findFirst(args: Record<string, unknown>): Promise<unknown>
  create(args: Record<string, unknown>): Promise<unknown>
  update(args: Record<string, unknown>): Promise<unknown>
}

type ItemDbClient = {
  aircraftItem: ItemModelDelegate
  airportItem: ItemModelDelegate
  flightScheduleItem: ItemModelDelegate
  crewItem: ItemModelDelegate
  weatherItem: ItemModelDelegate
  systemItem: ItemModelDelegate
  abnormalEvent: ItemModelDelegate
}

const ITEM_CATEGORY_CONFIG = {
  aircraft: {
    schemaKey: 'aircraft',
    modelName: 'AircraftItem',
  },
  airport: {
    schemaKey: 'airport',
    modelName: 'AirportItem',
  },
  'flight-schedule': {
    schemaKey: 'flightSchedule',
    modelName: 'FlightScheduleItem',
  },
  crew: {
    schemaKey: 'crew',
    modelName: 'CrewItem',
  },
  weather: {
    schemaKey: 'weather',
    modelName: 'WeatherItem',
  },
  system: {
    schemaKey: 'system',
    modelName: 'SystemItem',
  },
  'abnormal-events': {
    schemaKey: 'abnormalEvents',
    modelName: 'AbnormalEvent',
  },
} as const

export type ItemCategoryPath = keyof typeof ITEM_CATEGORY_CONFIG

type ItemRecord = {
  id: string
  handoverId: string
  status: ItemStatus
  priority: string
  ownerId: string | null
  dueTime: Date | null
  remarks: string | null
  resolvedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
} & Record<string, unknown>

type HandoverAccessRecord = {
  id: string
  preparedById: string
  handoverDate: Date
}

function getCategoryConfig(category: ItemCategoryPath) {
  return ITEM_CATEGORY_CONFIG[category]
}

function getItemDelegate(db: unknown, category: ItemCategoryPath) {
  const client = db as ItemDbClient

  switch (category) {
    case 'aircraft':
      return client.aircraftItem
    case 'airport':
      return client.airportItem
    case 'flight-schedule':
      return client.flightScheduleItem
    case 'crew':
      return client.crewItem
    case 'weather':
      return client.weatherItem
    case 'system':
      return client.systemItem
    case 'abnormal-events':
      return client.abnormalEvent
  }
}

function normalizeNullablePatch(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === null ? undefined : value])
  )
}

function normalizeItemDataForPersistence(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === 'dueTime') {
          return [key, value ? new Date(value as string) : null]
        }

        return [key, value]
      })
  )
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function normalizeDateTime(value: Date | null | undefined) {
  return value ? value.toISOString() : null
}

function buildValidationFailure(details: Record<string, string[]>) {
  throw new ServiceError(400, 'VALIDATION_FAILED', 'Validation failed', {
    fieldErrors: details,
    formErrors: [],
  })
}

function assertDueTimeWindow(dueTime: string | undefined, handoverDate: Date) {
  const errors = getDueTimeWindowErrors(dueTime, formatDateOnly(handoverDate))

  if (errors.length > 0) {
    buildValidationFailure({
      dueTime: errors,
    })
  }
}

async function getAccessibleHandover(
  handoverId: string,
  user: AuthenticatedUser
): Promise<HandoverAccessRecord> {
  const handover = await prisma.handover.findFirst({
    where: {
      id: handoverId,
    },
    select: {
      id: true,
      preparedById: true,
      handoverDate: true,
    },
  })

  if (!handover) {
    throw new ServiceError(404, 'NOT_FOUND', 'Handover not found')
  }

  if (user.role === UserRole.OCC_STAFF && handover.preparedById !== user.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'You do not have access to this handover')
  }

  return handover
}

async function ensureItemExists(
  category: ItemCategoryPath,
  handoverId: string,
  itemId: string
) {
  const item = (await getItemDelegate(prisma, category).findFirst({
    where: {
      id: itemId,
      handoverId,
    },
  })) as ItemRecord | null

  if (!item) {
    throw new ServiceError(404, 'NOT_FOUND', 'Item not found')
  }

  return item
}

function buildCreateValidationSchema(category: ItemCategoryPath) {
  const schemaKey = getCategoryConfig(category).schemaKey

  return CategoryItemSchemas[schemaKey]
}

function getUpdateSchema(category: ItemCategoryPath) {
  const schemaKey = getCategoryConfig(category).schemaKey

  return CategoryItemUpdateSchemas[schemaKey]
}

function getValidatableItemInput(
  category: ItemCategoryPath,
  item: ItemRecord
): Record<string, unknown> {
  switch (category) {
    case 'aircraft':
      return {
        registration: item.registration,
        type: item.type ?? undefined,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        flightsAffected: item.flightsAffected ?? undefined,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'airport':
      return {
        airport: item.airport,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        flightsAffected: item.flightsAffected ?? undefined,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'flight-schedule':
      return {
        flightNumber: item.flightNumber,
        route: item.route ?? undefined,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'crew':
      return {
        crewId: item.crewId ?? undefined,
        crewName: item.crewName ?? undefined,
        role: item.role ?? undefined,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        flightsAffected: item.flightsAffected ?? undefined,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'weather':
      return {
        affectedArea: item.affectedArea,
        weatherType: item.weatherType,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        flightsAffected: item.flightsAffected ?? undefined,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'system':
      return {
        systemName: item.systemName,
        issue: item.issue,
        status: item.status,
        priority: item.priority,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
    case 'abnormal-events':
      return {
        eventType: item.eventType,
        description: item.description,
        flightsAffected: item.flightsAffected ?? undefined,
        notificationRef: item.notificationRef ?? undefined,
        status: item.status,
        priority: item.priority,
        ownerId: item.ownerId ?? undefined,
        dueTime: item.dueTime?.toISOString(),
        remarks: item.remarks ?? undefined,
      }
  }
}

function getItemAuditSnapshot(category: ItemCategoryPath, item: ItemRecord) {
  return getValidatableItemInput(category, item)
}

function serializeItem(category: ItemCategoryPath, item: ItemRecord) {
  return {
    category,
    id: item.id,
    handoverId: item.handoverId,
    status: item.status,
    priority: item.priority,
    ownerId: item.ownerId,
    dueTime: normalizeDateTime(item.dueTime),
    remarks: item.remarks,
    resolvedAt: normalizeDateTime(item.resolvedAt),
    deletedAt: normalizeDateTime(item.deletedAt),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    ...getCategorySpecificPayload(category, item),
  }
}

function getCategorySpecificPayload(
  category: ItemCategoryPath,
  item: ItemRecord
): Record<string, unknown> {
  switch (category) {
    case 'aircraft':
      return {
        registration: item.registration,
        type: item.type,
        issue: item.issue,
        flightsAffected: item.flightsAffected,
      }
    case 'airport':
      return {
        airport: item.airport,
        issue: item.issue,
        flightsAffected: item.flightsAffected,
      }
    case 'flight-schedule':
      return {
        flightNumber: item.flightNumber,
        route: item.route,
        issue: item.issue,
      }
    case 'crew':
      return {
        crewId: item.crewId,
        crewName: item.crewName,
        role: item.role,
        issue: item.issue,
        flightsAffected: item.flightsAffected,
      }
    case 'weather':
      return {
        affectedArea: item.affectedArea,
        weatherType: item.weatherType,
        issue: item.issue,
        flightsAffected: item.flightsAffected,
      }
    case 'system':
      return {
        systemName: item.systemName,
        issue: item.issue,
      }
    case 'abnormal-events':
      return {
        eventType: item.eventType,
        description: item.description,
        flightsAffected: item.flightsAffected,
        notificationRef: item.notificationRef,
      }
  }
}

function assertResolvedItemMutability(
  existingItem: ItemRecord,
  input: Record<string, unknown>
) {
  if (existingItem.status !== ItemStatus.Resolved) {
    return
  }

  const disallowedKeys = Object.keys(input).filter((key) => {
    if (key === 'remarks') {
      return false
    }

    if (key === 'status' && input.status === existingItem.status) {
      return false
    }

    return true
  })

  if (disallowedKeys.length > 0) {
    throw new ServiceError(
      409,
      'ITEM_RESOLVED_IMMUTABLE',
      'Resolved items can only update remarks',
      {
        fields: disallowedKeys,
      }
    )
  }
}

function assertValidStatusTransition(existingStatus: ItemStatus, nextStatus: ItemStatus) {
  if (existingStatus === nextStatus) {
    return
  }

  const transition = ItemStatusTransitionSchema.safeParse({
    fromStatus: existingStatus,
    toStatus: nextStatus,
  })

  if (!transition.success) {
    throw new ServiceError(
      400,
      'STATUS_TRANSITION_INVALID',
      'Status transition is not allowed',
      {
        fromStatus: existingStatus,
        toStatus: nextStatus,
      }
    )
  }
}

function buildMergedItemInput(
  category: ItemCategoryPath,
  existingItem: ItemRecord,
  patch: Record<string, unknown>
) {
  return {
    ...getValidatableItemInput(category, existingItem),
    ...normalizeNullablePatch(patch),
  }
}

export async function createItem(
  handoverId: string,
  category: ItemCategoryPath,
  input: Record<string, unknown>,
  user: AuthenticatedUser
) {
  const handover = await getAccessibleHandover(handoverId, user)
  const createSchema = buildCreateValidationSchema(category)
  const validInput = createSchema.parse(input)

  assertDueTimeWindow(validInput.dueTime, handover.handoverDate)

  const initialStatus = (validInput.status ?? ItemStatus.Open) as ItemStatus

  return prisma.$transaction(async (tx) => {
    const createdItem = (await getItemDelegate(tx, category).create({
      data: {
        handoverId,
        ...normalizeItemDataForPersistence(validInput),
        ...(initialStatus === ItemStatus.Resolved
          ? { resolvedAt: new Date() }
          : {}),
      },
    })) as ItemRecord

    await writeAuditLog({
      db: tx,
      handoverId,
      userId: user.id,
      action: AuditAction.CREATED,
      targetModel: getCategoryConfig(category).modelName,
      targetId: createdItem.id,
      newValue: getItemAuditSnapshot(category, createdItem),
    })

    return serializeItem(category, createdItem)
  })
}

export async function updateItem(
  handoverId: string,
  category: ItemCategoryPath,
  itemId: string,
  input: Record<string, unknown>,
  user: AuthenticatedUser
) {
  const handover = await getAccessibleHandover(handoverId, user)
  const existingItem = await ensureItemExists(category, handoverId, itemId)

  if (
    existingItem.status === ItemStatus.Resolved &&
    typeof input.status === 'string' &&
    input.status !== existingItem.status
  ) {
    assertValidStatusTransition(existingItem.status, input.status as ItemStatus)
  }

  assertResolvedItemMutability(existingItem, input)

  const mergedItem = buildMergedItemInput(category, existingItem, input)
  const createSchema = buildCreateValidationSchema(category)
  const validMergedItem = createSchema.parse(mergedItem)

  assertDueTimeWindow(validMergedItem.dueTime, handover.handoverDate)

  const nextStatus = (validMergedItem.status ?? existingItem.status) as ItemStatus
  assertValidStatusTransition(existingItem.status, nextStatus)

  const previousSnapshot = getItemAuditSnapshot(category, existingItem)
  const nextSnapshot = validMergedItem
  const changes = buildChangedFields(previousSnapshot, nextSnapshot)

  return prisma.$transaction(async (tx) => {
    const updatedItem = (await getItemDelegate(tx, category).update({
      where: {
        id: itemId,
      },
      data: {
        ...normalizeItemDataForPersistence(normalizeNullablePatch(input)),
        ...(input.status !== undefined
          ? {
              resolvedAt:
                nextStatus === ItemStatus.Resolved ? new Date() : null,
            }
          : {}),
      },
    })) as ItemRecord

    if (changes.oldValue || changes.newValue) {
      await writeAuditLog({
        db: tx,
        handoverId,
        userId: user.id,
        action:
          input.status !== undefined && input.status !== existingItem.status
            ? AuditAction.STATUS_CHANGED
            : AuditAction.UPDATED,
        targetModel: getCategoryConfig(category).modelName,
        targetId: updatedItem.id,
        oldValue: changes.oldValue,
        newValue: changes.newValue,
      })
    }

    return serializeItem(category, updatedItem)
  })
}

export async function deleteItem(
  handoverId: string,
  category: ItemCategoryPath,
  itemId: string,
  user: AuthenticatedUser
) {
  await getAccessibleHandover(handoverId, user)
  await ensureItemExists(category, handoverId, itemId)

  return prisma.$transaction(async (tx) => {
    const deletedAt = new Date()
    const deletedItem = (await getItemDelegate(tx, category).update({
      where: {
        id: itemId,
      },
      data: {
        deletedAt,
      },
    })) as ItemRecord

    await writeAuditLog({
      db: tx,
      handoverId,
      userId: user.id,
      action: AuditAction.DELETED,
      targetModel: getCategoryConfig(category).modelName,
      targetId: deletedItem.id,
      oldValue: {
        deletedAt: null,
      },
      newValue: {
        deletedAt: deletedAt.toISOString(),
      },
    })

    return {
      id: deletedItem.id,
      deletedAt: deletedAt.toISOString(),
    }
  })
}

export function parseCreateItemPayload(
  category: ItemCategoryPath,
  payload: unknown
) {
  return buildCreateValidationSchema(category).parse(payload)
}

export function parseUpdateItemPayload(
  category: ItemCategoryPath,
  payload: unknown
) {
  return getUpdateSchema(category).parse(payload)
}
