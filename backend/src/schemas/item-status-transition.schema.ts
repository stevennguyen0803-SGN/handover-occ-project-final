import { z } from 'zod'

import { ItemStatusEnum } from './shared.schema'

const VALID_TRANSITIONS: Record<
  z.infer<typeof ItemStatusEnum>,
  Array<z.infer<typeof ItemStatusEnum>>
> = {
  Open: ['Monitoring', 'Resolved'],
  Monitoring: ['Open', 'Resolved'],
  Resolved: [],
}

export const ItemStatusTransitionSchema = z
  .object({
    fromStatus: ItemStatusEnum,
    toStatus: ItemStatusEnum,
    remarks: z.string().max(2000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // BR-05: only allow status transitions from the approved matrix
    const allowedTransitions = VALID_TRANSITIONS[data.fromStatus]

    if (!allowedTransitions.includes(data.toStatus)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'STATUS_TRANSITION_INVALID',
        path: ['toStatus'],
      })
    }
  })

export type ItemStatusTransitionInput = z.infer<
  typeof ItemStatusTransitionSchema
>
