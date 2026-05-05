/**
 * Next.js middleware that authorises every request using the Edge-safe
 * `authConfig` from `auth.config.example.ts`. Drop into your Next.js
 * frontend at `middleware.ts`.
 *
 * The matcher excludes static assets and the NextAuth route itself
 * (which would otherwise loop). Adjust `matcher` if you serve other
 * unauthenticated public assets.
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config.example';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
};
