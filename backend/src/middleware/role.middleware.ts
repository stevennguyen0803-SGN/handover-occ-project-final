import { type NextFunction, type Request, type Response } from 'express'
import { type UserRole } from '@prisma/client'

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication is required',
        details: {},
      })
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have access to this resource',
        details: {},
      })
    }

    next()
  }
}
