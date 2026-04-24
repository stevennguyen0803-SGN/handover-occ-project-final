"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandover = createHandover;
exports.listHandovers = listHandovers;
exports.getHandoverDetail = getHandoverDetail;
exports.updateHandover = updateHandover;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const service_error_1 = require("../lib/service-error");
const audit_service_1 = require("./audit.service");
const HANDOVER_RELATION_SELECT = {
    preparedBy: {
        select: {
            id: true,
            name: true,
        },
    },
    handedTo: {
        select: {
            id: true,
            name: true,
        },
    },
};
const HANDOVER_LIST_INCLUDE = {
    ...HANDOVER_RELATION_SELECT,
    aircraftItems: {
        select: {
            status: true,
        },
    },
    airportItems: {
        select: {
            status: true,
        },
    },
    flightScheduleItems: {
        select: {
            status: true,
        },
    },
    crewItems: {
        select: {
            status: true,
        },
    },
    weatherItems: {
        select: {
            status: true,
        },
    },
    systemItems: {
        select: {
            status: true,
        },
    },
    abnormalEvents: {
        select: {
            status: true,
        },
    },
};
const HANDOVER_DETAIL_INCLUDE = {
    ...HANDOVER_RELATION_SELECT,
    aircraftItems: true,
    airportItems: true,
    flightScheduleItems: true,
    crewItems: true,
    weatherItems: true,
    systemItems: true,
    abnormalEvents: true,
    auditLogs: {
        orderBy: {
            createdAt: 'asc',
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
    acknowledgments: {
        orderBy: {
            acknowledgedAt: 'asc',
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
};
const CATEGORY_RELATION_MAP = {
    aircraft: 'aircraftItems',
    airport: 'airportItems',
    flightSchedule: 'flightScheduleItems',
    crew: 'crewItems',
    weather: 'weatherItems',
    system: 'systemItems',
    abnormalEvents: 'abnormalEvents',
};
const STATUS_VALUES = Object.values(client_1.ItemStatus);
const PRIORITY_VALUES = Object.values(client_1.Priority);
const SHIFT_VALUES = Object.values(client_1.Shift);
const ALLOWED_SORT_FIELDS = new Set([
    'createdAt',
    'updatedAt',
    'handoverDate',
    'overallPriority',
    'overallStatus',
    'referenceId',
    'shift',
]);
function toDateOnly(value) {
    return new Date(`${value}T00:00:00.000Z`);
}
function formatDateOnly(value) {
    return value.toISOString().slice(0, 10);
}
function normalizeDateTime(value) {
    return value ? value.toISOString() : null;
}
function parseEnumFilter(rawValue, allowedValues) {
    if (!rawValue) {
        return [];
    }
    return rawValue
        .split(',')
        .map((value) => value.trim())
        .filter((value) => allowedValues.includes(value));
}
function parsePositiveInt(value, fallback) {
    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        return fallback;
    }
    return parsedValue;
}
function getValidatedSortOrder(sortOrder) {
    return sortOrder === 'asc' ? 'asc' : 'desc';
}
function getValidatedSortField(sortBy) {
    if (!sortBy || !ALLOWED_SORT_FIELDS.has(sortBy)) {
        return null;
    }
    return sortBy;
}
function coerceDateTimeField(value) {
    return value ? new Date(value) : undefined;
}
function mapCategoriesForCreate(categories) {
    const mappedData = {};
    for (const [categoryKey, relationKey] of Object.entries(CATEGORY_RELATION_MAP)) {
        const items = categories[categoryKey];
        if (!items || items.length === 0) {
            continue;
        }
        mappedData[relationKey] = {
            create: items.map((item) => ({
                ...item,
                dueTime: coerceDateTimeField(item.dueTime),
            })),
        };
    }
    return mappedData;
}
function getItemCounts(handover) {
    const counts = {
        open: 0,
        monitoring: 0,
        resolved: 0,
    };
    const items = [
        ...handover.aircraftItems,
        ...handover.airportItems,
        ...handover.flightScheduleItems,
        ...handover.crewItems,
        ...handover.weatherItems,
        ...handover.systemItems,
        ...handover.abnormalEvents,
    ];
    items.forEach((item) => {
        if (item.status === client_1.ItemStatus.Open) {
            counts.open += 1;
        }
        if (item.status === client_1.ItemStatus.Monitoring) {
            counts.monitoring += 1;
        }
        if (item.status === client_1.ItemStatus.Resolved) {
            counts.resolved += 1;
        }
    });
    return counts;
}
function serializeCategoryItems(items) {
    return items.map((item) => ({
        ...item,
        dueTime: normalizeDateTime(item.dueTime),
        resolvedAt: normalizeDateTime(item.resolvedAt),
        deletedAt: normalizeDateTime(item.deletedAt),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    }));
}
function buildSearchFilter(search) {
    return {
        OR: [
            { referenceId: { contains: search, mode: 'insensitive' } },
            { generalRemarks: { contains: search, mode: 'insensitive' } },
            { nextShiftActions: { contains: search, mode: 'insensitive' } },
            {
                aircraftItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { registration: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                airportItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { airport: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                flightScheduleItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { flightNumber: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                crewItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { crewName: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                weatherItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { affectedArea: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                systemItems: {
                    some: {
                        OR: [
                            { issue: { contains: search, mode: 'insensitive' } },
                            { systemName: { contains: search, mode: 'insensitive' } },
                            { remarks: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
            {
                abnormalEvents: {
                    some: {
                        OR: [
                            { description: { contains: search, mode: 'insensitive' } },
                            { eventType: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            },
        ],
    };
}
function buildListWhereClause(user, filters) {
    const andClauses = [];
    const status = parseEnumFilter(filters.status, STATUS_VALUES);
    const priority = parseEnumFilter(filters.priority, PRIORITY_VALUES);
    const search = filters.search?.trim();
    if (user.role === client_1.UserRole.OCC_STAFF) {
        andClauses.push({ preparedById: user.id });
    }
    if (status.length > 0) {
        andClauses.push({
            overallStatus: {
                in: status,
            },
        });
    }
    if (priority.length > 0) {
        andClauses.push({
            overallPriority: {
                in: priority,
            },
        });
    }
    if (filters.shift && SHIFT_VALUES.includes(filters.shift)) {
        andClauses.push({
            shift: filters.shift,
        });
    }
    if (filters.from || filters.to) {
        andClauses.push({
            handoverDate: {
                ...(filters.from ? { gte: toDateOnly(filters.from) } : {}),
                ...(filters.to ? { lte: toDateOnly(filters.to) } : {}),
            },
        });
    }
    if (search) {
        andClauses.push(buildSearchFilter(search));
    }
    return andClauses.length > 0 ? { AND: andClauses } : {};
}
function buildOrderByClause(filters) {
    const sortField = getValidatedSortField(filters.sortBy);
    const sortOrder = getValidatedSortOrder(filters.sortOrder);
    if (!sortField) {
        return [
            { overallPriority: 'desc' },
            { createdAt: 'desc' },
        ];
    }
    return [
        { [sortField]: sortOrder },
        { createdAt: 'desc' },
    ];
}
async function ensureActiveUser(userId) {
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            id: userId,
            isActive: true,
        },
    });
    if (!user) {
        throw new service_error_1.ServiceError(400, 'VALIDATION_FAILED', 'User must be active', {
            userId,
        });
    }
    return user;
}
async function generateReferenceId(db) {
    await db.$executeRawUnsafe('SELECT pg_advisory_xact_lock(2026042301)');
    await db.$executeRawUnsafe("CREATE SEQUENCE IF NOT EXISTS handover_reference_seq START WITH 1 INCREMENT BY 1");
    const maxSuffixResult = await db.$queryRawUnsafe('SELECT COALESCE(MAX(CAST(RIGHT("referenceId", 6) AS INTEGER)), 0) AS "maxSuffix" FROM "Handover"');
    const sequenceState = await db.$queryRawUnsafe("SELECT last_value, is_called FROM handover_reference_seq");
    const maxSuffix = Number(maxSuffixResult[0]?.maxSuffix ?? 0);
    const lastValue = Number(sequenceState[0]?.last_value ?? 0);
    const isCalled = sequenceState[0]?.is_called ?? false;
    if (maxSuffix > lastValue || (!isCalled && maxSuffix > 0)) {
        await db.$queryRawUnsafe(`SELECT setval('handover_reference_seq', ${maxSuffix}, true)`);
    }
    const result = await db.$queryRawUnsafe("SELECT nextval('handover_reference_seq') AS value");
    const sequenceValue = result[0]?.value;
    if (sequenceValue == null) {
        throw new service_error_1.ServiceError(500, 'REFERENCE_ID_SEQUENCE_FAILED', 'Failed to generate referenceId');
    }
    const year = new Date().getUTCFullYear();
    return `HDO-${year}-${sequenceValue.toString().padStart(6, '0')}`;
}
async function getHandoverForAccessCheck(id) {
    const handover = await prisma_1.prisma.handover.findFirst({
        where: {
            id,
        },
        select: {
            id: true,
            preparedById: true,
        },
    });
    if (!handover) {
        throw new service_error_1.ServiceError(404, 'NOT_FOUND', 'Handover not found');
    }
    return handover;
}
function assertCanAccessHandover(user, preparedById) {
    if (user.role === client_1.UserRole.OCC_STAFF && preparedById !== user.id) {
        throw new service_error_1.ServiceError(403, 'FORBIDDEN', 'You do not have access to this handover');
    }
}
async function serializeHandoverDetail(handoverId) {
    const handover = await prisma_1.prisma.handover.findFirst({
        where: {
            id: handoverId,
        },
        include: HANDOVER_DETAIL_INCLUDE,
    });
    if (!handover) {
        throw new service_error_1.ServiceError(404, 'NOT_FOUND', 'Handover not found');
    }
    return {
        id: handover.id,
        referenceId: handover.referenceId,
        handoverDate: formatDateOnly(handover.handoverDate),
        shift: handover.shift,
        preparedBy: handover.preparedBy,
        handedTo: handover.handedTo,
        overallPriority: handover.overallPriority,
        overallStatus: handover.overallStatus,
        generalRemarks: handover.generalRemarks,
        nextShiftActions: handover.nextShiftActions,
        isCarriedForward: handover.isCarriedForward,
        carriedFromId: handover.carriedFromId,
        submittedAt: normalizeDateTime(handover.submittedAt),
        acknowledgedAt: normalizeDateTime(handover.acknowledgedAt),
        categories: {
            aircraft: serializeCategoryItems(handover.aircraftItems),
            airport: serializeCategoryItems(handover.airportItems),
            flightSchedule: serializeCategoryItems(handover.flightScheduleItems),
            crew: serializeCategoryItems(handover.crewItems),
            weather: serializeCategoryItems(handover.weatherItems),
            system: serializeCategoryItems(handover.systemItems),
            abnormalEvents: serializeCategoryItems(handover.abnormalEvents),
        },
        auditLog: handover.auditLogs.map((auditLog) => ({
            id: auditLog.id,
            action: auditLog.action,
            targetModel: auditLog.targetModel,
            targetId: auditLog.targetId,
            user: auditLog.user,
            oldValue: auditLog.oldValue,
            newValue: auditLog.newValue,
            createdAt: auditLog.createdAt.toISOString(),
        })),
        acknowledgments: handover.acknowledgments.map((acknowledgment) => ({
            id: acknowledgment.id,
            user: acknowledgment.user,
            notes: acknowledgment.notes,
            acknowledgedAt: acknowledgment.acknowledgedAt.toISOString(),
        })),
    };
}
async function assertNoDuplicateShiftHandover(handoverDate, shift, excludeId) {
    const existingHandover = await prisma_1.prisma.handover.findFirst({
        where: {
            handoverDate: toDateOnly(handoverDate),
            shift,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
            id: true,
        },
    });
    if (existingHandover) {
        throw new service_error_1.ServiceError(409, 'DUPLICATE_SHIFT_HANDOVER', 'An active handover already exists for the selected date and shift');
    }
}
async function createHandover(input, user) {
    await ensureActiveUser(user.id);
    if (input.handedToId) {
        await ensureActiveUser(input.handedToId);
    }
    await assertNoDuplicateShiftHandover(input.handoverDate, input.shift);
    return prisma_1.prisma.$transaction(async (tx) => {
        const referenceId = await generateReferenceId(tx);
        const createdHandover = await tx.handover.create({
            data: {
                referenceId,
                handoverDate: toDateOnly(input.handoverDate),
                shift: input.shift,
                preparedById: user.id,
                overallPriority: input.overallPriority,
                ...(input.handedToId ? { handedToId: input.handedToId } : {}),
                ...(input.generalRemarks !== undefined
                    ? { generalRemarks: input.generalRemarks }
                    : {}),
                ...(input.nextShiftActions !== undefined
                    ? { nextShiftActions: input.nextShiftActions }
                    : {}),
                ...mapCategoriesForCreate(input.categories),
            },
        });
        await (0, audit_service_1.writeAuditLog)({
            db: tx,
            handoverId: createdHandover.id,
            userId: user.id,
            action: client_1.AuditAction.CREATED,
            targetModel: 'Handover',
            targetId: createdHandover.id,
            newValue: {
                referenceId: createdHandover.referenceId,
                handoverDate: formatDateOnly(createdHandover.handoverDate),
                shift: createdHandover.shift,
                overallPriority: createdHandover.overallPriority,
            },
        });
        return {
            id: createdHandover.id,
            referenceId: createdHandover.referenceId,
            createdAt: createdHandover.createdAt.toISOString(),
        };
    });
}
async function listHandovers(user, filters) {
    const page = parsePositiveInt(filters.page, 1);
    const limit = Math.min(parsePositiveInt(filters.limit, 20), 100);
    const where = buildListWhereClause(user, filters);
    const orderBy = buildOrderByClause(filters);
    const [handovers, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.handover.findMany({
            where,
            include: HANDOVER_LIST_INCLUDE,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.prisma.handover.count({
            where,
        }),
    ]);
    return {
        data: handovers.map((handover) => ({
            id: handover.id,
            referenceId: handover.referenceId,
            handoverDate: formatDateOnly(handover.handoverDate),
            shift: handover.shift,
            preparedBy: handover.preparedBy,
            handedTo: handover.handedTo,
            overallPriority: handover.overallPriority,
            overallStatus: handover.overallStatus,
            isCarriedForward: handover.isCarriedForward,
            itemCounts: getItemCounts(handover),
            createdAt: handover.createdAt.toISOString(),
            acknowledgedAt: normalizeDateTime(handover.acknowledgedAt),
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}
async function getHandoverDetail(id, user) {
    const handover = await getHandoverForAccessCheck(id);
    assertCanAccessHandover(user, handover.preparedById);
    return serializeHandoverDetail(id);
}
async function updateHandover(id, input, user) {
    const existingHandover = await prisma_1.prisma.handover.findFirst({
        where: {
            id,
        },
        include: {
            preparedBy: {
                select: {
                    id: true,
                },
            },
        },
    });
    if (!existingHandover) {
        throw new service_error_1.ServiceError(404, 'NOT_FOUND', 'Handover not found');
    }
    assertCanAccessHandover(user, existingHandover.preparedById);
    const nextHandoverDate = input.handoverDate ?? formatDateOnly(existingHandover.handoverDate);
    const nextShift = (input.shift ?? existingHandover.shift);
    if (input.handoverDate || input.shift) {
        await assertNoDuplicateShiftHandover(nextHandoverDate, nextShift, existingHandover.id);
    }
    if (input.handedToId) {
        await ensureActiveUser(input.handedToId);
    }
    const previousSnapshot = {
        handoverDate: formatDateOnly(existingHandover.handoverDate),
        shift: existingHandover.shift,
        handedToId: existingHandover.handedToId,
        overallPriority: existingHandover.overallPriority,
        overallStatus: existingHandover.overallStatus,
        generalRemarks: existingHandover.generalRemarks,
        nextShiftActions: existingHandover.nextShiftActions,
    };
    const nextSnapshot = {
        handoverDate: nextHandoverDate,
        shift: nextShift,
        handedToId: input.handedToId !== undefined ? input.handedToId : existingHandover.handedToId,
        overallPriority: input.overallPriority !== undefined
            ? input.overallPriority
            : existingHandover.overallPriority,
        overallStatus: input.overallStatus !== undefined
            ? input.overallStatus
            : existingHandover.overallStatus,
        generalRemarks: input.generalRemarks !== undefined
            ? input.generalRemarks
            : existingHandover.generalRemarks,
        nextShiftActions: input.nextShiftActions !== undefined
            ? input.nextShiftActions
            : existingHandover.nextShiftActions,
    };
    const changes = (0, audit_service_1.buildChangedFields)(previousSnapshot, nextSnapshot);
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.handover.update({
            where: {
                id,
            },
            data: {
                ...(input.handoverDate ? { handoverDate: toDateOnly(input.handoverDate) } : {}),
                ...(input.shift ? { shift: input.shift } : {}),
                ...(input.handedToId !== undefined ? { handedToId: input.handedToId } : {}),
                ...(input.overallPriority
                    ? { overallPriority: input.overallPriority }
                    : {}),
                ...(input.overallStatus
                    ? { overallStatus: input.overallStatus }
                    : {}),
                ...(input.generalRemarks !== undefined
                    ? { generalRemarks: input.generalRemarks }
                    : {}),
                ...(input.nextShiftActions !== undefined
                    ? { nextShiftActions: input.nextShiftActions }
                    : {}),
            },
        });
        if (changes.oldValue || changes.newValue) {
            await (0, audit_service_1.writeAuditLog)({
                db: tx,
                handoverId: id,
                userId: user.id,
                action: client_1.AuditAction.UPDATED,
                targetModel: 'Handover',
                targetId: id,
                oldValue: changes.oldValue,
                newValue: changes.newValue,
            });
        }
    });
    return getHandoverDetail(id, user);
}
