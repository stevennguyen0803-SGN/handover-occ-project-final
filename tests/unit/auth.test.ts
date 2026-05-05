import { UserRole } from '@prisma/client'
import type { Request, Response } from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('../../backend/src/lib/prisma', () => ({
  prisma: prismaMock,
}))

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
    vi.clearAllMocks()
    prismaMock.user.findUnique.mockResolvedValue({
      isActive: true,
      sessionsRevokedAt: null,
    })
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

  it('attaches a signed authenticated user to the backend request', async () => {
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

    await attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toEqual(signedUser)
    expect(next).toHaveBeenCalledOnce()
  })

  it('rejects tampered backend auth headers', async () => {
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

    await attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })

  it('rejects requests signed before sessionsRevokedAt cut-off', async () => {
    const signedUser = {
      id: 'user-1',
      name: 'Shift Supervisor',
      email: 'supervisor@example.com',
      role: UserRole.SUPERVISOR,
    }
    // Signed 10 seconds ago
    const signedAt = Date.now() - 10_000
    const headers = createBackendAuthHeaders(signedUser, signedAt.toString())

    // Sessions were revoked 5 seconds ago — newer than the request signature.
    prismaMock.user.findUnique.mockResolvedValueOnce({
      isActive: true,
      sessionsRevokedAt: new Date(Date.now() - 5_000),
    })

    const request = createRequestWithHeaders(headers)
    const next = vi.fn()

    await attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })

  it('rejects requests from inactive users', async () => {
    const signedUser = {
      id: 'user-1',
      name: 'Inactive User',
      email: 'inactive@example.com',
      role: UserRole.OCC_STAFF,
    }
    const headers = createBackendAuthHeaders(signedUser, Date.now().toString())

    prismaMock.user.findUnique.mockResolvedValueOnce({
      isActive: false,
      sessionsRevokedAt: null,
    })

    const request = createRequestWithHeaders(headers)
    const next = vi.fn()

    await attachAuthenticatedUser(request, {} as Response, next)

    expect(request.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })
})
