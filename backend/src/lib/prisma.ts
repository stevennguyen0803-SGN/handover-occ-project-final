import { PrismaClient } from '@prisma/client'

type SoftDeleteArgs = {
  where?: Record<string, unknown>
} & Record<string, unknown>

function addDeletedAtFilter(args: SoftDeleteArgs | undefined): SoftDeleteArgs {
  const nextArgs = args ?? {}
  const nextWhere =
    nextArgs.where && typeof nextArgs.where === 'object'
      ? { ...nextArgs.where, deletedAt: null }
      : { deletedAt: null }

  return {
    ...nextArgs,
    where: nextWhere,
  }
}

function createPrismaClient() {
  const prisma = new PrismaClient()

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
  })
}

function createSoftDeleteQueries() {
  return {
    findMany({ args, query }: { args?: SoftDeleteArgs; query: (args: SoftDeleteArgs) => Promise<unknown> }) {
      return query(addDeletedAtFilter(args))
    },
    findFirst({ args, query }: { args?: SoftDeleteArgs; query: (args: SoftDeleteArgs) => Promise<unknown> }) {
      return query(addDeletedAtFilter(args))
    },
    count({ args, query }: { args?: SoftDeleteArgs; query: (args: SoftDeleteArgs) => Promise<unknown> }) {
      return query(addDeletedAtFilter(args))
    },
    aggregate({ args, query }: { args?: SoftDeleteArgs; query: (args: SoftDeleteArgs) => Promise<unknown> }) {
      return query(addDeletedAtFilter(args))
    },
  }
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>

declare global {
  // eslint-disable-next-line no-var
  var __occPrisma__: ExtendedPrismaClient | undefined
}

export const prisma: ExtendedPrismaClient =
  globalThis.__occPrisma__ ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__occPrisma__ = prisma
}
