import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('../../../backend/src/lib/prisma', () => ({
  prisma: prismaMock,
}))

import {
  changeSelfPassword,
  createUser,
  deactivateUser,
  getSelfProfile,
  listUsers,
  updateSelfProfile,
  updateUser,
} from '../../../backend/src/services/users.service'
import { isServiceError } from '../../../backend/src/lib/service-error'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'a@example.com',
    name: 'Alice',
    role: 'OCC_STAFF',
    isActive: true,
    passwordHash: '$2b$10$placeholder',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getSelfProfile
// ---------------------------------------------------------------------------

describe('getSelfProfile', () => {
  it('returns the user profile without passwordHash', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    const profile = await getSelfProfile('user-1')

    expect(profile).toEqual({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Alice',
      role: 'OCC_STAFF',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    })
    expect(profile).not.toHaveProperty('passwordHash')
  })

  it('throws NOT_FOUND when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(getSelfProfile('missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    })
  })
})

// ---------------------------------------------------------------------------
// updateSelfProfile
// ---------------------------------------------------------------------------

describe('updateSelfProfile', () => {
  it('updates name and returns the new profile', async () => {
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ name: 'Alice B.' }))

    const profile = await updateSelfProfile('user-1', { name: 'Alice B.' })

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Alice B.' },
    })
    expect(profile.name).toBe('Alice B.')
  })

  it('returns existing profile when patch is empty', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    const profile = await updateSelfProfile('user-1', {})

    expect(prismaMock.user.update).not.toHaveBeenCalled()
    expect(profile.id).toBe('user-1')
  })
})

// ---------------------------------------------------------------------------
// changeSelfPassword
// ---------------------------------------------------------------------------

describe('changeSelfPassword', () => {
  it('updates passwordHash when current password is correct and new password differs', async () => {
    const hash = await bcrypt.hash('oldpass123', 4)
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: hash,
      isActive: true,
    })
    prismaMock.user.update.mockResolvedValueOnce(makeUser())

    await changeSelfPassword('user-1', 'oldpass123', 'newpass456')

    expect(prismaMock.user.update).toHaveBeenCalledTimes(1)
    const call = prismaMock.user.update.mock.calls[0]![0] as {
      data: { passwordHash: string }
    }
    expect(call.data.passwordHash).not.toBe(hash)
    expect(call.data.passwordHash.startsWith('$2')).toBe(true)
  })

  it('throws WRONG_CURRENT when current password is incorrect', async () => {
    const hash = await bcrypt.hash('actualpass', 4)
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: hash,
      isActive: true,
    })

    await expect(
      changeSelfPassword('user-1', 'wrongpass', 'newpass456')
    ).rejects.toMatchObject({ statusCode: 400, code: 'WRONG_CURRENT' })

    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })

  it('throws SAME_AS_CURRENT when new password equals current', async () => {
    const hash = await bcrypt.hash('samepass123', 4)
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: hash,
      isActive: true,
    })

    await expect(
      changeSelfPassword('user-1', 'samepass123', 'samepass123')
    ).rejects.toMatchObject({ statusCode: 400, code: 'SAME_AS_CURRENT' })
  })

  it('throws SSO_ONLY_USER when passwordHash is null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: null,
      isActive: true,
    })

    await expect(
      changeSelfPassword('user-1', 'anything', 'newpass456')
    ).rejects.toMatchObject({ statusCode: 400, code: 'SSO_ONLY_USER' })
  })

  it('throws INACTIVE_USER when user is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      passwordHash: 'x',
      isActive: false,
    })

    await expect(
      changeSelfPassword('user-1', 'anything', 'newpass456')
    ).rejects.toMatchObject({ statusCode: 403, code: 'INACTIVE_USER' })
  })

  it('throws NOT_FOUND when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(
      changeSelfPassword('missing', 'a', 'newpass456')
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
  })
})

// ---------------------------------------------------------------------------
// listUsers / createUser / updateUser / deactivateUser
// ---------------------------------------------------------------------------

describe('listUsers', () => {
  it('returns all users sorted by isActive then name', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      makeUser({ id: 'u1', name: 'Alice', isActive: true }),
      makeUser({ id: 'u2', name: 'Bob', isActive: false }),
    ])

    const users = await listUsers()

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    })
    expect(users).toHaveLength(2)
    expect(users[0]!.id).toBe('u1')
  })
})

describe('createUser', () => {
  it('creates a user with a bcrypt-hashed password', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.user.create.mockImplementationOnce(
      async ({ data }: { data: Record<string, unknown> }) =>
        makeUser({ ...data, id: 'u-new' })
    )

    const user = await createUser({
      email: 'new@example.com',
      name: 'New',
      role: 'OCC_STAFF',
      password: 'plain12345',
    })

    expect(user.id).toBe('u-new')
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1)
    const call = prismaMock.user.create.mock.calls[0]![0] as {
      data: { passwordHash: string }
    }
    expect(call.data.passwordHash.startsWith('$2')).toBe(true)
    expect(call.data.passwordHash).not.toBe('plain12345')
  })

  it('throws EMAIL_TAKEN when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    await expect(
      createUser({
        email: 'taken@example.com',
        name: 'X',
        role: 'OCC_STAFF',
        password: 'plain12345',
      })
    ).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_TAKEN' })
  })
})

describe('updateUser', () => {
  it('updates only provided fields', async () => {
    prismaMock.user.update.mockResolvedValueOnce(
      makeUser({ name: 'Bob', role: 'SUPERVISOR' })
    )

    const user = await updateUser('u-1', { name: 'Bob', role: 'SUPERVISOR' })

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { name: 'Bob', role: 'SUPERVISOR' },
    })
    expect(user.name).toBe('Bob')
    expect(user.role).toBe('SUPERVISOR')
  })

  it('returns existing user without updating when patch is empty', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    const user = await updateUser('u-1', {})

    expect(prismaMock.user.update).not.toHaveBeenCalled()
    expect(user.id).toBe('user-1')
  })

  it('throws NOT_FOUND for empty patch on missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(updateUser('missing', {})).rejects.toSatisfy((e) =>
      isServiceError(e) && e.code === 'NOT_FOUND'
    )
  })
})

describe('deactivateUser', () => {
  it('soft-deletes by setting isActive=false', async () => {
    prismaMock.user.update.mockResolvedValueOnce(
      makeUser({ isActive: false })
    )

    const user = await deactivateUser('u-1')

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u-1' },
      data: { isActive: false },
    })
    expect(user.isActive).toBe(false)
  })
})
