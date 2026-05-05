import { z } from 'zod'

/**
 * Self-service profile fields a user can change about themselves.
 *
 * Email and role are intentionally excluded — those require admin action.
 */
export const ProfileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(120, 'Name is too long')
      .optional(),
  })
  .strict()

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>

/**
 * Password change requires the user to confirm their current password
 * before a new one can be set, mirroring BR-19.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(256, 'New password is too long'),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must differ from the current password',
    path: ['newPassword'],
  })

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
