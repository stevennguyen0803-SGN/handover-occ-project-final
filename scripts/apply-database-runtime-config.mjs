function parsePositiveInteger(value) {
  if (value === undefined) {
    return null
  }

  const trimmed = String(value).trim()

  if (trimmed.length === 0) {
    return null
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid database runtime override "${trimmed}". Expected a positive integer.`
    )
  }

  const parsed = Number(trimmed)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid database runtime override "${trimmed}". Expected a positive integer.`
    )
  }

  return parsed
}

export function applyDatabaseRuntimeConfig(env = process.env) {
  const databaseUrl = env.DATABASE_URL

  if (!databaseUrl) {
    return {
      changed: false,
      connectionLimit: null,
      poolTimeout: null,
    }
  }

  const connectionLimit = parsePositiveInteger(env.DATABASE_CONNECTION_LIMIT)
  const poolTimeout = parsePositiveInteger(env.DATABASE_POOL_TIMEOUT)

  if (connectionLimit === null && poolTimeout === null) {
    return {
      changed: false,
      connectionLimit: null,
      poolTimeout: null,
    }
  }

  const nextUrl = new URL(databaseUrl)
  let changed = false

  if (
    connectionLimit !== null &&
    nextUrl.searchParams.get('connection_limit') !== String(connectionLimit)
  ) {
    nextUrl.searchParams.set('connection_limit', String(connectionLimit))
    changed = true
  }

  if (
    poolTimeout !== null &&
    nextUrl.searchParams.get('pool_timeout') !== String(poolTimeout)
  ) {
    nextUrl.searchParams.set('pool_timeout', String(poolTimeout))
    changed = true
  }

  if (changed) {
    env.DATABASE_URL = nextUrl.toString()
  }

  return {
    changed,
    connectionLimit,
    poolTimeout,
  }
}

export function logDatabaseRuntimeConfig(result, log = console.log) {
  if (!result.changed) {
    return
  }

  const appliedOverrides = []

  if (result.connectionLimit !== null) {
    appliedOverrides.push(`connection_limit=${result.connectionLimit}`)
  }

  if (result.poolTimeout !== null) {
    appliedOverrides.push(`pool_timeout=${result.poolTimeout}`)
  }

  log(
    `[db-runtime] Applied DATABASE_URL override(s): ${appliedOverrides.join(', ')}`
  )
}
