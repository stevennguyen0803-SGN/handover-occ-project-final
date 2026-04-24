# Schema Design - OCC Handover System

This file documents the planned Zod schemas for Phase 2 implementation. These are design artifacts only and are intended to line up with `shared/DATA_MODEL.md`, `shared/BUSINESS_RULES.md`, and `shared/API_SPEC.md`.

## Shared Helpers Used by the Schemas Below

```typescript
import { z } from 'zod'

const DateOnlyString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

const DateTimeString = z.string().datetime({ offset: true })

export const ShiftEnum = z.enum(['Morning', 'Afternoon', 'Night'])
export const PriorityEnum = z.enum(['Low', 'Normal', 'High', 'Critical'])
export const ItemStatusEnum = z.enum(['Open', 'Monitoring', 'Resolved'])

const BaseOperationalItemSchema = z.object({
  status: ItemStatusEnum.default('Open'),
  priority: PriorityEnum.default('Normal'),
  ownerId: z.string().cuid().optional(),
  dueTime: DateTimeString.optional(),
  remarks: z.string().max(2000).optional(),
})

function validateDueTimeWindow(
  dueTime: string | undefined,
  handoverDate: string,
  ctx: z.RefinementCtx,
  path: (string | number)[]
) {
  if (!dueTime) return

  const dueAt = new Date(dueTime)
  const handoverAt = new Date(`${handoverDate}T00:00:00.000Z`)
  const maxDueAt = new Date(handoverAt.getTime() + 72 * 60 * 60 * 1000)

  if (dueAt <= new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dueTime must be in the future',
      path,
    })
  }

  if (dueAt > maxDueAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dueTime must be within 72 hours of handoverDate',
      path,
    })
  }
}
```

## CreateHandoverSchema

Enforces: BR-01, BR-06, BR-08, BR-13, BR-14

```typescript
import { z } from 'zod'

export const AircraftItemSchema = BaseOperationalItemSchema.extend({
  registration: z.string().min(2).max(20),
  type: z.string().max(50).optional(),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // BR-06: open high/critical items require ownerId
  if (
    data.status === 'Open' &&
    (data.priority === 'High' || data.priority === 'Critical') &&
    !data.ownerId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ownerId is required for open High/Critical items',
      path: ['ownerId'],
    })
  }
})

const AirportItemSchema = BaseOperationalItemSchema.extend({
  airport: z.string().length(4),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
})

const FlightScheduleItemSchema = BaseOperationalItemSchema.extend({
  flightNumber: z.string().min(2).max(20),
  route: z.string().max(20).optional(),
  issue: z.string().min(5).max(2000),
})

const CrewItemSchema = BaseOperationalItemSchema.extend({
  crewId: z.string().max(50).optional(),
  crewName: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
})

const WeatherItemSchema = BaseOperationalItemSchema.extend({
  affectedArea: z.string().min(2).max(50),
  weatherType: z.string().min(2).max(100),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
})

const SystemItemSchema = BaseOperationalItemSchema.extend({
  systemName: z.string().min(2).max(100),
  issue: z.string().min(5).max(2000),
})

export const AbnormalEventSchema = BaseOperationalItemSchema.extend({
  eventType: z.string().min(2).max(50),
  description: z.string().min(20).max(4000),
  flightsAffected: z.string().max(500).optional(),
  notificationRef: z.string().max(100).optional(),
}).superRefine((data, ctx) => {
  // BR-06: open high/critical items require ownerId
  if (
    data.status === 'Open' &&
    (data.priority === 'High' || data.priority === 'Critical') &&
    !data.ownerId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ownerId is required for open High/Critical items',
      path: ['ownerId'],
    })
  }

  // BR-08: flightsAffected is required for AOG and Diversion abnormal events
  if (
    (data.eventType === 'AOG' || data.eventType === 'Diversion') &&
    !data.flightsAffected
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'flightsAffected is required for AOG or Diversion events',
      path: ['flightsAffected'],
    })
  }

  // BR-08: notificationRef is required for Critical abnormal events
  if (data.priority === 'Critical' && !data.notificationRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'notificationRef is required for Critical abnormal events',
      path: ['notificationRef'],
    })
  }
})

const CategoriesSchema = z.object({
  aircraft: z.array(AircraftItemSchema).min(1).optional(),
  airport: z.array(AirportItemSchema).min(1).optional(),
  flightSchedule: z.array(FlightScheduleItemSchema).min(1).optional(),
  crew: z.array(CrewItemSchema).min(1).optional(),
  weather: z.array(WeatherItemSchema).min(1).optional(),
  system: z.array(SystemItemSchema).min(1).optional(),
  abnormalEvents: z.array(AbnormalEventSchema).min(1).optional(),
})

export const CreateHandoverSchema = z.object({
  handoverDate: DateOnlyString,
  shift: ShiftEnum,
  preparedById: z.string().cuid(),
  handedToId: z.string().cuid().optional(),
  overallPriority: PriorityEnum.default('Normal'),
  generalRemarks: z.string().max(5000).optional(),
  nextShiftActions: z.string().max(5000).optional(),
  categories: CategoriesSchema.default({}),
}).superRefine((data, ctx) => {
  // BR-13: any activated category must contain at least one item
  for (const [categoryName, items] of Object.entries(data.categories)) {
    if (Array.isArray(items) && items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${categoryName} cannot be an empty activated category`,
        path: ['categories', categoryName],
      })
    }
  }

  // BR-14: each dueTime must be future-dated and within 72 hours of handoverDate
  for (const [categoryName, items] of Object.entries(data.categories)) {
    if (!Array.isArray(items)) continue

    items.forEach((item, index) => {
      validateDueTimeWindow(
        item.dueTime,
        data.handoverDate,
        ctx,
        ['categories', categoryName, index, 'dueTime']
      )
    })
  }
})
```

## UpdateHandoverSchema

Enforces: BR-06, BR-08, BR-13, BR-14

```typescript
import { z } from 'zod'

const PartialCategoriesSchema = z.object({
  aircraft: z.array(AircraftItemSchema).min(1).optional(),
  airport: z.array(AirportItemSchema).min(1).optional(),
  flightSchedule: z.array(FlightScheduleItemSchema).min(1).optional(),
  crew: z.array(CrewItemSchema).min(1).optional(),
  weather: z.array(WeatherItemSchema).min(1).optional(),
  system: z.array(SystemItemSchema).min(1).optional(),
  abnormalEvents: z.array(AbnormalEventSchema).min(1).optional(),
})

export const UpdateHandoverSchema = z.object({
  handoverDate: DateOnlyString.optional(),
  shift: ShiftEnum.optional(),
  handedToId: z.string().cuid().nullable().optional(),
  overallPriority: PriorityEnum.optional(),
  generalRemarks: z.string().max(5000).optional(),
  nextShiftActions: z.string().max(5000).optional(),
  categories: PartialCategoriesSchema.optional(),
}).superRefine((data, ctx) => {
  // BR-13: an activated category cannot be submitted as an empty array during updates
  if (data.categories) {
    for (const [categoryName, items] of Object.entries(data.categories)) {
      if (Array.isArray(items) && items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${categoryName} cannot be an empty activated category`,
          path: ['categories', categoryName],
        })
      }
    }
  }

  // BR-14: if handoverDate and dueTime values are part of the update, keep the dueTime window valid
  if (data.handoverDate && data.categories) {
    for (const [categoryName, items] of Object.entries(data.categories)) {
      if (!Array.isArray(items)) continue

      items.forEach((item, index) => {
        validateDueTimeWindow(
          item.dueTime,
          data.handoverDate as string,
          ctx,
          ['categories', categoryName, index, 'dueTime']
        )
      })
    }
  }
})
```

## AircraftItemSchema

Enforces: BR-06, BR-14

```typescript
import { z } from 'zod'

export const AircraftItemSchema = BaseOperationalItemSchema.extend({
  registration: z.string().min(2).max(20),
  type: z.string().max(50).optional(),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // BR-06: open high/critical items require ownerId
  if (
    data.status === 'Open' &&
    (data.priority === 'High' || data.priority === 'Critical') &&
    !data.ownerId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ownerId is required for open High/Critical items',
      path: ['ownerId'],
    })
  }

  // BR-14: dueTime must be syntactically valid here; the handover-level schema checks the 72-hour window
  if (data.dueTime && Number.isNaN(Date.parse(data.dueTime))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dueTime must be a valid ISO datetime',
      path: ['dueTime'],
    })
  }
})
```

## AbnormalEventSchema

Enforces: BR-06, BR-08, BR-14

```typescript
import { z } from 'zod'

export const AbnormalEventSchema = BaseOperationalItemSchema.extend({
  eventType: z.string().min(2).max(50),
  description: z.string().min(20).max(4000),
  flightsAffected: z.string().max(500).optional(),
  notificationRef: z.string().max(100).optional(),
}).superRefine((data, ctx) => {
  // BR-06: open high/critical items require ownerId
  if (
    data.status === 'Open' &&
    (data.priority === 'High' || data.priority === 'Critical') &&
    !data.ownerId
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'ownerId is required for open High/Critical items',
      path: ['ownerId'],
    })
  }

  // BR-08: flightsAffected is required for AOG or Diversion
  if (
    (data.eventType === 'AOG' || data.eventType === 'Diversion') &&
    !data.flightsAffected
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'flightsAffected is required for AOG or Diversion events',
      path: ['flightsAffected'],
    })
  }

  // BR-08: notificationRef is required when priority is Critical
  if (data.priority === 'Critical' && !data.notificationRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'notificationRef is required for Critical abnormal events',
      path: ['notificationRef'],
    })
  }

  // BR-14: dueTime must be syntactically valid here; the handover-level schema checks the 72-hour window
  if (data.dueTime && Number.isNaN(Date.parse(data.dueTime))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'dueTime must be a valid ISO datetime',
      path: ['dueTime'],
    })
  }
})
```

## ItemStatusTransitionSchema

Enforces: BR-05

```typescript
import { z } from 'zod'

const VALID_TRANSITIONS: Record<
  z.infer<typeof ItemStatusEnum>,
  Array<z.infer<typeof ItemStatusEnum>>
> = {
  Open: ['Monitoring', 'Resolved'],
  Monitoring: ['Open', 'Resolved'],
  Resolved: [],
}

export const ItemStatusTransitionSchema = z.object({
  fromStatus: ItemStatusEnum,
  toStatus: ItemStatusEnum,
  remarks: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  // BR-05: only allow status transitions defined in VALID_TRANSITIONS
  const allowed = VALID_TRANSITIONS[data.fromStatus]

  if (!allowed.includes(data.toStatus)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'STATUS_TRANSITION_INVALID',
      path: ['toStatus'],
    })
  }
})
```
