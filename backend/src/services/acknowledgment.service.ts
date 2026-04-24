import { AuditAction } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { ServiceError } from '../lib/service-error'
import { writeAuditLog } from './audit.service'

export type AcknowledgeResult = {
  acknowledgedAt: string
}

/**
 * Acknowledge a handover on behalf of the incoming shift user.
 *
 * Rules (BR-10):
 * - The caller CANNOT acknowledge their own handover (preparedById !== userId)
 * - Multiple different users CAN acknowledge the same handover
 * - The same user CANNOT acknowledge the same handover twice (unique constraint)
 * - The first acknowledgment sets `Handover.acknowledgedAt`
 * - An AuditLog entry with action = ACKNOWLEDGED is written
 */
export async function acknowledgeHandover(
  handoverId: string,
  userId: string,
  notes?: string | null
): Promise<AcknowledgeResult> {
  // 1. Load handover to verify existence and ownership
  const handover = await prisma.handover.findFirst({
    where: { id: handoverId, deletedAt: null },
    select: {
      id: true,
      preparedById: true,
      acknowledgedAt: true,
    },
  })

  if (!handover) {
    throw new ServiceError(404, 'NOT_FOUND', 'Handover not found')
  }

  // 2. BR-10: Cannot acknowledge own handover
  if (handover.preparedById === userId) {
    throw new ServiceError(
      403,
      'CANNOT_ACK_OWN_HANDOVER',
      'You cannot acknowledge a handover you prepared'
    )
  }

  // 3. Check if user already acknowledged (@@unique constraint would also catch this)
  const existing = await prisma.acknowledgment.findUnique({
    where: {
      handoverId_userId: {
        handoverId,
        userId,
      },
    },
  })

  if (existing) {
    throw new ServiceError(
      409,
      'ALREADY_ACKNOWLEDGED',
      'You have already acknowledged this handover'
    )
  }

  // 4. Transaction: create acknowledgment, update handover, write audit log
  const now = new Date()

  return prisma.$transaction(async (tx) => {
    // Create acknowledgment record
    await tx.acknowledgment.create({
      data: {
        handoverId,
        userId,
        acknowledgedAt: now,
        notes: notes ?? null,
      },
    })

    // Set acknowledgedAt on first acknowledgment only
    if (!handover.acknowledgedAt) {
      await tx.handover.update({
        where: { id: handoverId },
        data: { acknowledgedAt: now },
      })
    }

    // Write audit log
    await writeAuditLog({
      db: tx,
      handoverId,
      userId,
      action: AuditAction.ACKNOWLEDGED,
      targetModel: 'handover',
      targetId: handoverId,
      newValue: {
        notes: notes ?? null,
        acknowledgedAt: now.toISOString(),
      },
    })

    return {
      acknowledgedAt: now.toISOString(),
    }
  })
}
