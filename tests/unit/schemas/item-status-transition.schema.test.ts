import { describe, expect, it } from 'vitest'

import { ItemStatusTransitionSchema } from '../../../backend/src/schemas/item-status-transition.schema'

describe('ItemStatusTransitionSchema', () => {
  it('accepts valid status transitions (BR-05)', () => {
    const result = ItemStatusTransitionSchema.safeParse({
      fromStatus: 'Open',
      toStatus: 'Monitoring',
      remarks: 'Actively monitoring the issue.',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid status transitions (BR-05)', () => {
    const result = ItemStatusTransitionSchema.safeParse({
      fromStatus: 'Resolved',
      toStatus: 'Open',
      remarks: 'Trying to reopen a resolved item.',
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.some((issue) => issue.message === 'STATUS_TRANSITION_INVALID')
    ).toBe(true)
  })
})
