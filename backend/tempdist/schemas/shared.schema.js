"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseOperationalItemSchema = exports.ItemStatusEnum = exports.PriorityEnum = exports.ShiftEnum = exports.DateTimeString = exports.DateOnlyString = exports.EntityIdSchema = void 0;
exports.validateOwnerRequiredForOpenHighPriorityItem = validateOwnerRequiredForOpenHighPriorityItem;
exports.validateDueTimeSyntax = validateDueTimeSyntax;
exports.validateDueTimeWindow = validateDueTimeWindow;
exports.getDueTimeWindowErrors = getDueTimeWindowErrors;
const zod_1 = require("zod");
exports.EntityIdSchema = zod_1.z
    .string()
    .trim()
    .min(1, 'Identifier is required')
    .max(255, 'Identifier is too long');
exports.DateOnlyString = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
exports.DateTimeString = zod_1.z.string().datetime({ offset: true });
exports.ShiftEnum = zod_1.z.enum(['Morning', 'Afternoon', 'Night']);
exports.PriorityEnum = zod_1.z.enum(['Low', 'Normal', 'High', 'Critical']);
exports.ItemStatusEnum = zod_1.z.enum(['Open', 'Monitoring', 'Resolved']);
exports.BaseOperationalItemSchema = zod_1.z.object({
    status: exports.ItemStatusEnum.default('Open'),
    priority: exports.PriorityEnum.default('Normal'),
    ownerId: exports.EntityIdSchema.optional(),
    dueTime: exports.DateTimeString.optional(),
    remarks: zod_1.z.string().max(2000).optional(),
});
function validateOwnerRequiredForOpenHighPriorityItem(data, ctx) {
    if (data.status === 'Open' &&
        (data.priority === 'High' || data.priority === 'Critical') &&
        !data.ownerId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'ownerId is required for open High/Critical items',
            path: ['ownerId'],
        });
    }
}
function validateDueTimeSyntax(dueTime, ctx) {
    if (dueTime && Number.isNaN(Date.parse(dueTime))) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'dueTime must be a valid ISO datetime',
            path: ['dueTime'],
        });
    }
}
function validateDueTimeWindow(dueTime, handoverDate, ctx, path) {
    const errors = getDueTimeWindowErrors(dueTime, handoverDate);
    errors.forEach((message) => {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message,
            path,
        });
    });
}
function getDueTimeWindowErrors(dueTime, handoverDate) {
    if (!dueTime) {
        return [];
    }
    const dueAt = new Date(dueTime);
    if (Number.isNaN(dueAt.getTime())) {
        return [];
    }
    const handoverAt = new Date(`${handoverDate}T00:00:00.000Z`);
    const maxDueAt = new Date(handoverAt.getTime() + 72 * 60 * 60 * 1000);
    const errors = [];
    if (dueAt <= new Date()) {
        errors.push('dueTime must be in the future');
    }
    if (dueAt > maxDueAt) {
        errors.push('dueTime must be within 72 hours of handoverDate');
    }
    return errors;
}
