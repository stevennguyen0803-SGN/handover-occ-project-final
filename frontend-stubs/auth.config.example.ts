/**
 * Edge-safe NextAuth.js v5 (Auth.js) configuration.
 *
 * This file MUST stay free of Prisma / bcrypt / Node-only imports
 * so it can be evaluated by Next.js middleware (Edge runtime). The
 * full configuration with the Prisma adapter and credentials
 * `authorize()` lives in `auth.example.ts`.
 *
 * Drop into your Next.js frontend at `auth.config.ts`.
 */
import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from './lib/types';

/**
 * Routes that do not require an authenticated session.
 * Anything else under `/app` defaults to "authenticated only".
 */
export const PUBLIC_ROUTES: readonly string[] = ['/signin', '/forbidden', '/api/auth'];

/**
 * Route → roles allowed. Mirrors `shared/roles.md` (BR-12). Server-side
 * enforcement still happens in your Express endpoints; this matrix only
 * gates the Next.js UI surface.
 */
export const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: ReadonlyArray<UserRole> }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/audit', roles: ['SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'] },
  { prefix: '/handover/new', roles: ['OCC_STAFF', 'SUPERVISOR', 'ADMIN'] },
];

export const authConfig = {
  pages: {
    signIn: '/signin',
    error: '/signin', // surface auth errors on the sign-in page (?error=…)
  },
  session: { strategy: 'jwt' },
  callbacks: {
    /**
     * Edge-safe authorization. Returning `false` from `authorized()` causes
     * the middleware to redirect to `pages.signIn`. Returning a Response
     * lets us redirect to a custom 403 page when the user IS signed in but
     * lacks the required role.
     */
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const isPublic = PUBLIC_ROUTES.some((p) => path === p || path.startsWith(`${p}/`));
      if (isPublic) return true;

      const session = auth;
      if (!session?.user) return false; // → redirected to /signin

      const role = session.user.role;
      const restricted = ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
      if (restricted && (!role || !restricted.roles.includes(role))) {
        // Authenticated but wrong role → 403, not /signin.
        const forbidden = new URL('/forbidden', nextUrl);
        return Response.redirect(forbidden);
      }
      return true;
    },
    /** JWT carries the role + userId so middleware can authorize without a DB hit. */
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    /** Surface JWT claims on the session object exposed to RSC / route handlers. */
    session({ session, token }) {
      if (token.userId && token.role && session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  /**
   * Providers are added in `auth.example.ts` (full config with Prisma).
   * Keeping them here would pull bcrypt / Prisma into the Edge bundle.
   */
  providers: [],
} satisfies NextAuthConfig;
