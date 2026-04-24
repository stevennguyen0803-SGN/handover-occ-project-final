"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryItemUpdateSchemas = exports.CategoryItemSchemas = exports.UpdateAbnormalEventSchema = exports.AbnormalEventSchema = exports.UpdateSystemItemSchema = exports.SystemItemSchema = exports.UpdateWeatherItemSchema = exports.WeatherItemSchema = exports.UpdateCrewItemSchema = exports.CrewItemSchema = exports.UpdateFlightScheduleItemSchema = exports.FlightScheduleItemSchema = exports.UpdateAirportItemSchema = exports.AirportItemSchema = exports.UpdateAircraftItemSchema = exports.AircraftItemSchema = void 0;
const zod_1 = require("zod");
const shared_schema_1 = require("./shared.schema");
function withOperationalItemRules(schema) {
    return schema.superRefine((data, ctx) => {
        const operationalItem = data;
        // BR-06: ownerId required for open High/Critical items
        (0, shared_schema_1.validateOwnerRequiredForOpenHighPriorityItem)(operationalItem, ctx);
        // BR-14: dueTime must be a valid ISO datetime
        (0, shared_schema_1.validateDueTimeSyntax)(operationalItem.dueTime, ctx);
    });
}
const AircraftItemFields = {
    registration: zod_1.z.string().min(2).max(20),
    type: zod_1.z.string().max(50).optional(),
    issue: zod_1.z.string().min(5).max(2000),
    flightsAffected: zod_1.z.string().max(500).optional(),
};
const AirportItemFields = {
    airport: zod_1.z.string().length(4),
    issue: zod_1.z.string().min(5).max(2000),
    flightsAffected: zod_1.z.string().max(500).optional(),
};
const FlightScheduleItemFields = {
    flightNumber: zod_1.z.string().min(2).max(20),
    route: zod_1.z.string().max(20).optional(),
    issue: zod_1.z.string().min(5).max(2000),
};
const CrewItemFields = {
    crewId: zod_1.z.string().max(50).optional(),
    crewName: zod_1.z.string().max(100).optional(),
    role: zod_1.z.string().max(50).optional(),
    issue: zod_1.z.string().min(5).max(2000),
    flightsAffected: zod_1.z.string().max(500).optional(),
};
const WeatherItemFields = {
    affectedArea: zod_1.z.string().min(2).max(50),
    weatherType: zod_1.z.string().min(2).max(100),
    issue: zod_1.z.string().min(5).max(2000),
    flightsAffected: zod_1.z.string().max(500).optional(),
};
const SystemItemFields = {
    systemName: zod_1.z.string().min(2).max(100),
    issue: zod_1.z.string().min(5).max(2000),
};
const AbnormalEventFields = {
    eventType: zod_1.z.string().min(2).max(50),
    description: zod_1.z.string().min(20).max(4000),
    flightsAffected: zod_1.z.string().max(500).optional(),
    notificationRef: zod_1.z.string().max(100).optional(),
};
const BaseOperationalItemUpdateSchema = zod_1.z
    .object({
    status: shared_schema_1.ItemStatusEnum.optional(),
    priority: shared_schema_1.PriorityEnum.optional(),
    ownerId: shared_schema_1.EntityIdSchema.nullable().optional(),
    dueTime: shared_schema_1.DateTimeString.nullable().optional(),
    remarks: zod_1.z.string().max(2000).nullable().optional(),
})
    .strict();
exports.AircraftItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(AircraftItemFields).strict());
exports.UpdateAircraftItemSchema = BaseOperationalItemUpdateSchema.extend({
    registration: AircraftItemFields.registration.optional(),
    type: zod_1.z.string().max(50).nullable().optional(),
    issue: AircraftItemFields.issue.optional(),
    flightsAffected: zod_1.z.string().max(500).nullable().optional(),
}).strict();
exports.AirportItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(AirportItemFields).strict());
exports.UpdateAirportItemSchema = BaseOperationalItemUpdateSchema.extend({
    airport: AirportItemFields.airport.optional(),
    issue: AirportItemFields.issue.optional(),
    flightsAffected: zod_1.z.string().max(500).nullable().optional(),
}).strict();
exports.FlightScheduleItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(FlightScheduleItemFields).strict());
exports.UpdateFlightScheduleItemSchema = BaseOperationalItemUpdateSchema.extend({
    flightNumber: FlightScheduleItemFields.flightNumber.optional(),
    route: zod_1.z.string().max(20).nullable().optional(),
    issue: FlightScheduleItemFields.issue.optional(),
}).strict();
exports.CrewItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(CrewItemFields).strict());
exports.UpdateCrewItemSchema = BaseOperationalItemUpdateSchema.extend({
    crewId: zod_1.z.string().max(50).nullable().optional(),
    crewName: zod_1.z.string().max(100).nullable().optional(),
    role: zod_1.z.string().max(50).nullable().optional(),
    issue: CrewItemFields.issue.optional(),
    flightsAffected: zod_1.z.string().max(500).nullable().optional(),
}).strict();
exports.WeatherItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(WeatherItemFields).strict());
exports.UpdateWeatherItemSchema = BaseOperationalItemUpdateSchema.extend({
    affectedArea: WeatherItemFields.affectedArea.optional(),
    weatherType: WeatherItemFields.weatherType.optional(),
    issue: WeatherItemFields.issue.optional(),
    flightsAffected: zod_1.z.string().max(500).nullable().optional(),
}).strict();
exports.SystemItemSchema = withOperationalItemRules(shared_schema_1.BaseOperationalItemSchema.extend(SystemItemFields).strict());
exports.UpdateSystemItemSchema = BaseOperationalItemUpdateSchema.extend({
    systemName: SystemItemFields.systemName.optional(),
    issue: SystemItemFields.issue.optional(),
}).strict();
exports.AbnormalEventSchema = shared_schema_1.BaseOperationalItemSchema.extend(AbnormalEventFields)
    .strict()
    .superRefine((data, ctx) => {
    // BR-06: ownerId required for open High/Critical items
    (0, shared_schema_1.validateOwnerRequiredForOpenHighPriorityItem)(data, ctx);
    // BR-08: abnormal events must satisfy conditional required fields
    if ((data.eventType === 'AOG' || data.eventType === 'Diversion') &&
        !data.flightsAffected) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'flightsAffected is required for AOG or Diversion events',
            path: ['flightsAffected'],
        });
    }
    if (data.priority === 'Critical' && !data.notificationRef) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'notificationRef is required for Critical abnormal events',
            path: ['notificationRef'],
        });
    }
    // BR-14: dueTime must be a valid ISO datetime
    (0, shared_schema_1.validateDueTimeSyntax)(data.dueTime, ctx);
});
exports.UpdateAbnormalEventSchema = BaseOperationalItemUpdateSchema.extend({
    eventType: AbnormalEventFields.eventType.optional(),
    description: AbnormalEventFields.description.optional(),
    flightsAffected: zod_1.z.string().max(500).nullable().optional(),
    notificationRef: zod_1.z.string().max(100).nullable().optional(),
}).strict();
exports.CategoryItemSchemas = {
    aircraft: exports.AircraftItemSchema,
    airport: exports.AirportItemSchema,
    flightSchedule: exports.FlightScheduleItemSchema,
    crew: exports.CrewItemSchema,
    weather: exports.WeatherItemSchema,
    system: exports.SystemItemSchema,
    abnormalEvents: exports.AbnormalEventSchema,
};
exports.CategoryItemUpdateSchemas = {
    aircraft: exports.UpdateAircraftItemSchema,
    airport: exports.UpdateAirportItemSchema,
    flightSchedule: exports.UpdateFlightScheduleItemSchema,
    crew: exports.UpdateCrewItemSchema,
    weather: exports.UpdateWeatherItemSchema,
    system: exports.UpdateSystemItemSchema,
    abnormalEvents: exports.UpdateAbnormalEventSchema,
};
