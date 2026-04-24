import { type NextFunction, type Request, type Response } from 'express'
import { UserRole } from '@prisma/client'

import { extractAuthenticatedUserFromRequest } from '../lib/auth-bridge'

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export function attachAuthenticatedUser(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authenticatedUser = extractAuthenticatedUserFromRequest(req)

  if (authenticatedUser) {
    req.user = authenticatedUser
  }

  next()
}
