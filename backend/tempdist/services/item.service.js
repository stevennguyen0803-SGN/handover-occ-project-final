"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.parseCreateItemPayload = parseCreateItemPayload;
exports.parseUpdateItemPayload = parseUpdateItemPayload;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const service_error_1 = require("../lib/service-error");
const item_schema_1 = require("../schemas/item.schema");
const item_status_transition_schema_1 = require("../schemas/item-status-transition.schema");
const shared_schema_1 = require("../schemas/shared.schema");
const audit_service_1 = require("./audit.service");
const ITEM_CATEGORY_CONFIG = {
    aircraft: {
        schemaKey: 'aircraft',
        modelName: 'AircraftItem',
    },
    airport: {
        schemaKey: 'airport',
        modelName: 'AirportItem',
    },
    'flight-schedule': {
        schemaKey: 'flightSchedule',
        modelName: 'FlightScheduleItem',
    },
    crew: {
        schemaKey: 'crew',
        modelName: 'CrewItem',
    },
    weather: {
        schemaKey: 'weather',
        modelName: 'WeatherItem',
    },
    system: {
        schemaKey: 'system',
        modelName: 'SystemItem',
    },
    'abnormal-events': {
        schemaKey: 'abnormalEvents',
        modelName: 'AbnormalEvent',
    },
};
function getCategoryConfig(category) {
    return ITEM_CATEGORY_CONFIG[category];
}
function getItemDelegate(db, category) {
    const client = db;
    switch (category) {
        case 'aircraft':
            return client.aircraftItem;
        case 'airport':
            return client.airportItem;
        case 'flight-schedule':
            return client.flightScheduleItem;
        case 'crew':
            return client.crewItem;
        case 'weather':
            return client.weatherItem;
        case 'system':
            return client.systemItem;
        case 'abnormal-events':
            return client.abnormalEvent;
    }
}
function normalizeNullablePatch(input) {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === null ? undefined : value]));
}
function normalizeItemDataForPersistence(input) {
    return Object.fromEntries(Object.entries(input)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
        if (key === 'dueTime') {
            return [key, value ? new Date(value) : null];
        }
        return [key, value];
    }));
}
function formatDateOnly(value) {
    return value.toISOString().slice(0, 10);
}
function normalizeDateTime(value) {
    return value ? value.toISOString() : null;
}
function buildValidationFailure(details) {
    throw new service_error_1.ServiceError(400, 'VALIDATION_FAILED', 'Validation failed', {
        fieldErrors: details,
        formErrors: [],
    });
}
function assertDueTimeWindow(dueTime, handoverDate) {
    const errors = (0, shared_schema_1.getDueTimeWindowErrors)(dueTime, formatDateOnly(handoverDate));
    if (errors.length > 0) {
        buildValidationFailure({
            dueTime: errors,
        });
    }
}
async function getAccessibleHandover(handoverId, user) {
    const handover = await prisma_1.prisma.handover.findFirst({
        where: {
            id: handoverId,
        },
        select: {
            id: true,
            preparedById: true,
            handoverDate: true,
        },
    });
    if (!handover) {
        throw new service_error_1.ServiceError(404, 'NOT_FOUND', 'Handover not found');
    }
    if (user.role === client_1.UserRole.OCC_STAFF && handover.preparedById !== user.id) {
        throw new service_error_1.ServiceError(403, 'FORBIDDEN', 'You do not have access to this handover');
    }
    return handover;
}
async function ensureItemExists(category, handoverId, itemId) {
    const item = (await getItemDelegate(prisma_1.prisma, category).findFirst({
        where: {
            id: itemId,
            handoverId,
        },
    }));
    if (!item) {
        throw new service_error_1.ServiceError(404, 'NOT_FOUND', 'Item not found');
    }
    return item;
}
function buildCreateValidationSchema(category) {
    const schemaKey = getCategoryConfig(category).schemaKey;
    return item_schema_1.CategoryItemSchemas[schemaKey];
}
function getUpdateSchema(category) {
    const schemaKey = getCategoryConfig(category).schemaKey;
    return item_schema_1.CategoryItemUpdateSchemas[schemaKey];
}
function getValidatableItemInput(category, item) {
    switch (category) {
        case 'aircraft':
            return {
                registration: item.registration,
                type: item.type ?? undefined,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                flightsAffected: item.flightsAffected ?? undefined,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'airport':
            return {
                airport: item.airport,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                flightsAffected: item.flightsAffected ?? undefined,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'flight-schedule':
            return {
                flightNumber: item.flightNumber,
                route: item.route ?? undefined,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'crew':
            return {
                crewId: item.crewId ?? undefined,
                crewName: item.crewName ?? undefined,
                role: item.role ?? undefined,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                flightsAffected: item.flightsAffected ?? undefined,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'weather':
            return {
                affectedArea: item.affectedArea,
                weatherType: item.weatherType,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                flightsAffected: item.flightsAffected ?? undefined,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'system':
            return {
                systemName: item.systemName,
                issue: item.issue,
                status: item.status,
                priority: item.priority,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
        case 'abnormal-events':
            return {
                eventType: item.eventType,
                description: item.description,
                flightsAffected: item.flightsAffected ?? undefined,
                notificationRef: item.notificationRef ?? undefined,
                status: item.status,
                priority: item.priority,
                ownerId: item.ownerId ?? undefined,
                dueTime: item.dueTime?.toISOString(),
                remarks: item.remarks ?? undefined,
            };
    }
}
function getItemAuditSnapshot(category, item) {
    return getValidatableItemInput(category, item);
}
function serializeItem(category, item) {
    return {
        category,
        id: item.id,
        handoverId: item.handoverId,
        status: item.status,
        priority: item.priority,
        ownerId: item.ownerId,
        dueTime: normalizeDateTime(item.dueTime),
        remarks: item.remarks,
        resolvedAt: normalizeDateTime(item.resolvedAt),
        deletedAt: normalizeDateTime(item.deletedAt),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        ...getCategorySpecificPayload(category, item),
    };
}
function getCategorySpecificPayload(category, item) {
    switch (category) {
        case 'aircraft':
            return {
                registration: item.registration,
                type: item.type,
                issue: item.issue,
                flightsAffected: item.flightsAffected,
            };
        case 'airport':
            return {
                airport: item.airport,
                issue: item.issue,
                flightsAffected: item.flightsAffected,
            };
        case 'flight-schedule':
            return {
                flightNumber: item.flightNumber,
                route: item.route,
                issue: item.issue,
            };
        case 'crew':
            return {
                crewId: item.crewId,
                crewName: item.crewName,
                role: item.role,
                issue: item.issue,
                flightsAffected: item.flightsAffected,
            };
        case 'weather':
            return {
                affectedArea: item.affectedArea,
                weatherType: item.weatherType,
                issue: item.issue,
                flightsAffected: item.flightsAffected,
            };
        case 'system':
            return {
                systemName: item.systemName,
                issue: item.issue,
            };
        case 'abnormal-events':
            return {
                eventType: item.eventType,
                description: item.description,
                flightsAffected: item.flightsAffected,
                notificationRef: item.notificationRef,
            };
    }
}
function assertResolvedItemMutability(existingItem, input) {
    if (existingItem.status !== client_1.ItemStatus.Resolved) {
        return;
    }
    const disallowedKeys = Object.keys(input).filter((key) => {
        if (key === 'remarks') {
            return false;
        }
        if (key === 'status' && input.status === existingItem.status) {
            return false;
        }
        return true;
    });
    if (disallowedKeys.length > 0) {
        throw new service_error_1.ServiceError(409, 'ITEM_RESOLVED_IMMUTABLE', 'Resolved items can only update remarks', {
            fields: disallowedKeys,
        });
    }
}
function assertValidStatusTransition(existingStatus, nextStatus) {
    if (existingStatus === nextStatus) {
        return;
    }
    const transition = item_status_transition_schema_1.ItemStatusTransitionSchema.safeParse({
        fromStatus: existingStatus,
        toStatus: nextStatus,
    });
    if (!transition.success) {
        throw new service_error_1.ServiceError(400, 'STATUS_TRANSITION_INVALID', 'Status transition is not allowed', {
            fromStatus: existingStatus,
            toStatus: nextStatus,
        });
    }
}
function buildMergedItemInput(category, existingItem, patch) {
    return {
        ...getValidatableItemInput(category, existingItem),
        ...normalizeNullablePatch(patch),
    };
}
async function createItem(handoverId, category, input, user) {
    const handover = await getAccessibleHandover(handoverId, user);
    const createSchema = buildCreateValidationSchema(category);
    const validInput = createSchema.parse(input);
    assertDueTimeWindow(validInput.dueTime, handover.handoverDate);
    const initialStatus = (validInput.status ?? client_1.ItemStatus.Open);
    return prisma_1.prisma.$transaction(async (tx) => {
        const createdItem = (await getItemDelegate(tx, category).create({
            data: {
                handoverId,
                ...normalizeItemDataForPersistence(validInput),
                ...(initialStatus === client_1.ItemStatus.Resolved
                    ? { resolvedAt: new Date() }
                    : {}),
            },
        }));
        await (0, audit_service_1.writeAuditLog)({
            db: tx,
            handoverId,
            userId: user.id,
            action: client_1.AuditAction.CREATED,
            targetModel: getCategoryConfig(category).modelName,
            targetId: createdItem.id,
            newValue: getItemAuditSnapshot(category, createdItem),
        });
        return serializeItem(category, createdItem);
    });
}
async function updateItem(handoverId, category, itemId, input, user) {
    const handover = await getAccessibleHandover(handoverId, user);
    const existingItem = await ensureItemExists(category, handoverId, itemId);
    if (existingItem.status === client_1.ItemStatus.Resolved &&
        typeof input.status === 'string' &&
        input.status !== existingItem.status) {
        assertValidStatusTransition(existingItem.status, input.status);
    }
    assertResolvedItemMutability(existingItem, input);
    const mergedItem = buildMergedItemInput(category, existingItem, input);
    const createSchema = buildCreateValidationSchema(category);
    const validMergedItem = createSchema.parse(mergedItem);
    assertDueTimeWindow(validMergedItem.dueTime, handover.handoverDate);
    const nextStatus = (validMergedItem.status ?? existingItem.status);
    assertValidStatusTransition(existingItem.status, nextStatus);
    const previousSnapshot = getItemAuditSnapshot(category, existingItem);
    const nextSnapshot = validMergedItem;
    const changes = (0, audit_service_1.buildChangedFields)(previousSnapshot, nextSnapshot);
    return prisma_1.prisma.$transaction(async (tx) => {
        const updatedItem = (await getItemDelegate(tx, category).update({
            where: {
                id: itemId,
            },
            data: {
                ...normalizeItemDataForPersistence(normalizeNullablePatch(input)),
                ...(input.status !== undefined
                    ? {
                        resolvedAt: nextStatus === client_1.ItemStatus.Resolved ? new Date() : null,
                    }
                    : {}),
            },
        }));
        if (changes.oldValue || changes.newValue) {
            await (0, audit_service_1.writeAuditLog)({
                db: tx,
                handoverId,
                userId: user.id,
                action: input.status !== undefined && input.status !== existingItem.status
                    ? client_1.AuditAction.STATUS_CHANGED
                    : client_1.AuditAction.UPDATED,
                targetModel: getCategoryConfig(category).modelName,
                targetId: updatedItem.id,
                oldValue: changes.oldValue,
                newValue: changes.newValue,
            });
        }
        return serializeItem(category, updatedItem);
    });
}
async function deleteItem(handoverId, category, itemId, user) {
    await getAccessibleHandover(handoverId, user);
    await ensureItemExists(category, handoverId, itemId);
    return prisma_1.prisma.$transaction(async (tx) => {
        const deletedAt = new Date();
        const deletedItem = (await getItemDelegate(tx, category).update({
            where: {
                id: itemId,
            },
            data: {
                deletedAt,
            },
        }));
        await (0, audit_service_1.writeAuditLog)({
            db: tx,
            handoverId,
            userId: user.id,
            action: client_1.AuditAction.DELETED,
            targetModel: getCategoryConfig(category).modelName,
            targetId: deletedItem.id,
            oldValue: {
                deletedAt: null,
            },
            newValue: {
                deletedAt: deletedAt.toISOString(),
            },
        });
        return {
            id: deletedItem.id,
            deletedAt: deletedAt.toISOString(),
        };
    });
}
function parseCreateItemPayload(category, payload) {
    return buildCreateValidationSchema(category).parse(payload);
}
function parseUpdateItemPayload(category, payload) {
    return getUpdateSchema(category).parse(payload);
}
