import 'server-only'

import { auth } from '@/auth'

import {
  createBackendAuthHeaders,
  type BackendAuthUser,
} from './backend-auth'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'

export class BackendApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'BackendApiError'
    this.status = status
    this.payload = payload
  }
}

async function getAuthenticatedUser(): Promise<BackendAuthUser | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return null
  }
  return {
    id: session.user.id,
    name: session.user.name ?? session.user.email,
    email: session.user.email,
    role: session.user.role,
  }
}

interface BackendRequestInit extends Omit<RequestInit, 'headers' | 'body'> {
  body?: unknown
  headers?: Record<string, string>
  /** Set true for endpoints that don't require auth (e.g. /health). */
  unauthenticated?: boolean
}

/**
 * Server-side fetch wrapper for the Express backend. Automatically signs
 * every request with the X-OCC-AUTH-* headers derived from the current
 * NextAuth session.
 */
export async function backendFetch<T>(
  path: string,
  init: BackendRequestInit = {}
): Promise<T> {
  const { body, headers: extraHeaders, unauthenticated, ...rest } = init
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...extraHeaders,
  }

  if (!unauthenticated) {
    const user = await getAuthenticatedUser()
    if (!user) {
      throw new BackendApiError('Not authenticated', 401, null)
    }
    Object.assign(headers, createBackendAuthHeaders(user))
  }

  const url = new URL(path, BACKEND_URL)
  const res = await fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  const raw = await res.text()
  const payload = raw ? safeParseJson(raw) : null

  if (!res.ok) {
    const message = extractErrorMessage(payload, res)
    throw new BackendApiError(message, res.status, payload)
  }

  return payload as T
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function extractErrorMessage(payload: unknown, res: Response): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return `Backend ${res.status} ${res.statusText}`
}
