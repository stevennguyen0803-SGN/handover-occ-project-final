import { z } from 'zod'

import {
  BaseOperationalItemSchema,
  DateTimeString,
  EntityIdSchema,
  ItemStatusEnum,
  PriorityEnum,
  validateDueTimeSyntax,
  validateOwnerRequiredForOpenHighPriorityItem,
} from './shared.schema'

function withOperationalItemRules<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data, ctx) => {
    const operationalItem = data as {
      status: z.infer<typeof ItemStatusEnum>
      priority: z.infer<typeof PriorityEnum>
      ownerId?: string | undefined
      dueTime?: string | undefined
    }

    // BR-06: ownerId required for open High/Critical items
    validateOwnerRequiredForOpenHighPriorityItem(operationalItem, ctx)

    // BR-14: dueTime must be a valid ISO datetime
    validateDueTimeSyntax(operationalItem.dueTime, ctx)
  })
}

const AircraftItemFields = {
  registration: z.string().min(2).max(20),
  type: z.string().max(50).optional(),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
} satisfies z.ZodRawShape

const AirportItemFields = {
  airport: z.string().length(4),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
} satisfies z.ZodRawShape

const FlightScheduleItemFields = {
  flightNumber: z.string().min(2).max(20),
  route: z.string().max(20).optional(),
  issue: z.string().min(5).max(2000),
} satisfies z.ZodRawShape

const CrewItemFields = {
  crewId: z.string().max(50).optional(),
  crewName: z.string().max(100).optional(),
  role: z.string().max(50).optional(),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
} satisfies z.ZodRawShape

const WeatherItemFields = {
  affectedArea: z.string().min(2).max(50),
  weatherType: z.string().min(2).max(100),
  issue: z.string().min(5).max(2000),
  flightsAffected: z.string().max(500).optional(),
} satisfies z.ZodRawShape

const SystemItemFields = {
  systemName: z.string().min(2).max(100),
  issue: z.string().min(5).max(2000),
} satisfies z.ZodRawShape

const AbnormalEventFields = {
  eventType: z.string().min(2).max(50),
  description: z.string().min(20).max(4000),
  flightsAffected: z.string().max(500).optional(),
  notificationRef: z.string().max(100).optional(),
} satisfies z.ZodRawShape

const BaseOperationalItemUpdateSchema = z
  .object({
    status: ItemStatusEnum.optional(),
    priority: PriorityEnum.optional(),
    ownerId: EntityIdSchema.nullable().optional(),
    dueTime: DateTimeString.nullable().optional(),
    remarks: z.string().max(2000).nullable().optional(),
  })
  .strict()

export const AircraftItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(AircraftItemFields).strict()
)

export const UpdateAircraftItemSchema = BaseOperationalItemUpdateSchema.extend({
  registration: AircraftItemFields.registration.optional(),
  type: z.string().max(50).nullable().optional(),
  issue: AircraftItemFields.issue.optional(),
  flightsAffected: z.string().max(500).nullable().optional(),
}).strict()

export const AirportItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(AirportItemFields).strict()
)

export const UpdateAirportItemSchema = BaseOperationalItemUpdateSchema.extend({
  airport: AirportItemFields.airport.optional(),
  issue: AirportItemFields.issue.optional(),
  flightsAffected: z.string().max(500).nullable().optional(),
}).strict()

export const FlightScheduleItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(FlightScheduleItemFields).strict()
)

export const UpdateFlightScheduleItemSchema = BaseOperationalItemUpdateSchema.extend({
  flightNumber: FlightScheduleItemFields.flightNumber.optional(),
  route: z.string().max(20).nullable().optional(),
  issue: FlightScheduleItemFields.issue.optional(),
}).strict()

export const CrewItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(CrewItemFields).strict()
)

export const UpdateCrewItemSchema = BaseOperationalItemUpdateSchema.extend({
  crewId: z.string().max(50).nullable().optional(),
  crewName: z.string().max(100).nullable().optional(),
  role: z.string().max(50).nullable().optional(),
  issue: CrewItemFields.issue.optional(),
  flightsAffected: z.string().max(500).nullable().optional(),
}).strict()

export const WeatherItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(WeatherItemFields).strict()
)

export const UpdateWeatherItemSchema = BaseOperationalItemUpdateSchema.extend({
  affectedArea: WeatherItemFields.affectedArea.optional(),
  weatherType: WeatherItemFields.weatherType.optional(),
  issue: WeatherItemFields.issue.optional(),
  flightsAffected: z.string().max(500).nullable().optional(),
}).strict()

export const SystemItemSchema = withOperationalItemRules(
  BaseOperationalItemSchema.extend(SystemItemFields).strict()
)

export const UpdateSystemItemSchema = BaseOperationalItemUpdateSchema.extend({
  systemName: SystemItemFields.systemName.optional(),
  issue: SystemItemFields.issue.optional(),
}).strict()

export const AbnormalEventSchema = BaseOperationalItemSchema.extend(
  AbnormalEventFields
)
  .strict()
  .superRefine((data, ctx) => {
    // BR-06: ownerId required for open High/Critical items
    validateOwnerRequiredForOpenHighPriorityItem(data, ctx)

    // BR-08: abnormal events must satisfy conditional required fields
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

    if (data.priority === 'Critical' && !data.notificationRef) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'notificationRef is required for Critical abnormal events',
        path: ['notificationRef'],
      })
    }

    // BR-14: dueTime must be a valid ISO datetime
    validateDueTimeSyntax(data.dueTime, ctx)
  })

export const UpdateAbnormalEventSchema = BaseOperationalItemUpdateSchema.extend({
  eventType: AbnormalEventFields.eventType.optional(),
  description: AbnormalEventFields.description.optional(),
  flightsAffected: z.string().max(500).nullable().optional(),
  notificationRef: z.string().max(100).nullable().optional(),
}).strict()

export const CategoryItemSchemas = {
  aircraft: AircraftItemSchema,
  airport: AirportItemSchema,
  flightSchedule: FlightScheduleItemSchema,
  crew: CrewItemSchema,
  weather: WeatherItemSchema,
  system: SystemItemSchema,
  abnormalEvents: AbnormalEventSchema,
} as const

export const CategoryItemUpdateSchemas = {
  aircraft: UpdateAircraftItemSchema,
  airport: UpdateAirportItemSchema,
  flightSchedule: UpdateFlightScheduleItemSchema,
  crew: UpdateCrewItemSchema,
  weather: UpdateWeatherItemSchema,
  system: UpdateSystemItemSchema,
  abnormalEvents: UpdateAbnormalEventSchema,
} as const

export type ItemStatus = z.infer<typeof ItemStatusEnum>
export type Priority = z.infer<typeof PriorityEnum>
export type AircraftItemInput = z.infer<typeof AircraftItemSchema>
export type UpdateAircraftItemInput = z.infer<typeof UpdateAircraftItemSchema>
export type AirportItemInput = z.infer<typeof AirportItemSchema>
export type UpdateAirportItemInput = z.infer<typeof UpdateAirportItemSchema>
export type FlightScheduleItemInput = z.infer<typeof FlightScheduleItemSchema>
export type UpdateFlightScheduleItemInput = z.infer<
  typeof UpdateFlightScheduleItemSchema
>
export type CrewItemInput = z.infer<typeof CrewItemSchema>
export type UpdateCrewItemInput = z.infer<typeof UpdateCrewItemSchema>
export type WeatherItemInput = z.infer<typeof WeatherItemSchema>
export type UpdateWeatherItemInput = z.infer<typeof UpdateWeatherItemSchema>
export type SystemItemInput = z.infer<typeof SystemItemSchema>
export type UpdateSystemItemInput = z.infer<typeof UpdateSystemItemSchema>
export type AbnormalEventInput = z.infer<typeof AbnormalEventSchema>
export type UpdateAbnormalEventInput = z.infer<
  typeof UpdateAbnormalEventSchema
>
