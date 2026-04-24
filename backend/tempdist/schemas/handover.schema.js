"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHandoverSchema = exports.CreateHandoverSchema = void 0;
const zod_1 = require("zod");
const item_schema_1 = require("./item.schema");
const shared_schema_1 = require("./shared.schema");
const CategoriesSchema = zod_1.z
    .object({
    aircraft: zod_1.z.array(item_schema_1.AircraftItemSchema).optional(),
    airport: zod_1.z.array(item_schema_1.AirportItemSchema).optional(),
    flightSchedule: zod_1.z.array(item_schema_1.FlightScheduleItemSchema).optional(),
    crew: zod_1.z.array(item_schema_1.CrewItemSchema).optional(),
    weather: zod_1.z.array(item_schema_1.WeatherItemSchema).optional(),
    system: zod_1.z.array(item_schema_1.SystemItemSchema).optional(),
    abnormalEvents: zod_1.z.array(item_schema_1.AbnormalEventSchema).optional(),
})
    .strict();
const PartialCategoriesSchema = zod_1.z
    .object({
    aircraft: zod_1.z.array(item_schema_1.AircraftItemSchema).optional(),
    airport: zod_1.z.array(item_schema_1.AirportItemSchema).optional(),
    flightSchedule: zod_1.z.array(item_schema_1.FlightScheduleItemSchema).optional(),
    crew: zod_1.z.array(item_schema_1.CrewItemSchema).optional(),
    weather: zod_1.z.array(item_schema_1.WeatherItemSchema).optional(),
    system: zod_1.z.array(item_schema_1.SystemItemSchema).optional(),
    abnormalEvents: zod_1.z.array(item_schema_1.AbnormalEventSchema).optional(),
})
    .strict();
function validateActivatedCategories(categories, ctx) {
    for (const [categoryName, items] of Object.entries(categories)) {
        if (Array.isArray(items) && items.length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `${categoryName} cannot be an empty activated category`,
                path: ['categories', categoryName],
            });
        }
    }
}
function validateCategoryDueTimes(categories, handoverDate, ctx) {
    for (const [categoryName, items] of Object.entries(categories)) {
        if (!Array.isArray(items)) {
            continue;
        }
        items.forEach((item, index) => {
            (0, shared_schema_1.validateDueTimeWindow)(item.dueTime, handoverDate, ctx, [
                'categories',
                categoryName,
                index,
                'dueTime',
            ]);
        });
    }
}
exports.CreateHandoverSchema = zod_1.z
    .object({
    // BR-01: mandatory handover fields
    handoverDate: shared_schema_1.DateOnlyString,
    shift: shared_schema_1.ShiftEnum,
    overallPriority: shared_schema_1.PriorityEnum,
    handedToId: shared_schema_1.EntityIdSchema.optional(),
    generalRemarks: zod_1.z.string().max(5000).optional(),
    nextShiftActions: zod_1.z.string().max(5000).optional(),
    categories: CategoriesSchema.default({}),
})
    .strict()
    .superRefine((data, ctx) => {
    // BR-13: activated categories cannot be submitted as empty arrays
    validateActivatedCategories(data.categories, ctx);
    // BR-14: dueTime must be future-dated and within 72 hours of handoverDate
    validateCategoryDueTimes(data.categories, data.handoverDate, ctx);
});
exports.UpdateHandoverSchema = zod_1.z
    .object({
    handoverDate: shared_schema_1.DateOnlyString.optional(),
    shift: shared_schema_1.ShiftEnum.optional(),
    handedToId: shared_schema_1.EntityIdSchema.nullable().optional(),
    overallPriority: shared_schema_1.PriorityEnum.optional(),
    overallStatus: shared_schema_1.ItemStatusEnum.optional(),
    generalRemarks: zod_1.z.string().max(5000).optional(),
    nextShiftActions: zod_1.z.string().max(5000).optional(),
    categories: PartialCategoriesSchema.optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    if (data.categories) {
        // BR-13: activated categories cannot be submitted as empty arrays
        validateActivatedCategories(data.categories, ctx);
    }
    if (data.handoverDate && data.categories) {
        // BR-14: validate updated dueTime values against the updated handoverDate
        validateCategoryDueTimes(data.categories, data.handoverDate, ctx);
    }
});
