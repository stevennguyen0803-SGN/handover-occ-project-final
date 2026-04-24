import { AuditAction, type Prisma } from '@prisma/client'

type AuditDbClient = {
  auditLog: {
    create: (args: Prisma.AuditLogCreateArgs) => Promise<unknown>
  }
}

type AuditSnapshot = Record<string, unknown>

type WriteAuditLogInput = {
  db: AuditDbClient
  handoverId: string
  userId: string
  action: AuditAction
  targetModel: string
  targetId: string
  oldValue?: AuditSnapshot | null
  newValue?: AuditSnapshot | null
}

function normalizeAuditSnapshot(
  value: AuditSnapshot | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value == null) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Prisma.InputJsonValue
}

function areAuditValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function buildChangedFields(
  previous: AuditSnapshot,
  next: AuditSnapshot
): {
  oldValue: AuditSnapshot | null
  newValue: AuditSnapshot | null
} {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)])
  const oldValue: AuditSnapshot = {}
  const newValue: AuditSnapshot = {}

  keys.forEach((key) => {
    if (!areAuditValuesEqual(previous[key], next[key])) {
      oldValue[key] = previous[key]
      newValue[key] = next[key]
    }
  })

  return {
    oldValue: Object.keys(oldValue).length > 0 ? oldValue : null,
    newValue: Object.keys(newValue).length > 0 ? newValue : null,
  }
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  const oldValue = normalizeAuditSnapshot(input.oldValue)
  const newValue = normalizeAuditSnapshot(input.newValue)

  await input.db.auditLog.create({
    data: {
      handoverId: input.handoverId,
      userId: input.userId,
      action: input.action,
      targetModel: input.targetModel,
      targetId: input.targetId,
      ...(oldValue !== undefined ? { oldValue } : {}),
      ...(newValue !== undefined ? { newValue } : {}),
    },
  })
}
