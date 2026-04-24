import { describe, expect, it } from 'vitest'

import {
  CreateHandoverSchema,
  UpdateHandoverSchema,
} from '../../../backend/src/schemas/handover.schema'

const VALID_HANDED_TO_ID = 'c123456789012345678901234'
const VALID_OWNER_ID = 'c123456789012345678901235'

function buildValidCreatePayload() {
  return {
    handoverDate: '2099-01-01',
    shift: 'Morning',
    overallPriority: 'High',
    handedToId: VALID_HANDED_TO_ID,
    generalRemarks: 'Busy shift with multiple active items.',
    nextShiftActions: 'Monitor AOG status and follow up with engineering.',
    categories: {
      aircraft: [
        {
          registration: '9M-XXA',
          type: 'A320',
          issue: 'Hydraulic leak discovered at gate C12.',
          status: 'Open',
          priority: 'Critical',
          ownerId: VALID_OWNER_ID,
          dueTime: '2099-01-01T12:00:00Z',
          remarks: 'Engineering is assessing the aircraft.',
        },
      ],
    },
  }
}

describe('CreateHandoverSchema', () => {
  it('accepts a valid handover payload', () => {
    const result = CreateHandoverSchema.safeParse(buildValidCreatePayload())

    expect(result.success).toBe(true)
  })

  it('rejects missing shift (BR-01)', () => {
    const { shift: _shift, ...payload } = buildValidCreatePayload()

    const result = CreateHandoverSchema.safeParse(payload)

    expect(result.success).toBe(false)
  })

  it('rejects missing overallPriority (BR-01)', () => {
    const { overallPriority: _overallPriority, ...payload } =
      buildValidCreatePayload()

    const result = CreateHandoverSchema.safeParse(payload)

    expect(result.success).toBe(false)
  })

  it('rejects client-supplied referenceId (BR-02)', () => {
    const result = CreateHandoverSchema.safeParse({
      ...buildValidCreatePayload(),
      referenceId: 'HDO-2099-000001',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty category arrays when a category is activated (BR-13)', () => {
    const result = CreateHandoverSchema.safeParse({
      ...buildValidCreatePayload(),
      categories: {
        aircraft: [],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.path.join('.') === 'categories.aircraft')).toBe(true)
  })

  it('rejects past dueTime values (BR-14)', () => {
    const result = CreateHandoverSchema.safeParse({
      ...buildValidCreatePayload(),
      categories: {
        aircraft: [
          {
            registration: '9M-XXA',
            type: 'A320',
            issue: 'Hydraulic leak discovered at gate C12.',
            status: 'Open',
            priority: 'Critical',
            ownerId: VALID_OWNER_ID,
            dueTime: '2020-01-01T12:00:00Z',
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.some((issue) => issue.message === 'dueTime must be in the future')).toBe(true)
  })

  it('rejects dueTime values more than 72 hours after handoverDate (BR-14)', () => {
    const result = CreateHandoverSchema.safeParse({
      ...buildValidCreatePayload(),
      categories: {
        aircraft: [
          {
            registration: '9M-XXA',
            type: 'A320',
            issue: 'Hydraulic leak discovered at gate C12.',
            status: 'Open',
            priority: 'Critical',
            ownerId: VALID_OWNER_ID,
            dueTime: '2099-01-05T00:00:01Z',
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.some(
        (issue) => issue.message === 'dueTime must be within 72 hours of handoverDate'
      )
    ).toBe(true)
  })
})

describe('UpdateHandoverSchema', () => {
  it('accepts partial updates', () => {
    const result = UpdateHandoverSchema.safeParse({
      generalRemarks: 'Updated remarks',
    })

    expect(result.success).toBe(true)
  })
})
