import { describe, expect, it } from 'vitest'

import { AircraftItemSchema } from '../../../backend/src/schemas/item.schema'

const VALID_OWNER_ID = 'c123456789012345678901234'

describe('AircraftItemSchema', () => {
  it('accepts a valid aircraft item payload', () => {
    const result = AircraftItemSchema.safeParse({
      registration: '9M-XXA',
      type: 'A320',
      issue: 'Hydraulic leak discovered at gate C12.',
      status: 'Open',
      priority: 'High',
      ownerId: VALID_OWNER_ID,
      dueTime: '2099-01-01T12:00:00Z',
      remarks: 'Engineering team engaged.',
    })

    expect(result.success).toBe(true)
  })

  it('rejects High/Critical open items without ownerId (BR-06)', () => {
    const result = AircraftItemSchema.safeParse({
      registration: '9M-XXA',
      type: 'A320',
      issue: 'Hydraulic leak discovered at gate C12.',
      status: 'Open',
      priority: 'Critical',
      dueTime: '2099-01-01T12:00:00Z',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.join('.') === 'ownerId')).toBe(true)
  })

  it('rejects invalid dueTime syntax (BR-14)', () => {
    const result = AircraftItemSchema.safeParse({
      registration: '9M-XXA',
      type: 'A320',
      issue: 'Hydraulic leak discovered at gate C12.',
      status: 'Monitoring',
      priority: 'Normal',
      dueTime: 'not-a-datetime',
    })

    expect(result.success).toBe(false)
  })
})
