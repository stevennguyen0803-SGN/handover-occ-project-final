import { Router, type Response } from 'express'
import { UserRole } from '@prisma/client'

import { isServiceError } from '../lib/service-error'
import { requireRole } from '../middleware/role.middleware'
import { getDashboardSummary } from '../services/dashboard.service'

const router = Router()

function sendErrorResponse(res: Response, error: unknown) {
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

router.get(
  '/summary',
  requireRole([
    UserRole.OCC_STAFF,
    UserRole.SUPERVISOR,
    UserRole.MANAGEMENT_VIEWER,
    UserRole.ADMIN,
  ]),
  async (req, res) => {
    try {
      const summary = await getDashboardSummary(req.user!)

      res.status(200).json(summary)
    } catch (error) {
      sendErrorResponse(res, error)
    }
  }
)

export { router as dashboardRouter }
