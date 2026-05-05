import { UserRole } from '@prisma/client'
import type { Request, Response } from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createBackendAuthHeaders } from '../../backend/src/lib/auth-bridge'
import { attachAuthenticatedUser } from '../../backend/src/middleware/auth.middleware'
import { requireRole } from '../../backend/src/middleware/role.middleware'

type MockResponse = Response & {
  statusCode?: number
  payload?: unknown
}

function createMockResponse(): MockResponse {
  const response = {
    status(code: number) {
      response.statusCode = code
      return response
    },
    json(payload: unknown) {
      response.payload = payload
      return response
    },
  }

  return response as MockResponse
}

function createRequestWithHeaders(
  headers: Record<string, string>,
  user?: Request['user']
): Request {
  return {
    header(name: string) {
      return headers[name.toLowerCase()] ?? headers[name] ?? undefined
    },
    user,
  } as Request
}

describe('auth middleware', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
  })

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET
  })

  it('blocks wrong role with 403', () => {
    const request = {
      user: {
        id: 'user-1',
        name: 'OCC Staff',
        email: 'occ.staff@example.com',
        role: UserRole.OCC_STAFF,
      },
    } as Request
    const response = createMockResponse()
    const next = vi.fn()

    requireRole([UserRole.ADMIN])(request, response, next)

    expect(response.statusCode).toBe(403)
    expect(response.payload).toEqual({
      error: 'FORBIDDEN',
      message: 'You do not have access to this resource',
      details: {},
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('attaches a signed authenticated user to the backend request', () => {
    const signedUser = {
      id: 'user-1',
      name: 'Shift Supervisor',
      email: 'supervisor@example.com',
      role: UserRole.SUPERVISOR,
    }
    const request = createRequestWithHeaders(
      createBackendAuthHeaders(signedUser, Date.now().toString())
    )
    const next = vi.fn()

    attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toEqual(signedUser)
    expect(next).toHaveBeenCalledOnce()
  })

  it('rejects tampered backend auth headers', () => {
    const signedUser = {
      id: 'user-1',
      name: 'Shift Supervisor',
      email: 'supervisor@example.com',
      role: UserRole.SUPERVISOR,
    }
    const headers = createBackendAuthHeaders(signedUser, Date.now().toString())
    const request = createRequestWithHeaders({
      ...headers,
      'x-occ-auth-user-role': UserRole.ADMIN,
    })
    const next = vi.fn()

    attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })
})
