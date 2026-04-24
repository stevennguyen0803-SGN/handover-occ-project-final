import { z } from 'zod'

import {
  AbnormalEventSchema,
  AircraftItemSchema,
  AirportItemSchema,
  CrewItemSchema,
  FlightScheduleItemSchema,
  SystemItemSchema,
  WeatherItemSchema,
} from './item.schema'
import {
  DateOnlyString,
  EntityIdSchema,
  ItemStatusEnum,
  PriorityEnum,
  ShiftEnum,
  validateDueTimeWindow,
} from './shared.schema'

const CategoriesSchema = z
  .object({
    aircraft: z.array(AircraftItemSchema).optional(),
    airport: z.array(AirportItemSchema).optional(),
    flightSchedule: z.array(FlightScheduleItemSchema).optional(),
    crew: z.array(CrewItemSchema).optional(),
    weather: z.array(WeatherItemSchema).optional(),
    system: z.array(SystemItemSchema).optional(),
    abnormalEvents: z.array(AbnormalEventSchema).optional(),
  })
  .strict()

const PartialCategoriesSchema = z
  .object({
    aircraft: z.array(AircraftItemSchema).optional(),
    airport: z.array(AirportItemSchema).optional(),
    flightSchedule: z.array(FlightScheduleItemSchema).optional(),
    crew: z.array(CrewItemSchema).optional(),
    weather: z.array(WeatherItemSchema).optional(),
    system: z.array(SystemItemSchema).optional(),
    abnormalEvents: z.array(AbnormalEventSchema).optional(),
  })
  .strict()

function validateActivatedCategories(
  categories: z.infer<typeof CategoriesSchema> | z.infer<typeof PartialCategoriesSchema>,
  ctx: z.RefinementCtx
) {
  for (const [categoryName, items] of Object.entries(categories)) {
    if (Array.isArray(items) && items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${categoryName} cannot be an empty activated category`,
        path: ['categories', categoryName],
      })
    }
  }
}

function validateCategoryDueTimes(
  categories: z.infer<typeof CategoriesSchema> | z.infer<typeof PartialCategoriesSchema>,
  handoverDate: string,
  ctx: z.RefinementCtx
) {
  for (const [categoryName, items] of Object.entries(categories)) {
    if (!Array.isArray(items)) {
      continue
    }

    items.forEach((item, index) => {
      validateDueTimeWindow(item.dueTime, handoverDate, ctx, [
        'categories',
        categoryName,
        index,
        'dueTime',
      ])
    })
  }
}

export const CreateHandoverSchema = z
  .object({
    // BR-01: mandatory handover fields
    handoverDate: DateOnlyString,
    shift: ShiftEnum,
    overallPriority: PriorityEnum,
    handedToId: EntityIdSchema.optional(),
    generalRemarks: z.string().max(5000).optional(),
    nextShiftActions: z.string().max(5000).optional(),
    categories: CategoriesSchema.default({}),
  })
  .strict()
  .superRefine((data, ctx) => {
    // BR-13: activated categories cannot be submitted as empty arrays
    validateActivatedCategories(data.categories, ctx)

    // BR-14: dueTime must be future-dated and within 72 hours of handoverDate
    validateCategoryDueTimes(data.categories, data.handoverDate, ctx)
  })

export const UpdateHandoverSchema = z
  .object({
    handoverDate: DateOnlyString.optional(),
    shift: ShiftEnum.optional(),
    handedToId: EntityIdSchema.nullable().optional(),
    overallPriority: PriorityEnum.optional(),
    overallStatus: ItemStatusEnum.optional(),
    generalRemarks: z.string().max(5000).optional(),
    nextShiftActions: z.string().max(5000).optional(),
    categories: PartialCategoriesSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.categories) {
      // BR-13: activated categories cannot be submitted as empty arrays
      validateActivatedCategories(data.categories, ctx)
    }

    if (data.handoverDate && data.categories) {
      // BR-14: validate updated dueTime values against the updated handoverDate
      validateCategoryDueTimes(data.categories, data.handoverDate, ctx)
    }
  })

export type HandoverCategoriesInput = z.infer<typeof CategoriesSchema>
export type PartialHandoverCategoriesInput = z.infer<typeof PartialCategoriesSchema>
export type CreateHandoverInput = z.infer<typeof CreateHandoverSchema>
export type UpdateHandoverInput = z.infer<typeof UpdateHandoverSchema>
