/**
 * Module augmentation for NextAuth.js v5 (Auth.js).
 *
 * Adds `role` and `id` to the user objects flowing through
 * `Session`, `User`, and `JWT` so downstream code (server actions,
 * RSC, middleware) can access `session.user.role` with full
 * TypeScript safety.
 *
 * Drop into your Next.js frontend at `next-auth.d.ts` (project root).
 */
import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as DefaultJWT } from 'next-auth/jwt';
import type { UserRole } from './lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: UserRole;
  }
}

export {};
