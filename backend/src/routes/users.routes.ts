import { Router, type Request, type Response } from 'express'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

import { isServiceError } from '../lib/service-error'
import { requireRole } from '../middleware/role.middleware'
import {
  ChangePasswordSchema,
  ProfileUpdateSchema,
} from '../schemas/users.schema'
import { EntityIdSchema } from '../schemas/shared.schema'
import {
  changeSelfPassword,
  createUser,
  deactivateUser,
  getSelfProfile,
  listRecipients,
  listUsers,
  revokeSelfSessions,
  updateSelfProfile,
  updateUser,
} from '../services/users.service'

const router = Router()

const ROLE_VALUES = ['OCC_STAFF', 'SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'] as const
const RoleEnum = z.enum(ROLE_VALUES)

const CreateUserSchema = z
  .object({
    email: z.string().trim().email('Invalid email').max(254),
    name: z.string().trim().min(1, 'Name is required').max(120),
    role: RoleEnum,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(256),
  })
  .strict()

const AdminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    role: RoleEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

const userIdParamSchema = z.object({
  id: EntityIdSchema,
})

function buildValidationErrorPayload(error: z.ZodError) {
  return {
    error: 'VALIDATION_FAILED',
    message: 'Invalid request body',
    details: error.flatten(),
  }
}

function sendErrorResponse(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    return res.status(400).json(buildValidationErrorPayload(error))
  }

  if (isServiceError(error)) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
      details: error.details,
    })
  }

  console.error(error)

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    details: {},
  })
}

const ALL_AUTHENTICATED_ROLES = [
  UserRole.OCC_STAFF,
  UserRole.SUPERVISOR,
  UserRole.MANAGEMENT_VIEWER,
  UserRole.ADMIN,
]

// -- Self-service ----------------------------------------------------------

router.get(
  '/me',
  requireRole(ALL_AUTHENTICATED_ROLES),
  async (req: Request, res) => {
    try {
      const profile = await getSelfProfile(req.user!.id)
      res.status(200).json(profile)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.patch(
  '/me',
  requireRole(ALL_AUTHENTICATED_ROLES),
  async (req: Request, res) => {
    try {
      const patch = ProfileUpdateSchema.parse(req.body ?? {})
      const profile = await updateSelfProfile(req.user!.id, patch)
      res.status(200).json(profile)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.post(
  '/me/password',
  requireRole(ALL_AUTHENTICATED_ROLES),
  async (req: Request, res) => {
    try {
      const body = ChangePasswordSchema.parse(req.body ?? {})
      await changeSelfPassword(
        req.user!.id,
        body.currentPassword,
        body.newPassword
      )
      res.status(204).send()
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.post(
  '/me/sessions/revoke',
  requireRole(ALL_AUTHENTICATED_ROLES),
  async (req: Request, res) => {
    try {
      await revokeSelfSessions(req.user!.id)
      res.status(204).send()
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

// -- Recipients lookup (BR-12: any authenticated role) ---------------------

router.get(
  '/recipients',
  requireRole(ALL_AUTHENTICATED_ROLES),
  async (_req: Request, res) => {
    try {
      const recipients = await listRecipients()
      res.status(200).json({ data: recipients })
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

// -- Admin: directory + lifecycle ------------------------------------------

router.get(
  '/',
  requireRole([UserRole.ADMIN]),
  async (_req: Request, res) => {
    try {
      const users = await listUsers()
      res.status(200).json({ data: users })
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.post(
  '/',
  requireRole([UserRole.ADMIN]),
  async (req: Request, res) => {
    try {
      const body = CreateUserSchema.parse(req.body ?? {})
      const user = await createUser(body)
      res.status(201).json(user)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.patch(
  '/:id',
  requireRole([UserRole.ADMIN]),
  async (req: Request<{ id: string }>, res) => {
    try {
      const params = userIdParamSchema.parse(req.params)
      const patch = AdminUpdateUserSchema.parse(req.body ?? {})
      const user = await updateUser(params.id, patch)
      res.status(200).json(user)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

router.delete(
  '/:id',
  requireRole([UserRole.ADMIN]),
  async (req: Request<{ id: string }>, res) => {
    try {
      const params = userIdParamSchema.parse(req.params)

      if (req.user!.id === params.id) {
        return res.status(400).json({
          error: 'CANNOT_DEACTIVATE_SELF',
          message: 'You cannot deactivate your own account',
          details: {},
        })
      }

      const user = await deactivateUser(params.id)
      res.status(200).json(user)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

export { router as usersRouter }
