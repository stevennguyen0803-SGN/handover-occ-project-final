import { type NextFunction, type Request, type Response } from 'express'
import { UserRole } from '@prisma/client'

import { extractAuthenticatedUserFromRequest } from '../lib/auth-bridge'
import { prisma } from '../lib/prisma'

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

/**
 * Validates the signed `X-OCC-AUTH-*` headers, then asks the database
 * whether the user has revoked their sessions after the request was
 * signed. If so, the request is treated as anonymous (req.user undefined)
 * which means downstream `requireRole` middleware rejects it with 403.
 */
export async function attachAuthenticatedUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const extracted = extractAuthenticatedUserFromRequest(req)

  if (!extracted) {
    next()
    return
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: extracted.user.id },
      select: { isActive: true, sessionsRevokedAt: true },
    })

    if (!dbUser || !dbUser.isActive) {
      next()
      return
    }

    if (
      dbUser.sessionsRevokedAt &&
      extracted.signedAt < dbUser.sessionsRevokedAt.getTime()
    ) {
      next()
      return
    }

    req.user = extracted.user
    next()
  } catch (error) {
    next(error)
  }
}
