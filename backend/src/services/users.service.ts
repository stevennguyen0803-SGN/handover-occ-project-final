import bcrypt from 'bcryptjs'
import type { User, UserRole } from '@prisma/client'

import { prisma } from '../lib/prisma'
import { ServiceError } from '../lib/service-error'

const BCRYPT_ROUNDS = 10

export type SelfProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function toSelfProfile(user: User): SelfProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function getSelfProfile(userId: string): Promise<SelfProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new ServiceError(404, 'NOT_FOUND', 'User not found')
  }
  return toSelfProfile(user)
}

export async function updateSelfProfile(
  userId: string,
  patch: { name?: string | undefined }
): Promise<SelfProfile> {
  const data: { name?: string } = {}
  if (patch.name !== undefined) {
    data.name = patch.name
  }

  if (Object.keys(data).length === 0) {
    return getSelfProfile(userId)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  })

  return toSelfProfile(user)
}

export type ChangePasswordError =
  | 'WRONG_CURRENT'
  | 'SAME_AS_CURRENT'
  | 'SSO_ONLY_USER'

export async function changeSelfPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, isActive: true },
  })

  if (!user) {
    throw new ServiceError(404, 'NOT_FOUND', 'User not found')
  }

  if (!user.isActive) {
    throw new ServiceError(403, 'INACTIVE_USER', 'User is inactive')
  }

  if (!user.passwordHash) {
    // SSO-only accounts never had a password set; refuse and surface a
    // distinct error code so the UI can guide the user to their IdP.
    throw new ServiceError(
      400,
      'SSO_ONLY_USER',
      'This account is managed by SSO and has no local password'
    )
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) {
    throw new ServiceError(400, 'WRONG_CURRENT', 'Current password is incorrect')
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash)
  if (sameAsCurrent) {
    throw new ServiceError(
      400,
      'SAME_AS_CURRENT',
      'New password must differ from the current password'
    )
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })
}

export type UserSummary = {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function listUsers(): Promise<UserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })
  return users.map(toSelfProfile)
}

export type CreateUserInput = {
  email: string
  name: string
  role: UserRole
  password: string
}

export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })
  if (existing) {
    throw new ServiceError(409, 'EMAIL_TAKEN', 'Email is already in use')
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  })

  return toSelfProfile(user)
}

export type UpdateUserInput = {
  name?: string | undefined
  role?: UserRole | undefined
  isActive?: boolean | undefined
}

export async function updateUser(
  userId: string,
  patch: UpdateUserInput
): Promise<UserSummary> {
  const data: { name?: string; role?: UserRole; isActive?: boolean } = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.role !== undefined) data.role = patch.role
  if (patch.isActive !== undefined) data.isActive = patch.isActive

  if (Object.keys(data).length === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new ServiceError(404, 'NOT_FOUND', 'User not found')
    }
    return toSelfProfile(user)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  })

  return toSelfProfile(user)
}

/**
 * Soft-delete: flip `isActive` to false. Per BR-22, never hard-delete users.
 */
export async function deactivateUser(userId: string): Promise<UserSummary> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  })

  return toSelfProfile(user)
}
