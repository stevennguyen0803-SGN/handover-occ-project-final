"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handoverRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const service_error_1 = require("../lib/service-error");
const role_middleware_1 = require("../middleware/role.middleware");
const handover_schema_1 = require("../schemas/handover.schema");
const shared_schema_1 = require("../schemas/shared.schema");
const handover_service_1 = require("../services/handover.service");
const item_service_1 = require("../services/item.service");
const router = (0, express_1.Router)();
exports.handoverRouter = router;
const itemCategoryValues = [
    'aircraft',
    'airport',
    'flight-schedule',
    'crew',
    'weather',
    'system',
    'abnormal-events',
];
const handoverIdParamSchema = zod_1.z.object({
    id: shared_schema_1.EntityIdSchema,
});
const handoverItemParamsSchema = zod_1.z.object({
    id: shared_schema_1.EntityIdSchema,
    category: zod_1.z.enum(itemCategoryValues),
});
const handoverItemMutationParamsSchema = handoverItemParamsSchema.extend({
    itemId: shared_schema_1.EntityIdSchema,
});
function buildValidationErrorPayload(error) {
    const issuePaths = error.issues.map((issue) => issue.path.join('.'));
    const errorCode = issuePaths.some((path) => path.endsWith('ownerId'))
        ? 'OWNER_REQUIRED'
        : issuePaths.some((path) => path.startsWith('categories.'))
            ? 'CATEGORY_ACTIVATED_BUT_EMPTY'
            : 'VALIDATION_FAILED';
    return {
        statusCode: 400,
        body: {
            error: errorCode,
            message: 'Validation failed',
            details: error.flatten(),
        },
    };
}
function sendErrorResponse(res, error) {
    if (error instanceof zod_1.z.ZodError) {
        const payload = buildValidationErrorPayload(error);
        return res.status(payload.statusCode).json(payload.body);
    }
    if ((0, service_error_1.isServiceError)(error)) {
        return res.status(error.statusCode).json({
            error: error.code,
            message: error.message,
            details: error.details,
        });
    }
    console.error(error);
    return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: {},
    });
}
router.get('/', (0, role_middleware_1.requireRole)([
    client_1.UserRole.OCC_STAFF,
    client_1.UserRole.SUPERVISOR,
    client_1.UserRole.MANAGEMENT_VIEWER,
    client_1.UserRole.ADMIN,
]), async (req, res) => {
    try {
        const data = await (0, handover_service_1.listHandovers)(req.user, req.query);
        res.status(200).json(data);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.post('/', (0, role_middleware_1.requireRole)([client_1.UserRole.OCC_STAFF, client_1.UserRole.SUPERVISOR, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const parsedPayload = handover_schema_1.CreateHandoverSchema.parse(req.body);
        const handover = await (0, handover_service_1.createHandover)(parsedPayload, req.user);
        res.status(201).json(handover);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.get('/:id', (0, role_middleware_1.requireRole)([
    client_1.UserRole.OCC_STAFF,
    client_1.UserRole.SUPERVISOR,
    client_1.UserRole.MANAGEMENT_VIEWER,
    client_1.UserRole.ADMIN,
]), async (req, res) => {
    try {
        const params = handoverIdParamSchema.parse(req.params);
        const handover = await (0, handover_service_1.getHandoverDetail)(params.id, req.user);
        res.status(200).json(handover);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.patch('/:id', (0, role_middleware_1.requireRole)([client_1.UserRole.OCC_STAFF, client_1.UserRole.SUPERVISOR, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const params = handoverIdParamSchema.parse(req.params);
        const payload = handover_schema_1.UpdateHandoverSchema.parse(req.body);
        const handover = await (0, handover_service_1.updateHandover)(params.id, payload, req.user);
        res.status(200).json(handover);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.post('/:id/items/:category', (0, role_middleware_1.requireRole)([client_1.UserRole.OCC_STAFF, client_1.UserRole.SUPERVISOR, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const params = handoverItemParamsSchema.parse(req.params);
        const payload = (0, item_service_1.parseCreateItemPayload)(params.category, req.body);
        const item = await (0, item_service_1.createItem)(params.id, params.category, payload, req.user);
        res.status(201).json(item);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.patch('/:id/items/:category/:itemId', (0, role_middleware_1.requireRole)([client_1.UserRole.OCC_STAFF, client_1.UserRole.SUPERVISOR, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const params = handoverItemMutationParamsSchema.parse(req.params);
        const payload = (0, item_service_1.parseUpdateItemPayload)(params.category, req.body);
        const item = await (0, item_service_1.updateItem)(params.id, params.category, params.itemId, payload, req.user);
        res.status(200).json(item);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
router.delete('/:id/items/:category/:itemId', (0, role_middleware_1.requireRole)([client_1.UserRole.SUPERVISOR, client_1.UserRole.ADMIN]), async (req, res) => {
    try {
        const params = handoverItemMutationParamsSchema.parse(req.params);
        const deletedItem = await (0, item_service_1.deleteItem)(params.id, params.category, params.itemId, req.user);
        res.status(200).json(deletedItem);
    }
    catch (error) {
        sendErrorResponse(res, error);
    }
});
