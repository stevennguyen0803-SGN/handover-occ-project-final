"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemStatusTransitionSchema = void 0;
const zod_1 = require("zod");
const shared_schema_1 = require("./shared.schema");
const VALID_TRANSITIONS = {
    Open: ['Monitoring', 'Resolved'],
    Monitoring: ['Open', 'Resolved'],
    Resolved: [],
};
exports.ItemStatusTransitionSchema = zod_1.z
    .object({
    fromStatus: shared_schema_1.ItemStatusEnum,
    toStatus: shared_schema_1.ItemStatusEnum,
    remarks: zod_1.z.string().max(2000).optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    // BR-05: only allow status transitions from the approved matrix
    const allowedTransitions = VALID_TRANSITIONS[data.fromStatus];
    if (!allowedTransitions.includes(data.toStatus)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'STATUS_TRANSITION_INVALID',
            path: ['toStatus'],
        });
    }
});
