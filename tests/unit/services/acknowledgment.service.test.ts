import { AuditAction } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

let auditLogs: Array<Record<string, unknown>> = []
let acknowledgments: Array<Record<string, unknown>> = []
let handoverUpdates: Array<{ id: string; data: Record<string, unknown> }> = []

const prismaMock = vi.hoisted(() => ({
  handover: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  acknowledgment: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock('../../../backend/src/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { acknowledgeHandover } from '../../../backend/src/services/acknowledgment.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupTransactionMock() {
  prismaMock.$transaction.mockImplementation(async (fn: Function) => {
    const txClient = {
      acknowledgment: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          acknowledgments.push(data)
          return { id: `ack-${acknowledgments.length}`, ...data }
        }),
      },
      handover: {
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string }
            data: Record<string, unknown>
          }) => {
            handoverUpdates.push({ id: where.id, data })
            return { id: where.id, ...data }
          }
        ),
      },
      auditLog: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          auditLogs.push(data)
          return data
        }),
      },
    }

    return fn(txClient)
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('acknowledgment.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auditLogs = []
    acknowledgments = []
    handoverUpdates = []
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('acknowledgeHandover', () => {
    it('creates an acknowledgment record and sets acknowledgedAt on first acknowledgment', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-preparer',
        acknowledgedAt: null,
      })
      prismaMock.acknowledgment.findUnique.mockResolvedValueOnce(null)
      setupTransactionMock()

      const result = await acknowledgeHandover('h-1', 'user-acker', 'Noted.')

      expect(result.acknowledgedAt).toBeDefined()
      expect(acknowledgments).toHaveLength(1)
      expect(acknowledgments[0]!.handoverId).toBe('h-1')
      expect(acknowledgments[0]!.userId).toBe('user-acker')
      expect(acknowledgments[0]!.notes).toBe('Noted.')

      // First acknowledgment should update handover.acknowledgedAt
      expect(handoverUpdates).toHaveLength(1)
      expect(handoverUpdates[0]!.id).toBe('h-1')
      expect(handoverUpdates[0]!.data.acknowledgedAt).toBeDefined()
    })

    it('does NOT update acknowledgedAt on second acknowledgment', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-preparer',
        acknowledgedAt: new Date('2026-04-23T10:00:00Z'), // already set
      })
      prismaMock.acknowledgment.findUnique.mockResolvedValueOnce(null)
      setupTransactionMock()

      await acknowledgeHandover('h-1', 'user-second-acker')

      expect(acknowledgments).toHaveLength(1)
      // Should NOT have updated the handover since acknowledgedAt already set
      expect(handoverUpdates).toHaveLength(0)
    })

    it('writes ACKNOWLEDGED audit log entry', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-preparer',
        acknowledgedAt: null,
      })
      prismaMock.acknowledgment.findUnique.mockResolvedValueOnce(null)
      setupTransactionMock()

      await acknowledgeHandover('h-1', 'user-acker', 'Will monitor.')

      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0]!.handoverId).toBe('h-1')
      expect(auditLogs[0]!.userId).toBe('user-acker')
      expect(auditLogs[0]!.action).toBe(AuditAction.ACKNOWLEDGED)
      expect(auditLogs[0]!.targetModel).toBe('handover')
      expect(auditLogs[0]!.targetId).toBe('h-1')
    })

    it('throws CANNOT_ACK_OWN_HANDOVER when user is the preparer (BR-10)', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-same',
        acknowledgedAt: null,
      })

      await expect(
        acknowledgeHandover('h-1', 'user-same')
      ).rejects.toThrow('You cannot acknowledge a handover you prepared')
    })

    it('throws ALREADY_ACKNOWLEDGED when user already acknowledged', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-preparer',
        acknowledgedAt: null,
      })
      prismaMock.acknowledgment.findUnique.mockResolvedValueOnce({
        id: 'existing-ack',
        handoverId: 'h-1',
        userId: 'user-acker',
      })

      await expect(
        acknowledgeHandover('h-1', 'user-acker')
      ).rejects.toThrow('You have already acknowledged this handover')
    })

    it('throws NOT_FOUND when handover does not exist', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce(null)

      await expect(
        acknowledgeHandover('nonexistent', 'user-1')
      ).rejects.toThrow('Handover not found')
    })

    it('handles null notes gracefully', async () => {
      prismaMock.handover.findFirst.mockResolvedValueOnce({
        id: 'h-1',
        preparedById: 'user-preparer',
        acknowledgedAt: null,
      })
      prismaMock.acknowledgment.findUnique.mockResolvedValueOnce(null)
      setupTransactionMock()

      await acknowledgeHandover('h-1', 'user-acker', null)

      expect(acknowledgments).toHaveLength(1)
      expect(acknowledgments[0]!.notes).toBeNull()
    })
  })
})
