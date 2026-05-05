/**
 * Next.js middleware that authorises every request using the Edge-safe
 * `authConfig` from `auth.config.ts`.
 */
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
}
