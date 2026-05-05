import { createHmac, timingSafeEqual } from 'node:crypto'

import { UserRole } from '@prisma/client'
import type { Request } from 'express'

import type { AuthenticatedUser } from '../middleware/auth.middleware'

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

const backendAuthHeaderNames = {
  id: 'x-occ-auth-user-id',
  name: 'x-occ-auth-user-name',
  email: 'x-occ-auth-user-email',
  role: 'x-occ-auth-user-role',
  timestamp: 'x-occ-auth-timestamp',
  signature: 'x-occ-auth-signature',
} as const

function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole)
}

function getAuthSecret(): string | null {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET

  return typeof secret === 'string' && secret.length > 0 ? secret : null
}

function buildBackendAuthPayload(
  user: AuthenticatedUser,
  timestamp: string
): string {
  return [
    user.id,
    user.name,
    user.email,
    user.role,
    timestamp,
  ].join(':')
}

function buildBackendAuthSignature(
  user: AuthenticatedUser,
  timestamp: string,
  secret: string
): string {
  return createHmac('sha256', secret)
    .update(buildBackendAuthPayload(user, timestamp))
    .digest('base64url')
}

function hasValidClockSkew(timestamp: string): boolean {
  const parsedTimestamp = Number(timestamp)

  if (!Number.isFinite(parsedTimestamp)) {
    return false
  }

  return Math.abs(Date.now() - parsedTimestamp) <= MAX_CLOCK_SKEW_MS
}

function signaturesMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  if (expectedBuffer.length !== actualBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, actualBuffer)
}

export function createBackendAuthHeaders(
  user: AuthenticatedUser,
  timestamp: string = Date.now().toString()
): Record<string, string> {
  const secret = getAuthSecret()

  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET (or AUTH_SECRET) must be set to sign backend auth headers'
    )
  }

  const signature = buildBackendAuthSignature(user, timestamp, secret)

  return {
    [backendAuthHeaderNames.id]: user.id,
    [backendAuthHeaderNames.name]: user.name,
    [backendAuthHeaderNames.email]: user.email,
    [backendAuthHeaderNames.role]: user.role,
    [backendAuthHeaderNames.timestamp]: timestamp,
    [backendAuthHeaderNames.signature]: signature,
  }
}

export type ExtractedAuthenticatedRequest = {
  user: AuthenticatedUser
  /** Numeric epoch-ms timestamp the frontend signed the request with. */
  signedAt: number
}

export function extractAuthenticatedUserFromRequest(
  req: Pick<Request, 'header'>
): ExtractedAuthenticatedRequest | null {
  const secret = getAuthSecret()

  if (!secret) {
    return null
  }

  const id = req.header(backendAuthHeaderNames.id)
  const name = req.header(backendAuthHeaderNames.name)
  const email = req.header(backendAuthHeaderNames.email)
  const role = req.header(backendAuthHeaderNames.role)
  const timestamp = req.header(backendAuthHeaderNames.timestamp)
  const signature = req.header(backendAuthHeaderNames.signature)

  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string' ||
    typeof timestamp !== 'string' ||
    typeof signature !== 'string' ||
    !isUserRole(role) ||
    !hasValidClockSkew(timestamp)
  ) {
    return null
  }

  const user: AuthenticatedUser = {
    id,
    name,
    email,
    role,
  }

  const expectedSignature = buildBackendAuthSignature(user, timestamp, secret)

  if (!signaturesMatch(expectedSignature, signature)) {
    return null
  }

  return { user, signedAt: Number(timestamp) }
}
