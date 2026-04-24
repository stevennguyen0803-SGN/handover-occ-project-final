import type { AuthenticatedUser } from '../middleware/auth.middleware'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export {}
