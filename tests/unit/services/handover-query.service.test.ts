import { UserRole } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '../../../backend/src/middleware/auth.middleware'
import {
  buildHandoverListWhereClause,
  buildHandoverOrderByClause,
  buildHandoverSearchFilter,
  buildOverdueItemsFilter,
} from '../../../backend/src/services/handover-query.service'

function createUser(role: UserRole): AuthenticatedUser {
  return {
    id: `${role.toLowerCase()}-user`,
    name: `${role} User`,
    email: `${role.toLowerCase()}@example.com`,
    role,
  }
}

describe('handover-query.service', () => {
  it('combines advanced filters with AND logic', () => {
    const now = new Date('2026-04-23T10:00:00.000Z')
    const where = buildHandoverListWhereClause(
      createUser(UserRole.SUPERVISOR),
      {
        status: 'Open,Monitoring',
        priority: 'High,Critical',
        shift: 'Morning',
        from: '2026-04-20',
        to: '2026-04-23',
        search: 'AOG',
        carriedForwardOnly: 'true',
        mine: 'true',
        overdueOnly: 'true',
      },
      { now }
    )

    expect(where).toEqual({
      AND: expect.arrayContaining([
        { deletedAt: null },
        { preparedById: 'supervisor-user' },
        { overallStatus: { in: ['Open', 'Monitoring'] } },
        { overallPriority: { in: ['High', 'Critical'] } },
        { shift: 'Morning' },
        {
          handoverDate: {
            gte: new Date('2026-04-20T00:00:00.000Z'),
            lte: new Date('2026-04-23T00:00:00.000Z'),
          },
        },
        { isCarriedForward: true },
        buildHandoverSearchFilter('AOG'),
        buildOverdueItemsFilter(now),
      ]),
    })
  })

  it('always restricts OCC staff to their own handovers', () => {
    const where = buildHandoverListWhereClause(createUser(UserRole.OCC_STAFF), {})

    expect(where).toEqual({
      AND: [{ deletedAt: null }, { preparedById: 'occ_staff-user' }],
    })
  })

  it('ignores invalid enum filters and false boolean filters', () => {
    const where = buildHandoverListWhereClause(createUser(UserRole.ADMIN), {
      status: 'Open,Invalid',
      priority: 'Wrong',
      shift: 'LateNight',
      carriedForwardOnly: 'false',
      mine: '0',
      overdueOnly: 'false',
    })

    expect(where).toEqual({
      AND: [{ deletedAt: null }, { overallStatus: { in: ['Open'] } }],
    })
  })

  it('uses priority then createdAt sorting by default', () => {
    expect(buildHandoverOrderByClause({})).toEqual([
      { overallPriority: 'desc' },
      { createdAt: 'desc' },
    ])
  })

  it('uses an explicit supported sort field when provided', () => {
    expect(
      buildHandoverOrderByClause({
        sortBy: 'handoverDate',
        sortOrder: 'asc',
      })
    ).toEqual([{ handoverDate: 'asc' }, { createdAt: 'desc' }])
  })
})
