"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
function addDeletedAtFilter(args) {
    const nextArgs = args ?? {};
    const nextWhere = nextArgs.where && typeof nextArgs.where === 'object'
        ? { ...nextArgs.where, deletedAt: null }
        : { deletedAt: null };
    return {
        ...nextArgs,
        where: nextWhere,
    };
}
function createPrismaClient() {
    const prisma = new client_1.PrismaClient();
    return prisma.$extends({
        query: {
            handover: createSoftDeleteQueries(),
            aircraftItem: createSoftDeleteQueries(),
            airportItem: createSoftDeleteQueries(),
            flightScheduleItem: createSoftDeleteQueries(),
            crewItem: createSoftDeleteQueries(),
            weatherItem: createSoftDeleteQueries(),
            systemItem: createSoftDeleteQueries(),
            abnormalEvent: createSoftDeleteQueries(),
        },
    });
}
function createSoftDeleteQueries() {
    return {
        findMany({ args, query }) {
            return query(addDeletedAtFilter(args));
        },
        findFirst({ args, query }) {
            return query(addDeletedAtFilter(args));
        },
        count({ args, query }) {
            return query(addDeletedAtFilter(args));
        },
        aggregate({ args, query }) {
            return query(addDeletedAtFilter(args));
        },
    };
}
exports.prisma = globalThis.__occPrisma__ ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalThis.__occPrisma__ = exports.prisma;
}
