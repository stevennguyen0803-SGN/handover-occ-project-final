import { createHmac } from 'crypto'

import type { UserRole } from '@/lib/types'

export interface BackendAuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

const HEADER_NAMES = {
  id: 'x-occ-auth-user-id',
  name: 'x-occ-auth-user-name',
  email: 'x-occ-auth-user-email',
  role: 'x-occ-auth-user-role',
  timestamp: 'x-occ-auth-timestamp',
  signature: 'x-occ-auth-signature',
} as const

function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET (or AUTH_SECRET) must be set to sign backend auth headers'
    )
  }
  return secret
}

/**
 * Build the X-OCC-AUTH-* headers a backend Express endpoint expects.
 * Mirrors `backend/src/lib/auth-bridge.ts` exactly.
 */
export function createBackendAuthHeaders(
  user: BackendAuthUser,
  timestamp: string = Date.now().toString()
): Record<string, string> {
  const secret = getAuthSecret()
  const payload = [
    user.id,
    user.name,
    user.email,
    user.role,
    timestamp,
  ].join(':')
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')

  return {
    [HEADER_NAMES.id]: user.id,
    [HEADER_NAMES.name]: user.name,
    [HEADER_NAMES.email]: user.email,
    [HEADER_NAMES.role]: user.role,
    [HEADER_NAMES.timestamp]: timestamp,
    [HEADER_NAMES.signature]: signature,
  }
}
