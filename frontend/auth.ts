/**
 * Full NextAuth.js v5 (Auth.js) wiring with the Prisma adapter and a
 * credentials provider.
 *
 * Required env:
 *   - AUTH_SECRET  (NextAuth secret — `openssl rand -base64 32`)
 *   - DATABASE_URL (PostgreSQL connection — for the Prisma adapter)
 *
 * BR-12: roles flow from the `User.role` column. `passwordHash` is
 * compared with bcrypt; nullable means the user is SSO-only and the
 * credentials provider returns `null` (Auth.js then surfaces
 * `CredentialsSignin`).
 */
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { authConfig } from './auth.config'
import { prisma } from './lib/prisma'

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // The adapter types between @auth/prisma-adapter and next-auth's vendored
  // @auth/core get duplicated under deep node_modules nesting and produce a
  // spurious mismatch on `role` (which we add via next-auth.d.ts module
  // augmentation). Cast through `NextAuthConfig['adapter']` to keep type
  // safety on every other field.
  adapter: PrismaAdapter(prisma) as NextAuthConfig['adapter'],
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = SignInSchema.safeParse(raw)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash || !user.isActive) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
