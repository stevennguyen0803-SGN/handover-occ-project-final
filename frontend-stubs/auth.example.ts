/**
 * Full NextAuth.js v5 (Auth.js) wiring with the Prisma adapter and a
 * credentials provider. Drop into your Next.js frontend at `auth.ts`.
 *
 * Companion files:
 *   - `auth.config.example.ts`    → `auth.config.ts`  (Edge-safe pieces)
 *   - `middleware.example.ts`     → `middleware.ts`
 *   - `next-auth.d.ts`            → `next-auth.d.ts`  (module augmentation)
 *   - `examples/auth/route.example.ts` → `app/api/auth/[...nextauth]/route.ts`
 *
 * Required env:
 *   - AUTH_SECRET         (NextAuth secret — `openssl rand -base64 32`)
 *   - DATABASE_URL        (PostgreSQL connection — for the Prisma adapter)
 *
 * BR-12: roles flow from the `User.role` column. `passwordHash` is
 * compared with bcrypt; nullable means the user is SSO-only and the
 * credentials provider returns `null` (Auth.js then surfaces
 * `CredentialsSignin`).
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { authConfig } from './auth.config.example';

// 👇 Replace with your generated Prisma client. The import path mirrors the
//    convention used in `shared/setup-guide.md` / `prisma/schema.prisma`.
//    Example:
//    import { prisma } from '@/lib/prisma';
declare const prisma: import('@prisma/client').PrismaClient;

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = SignInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        // SSO-only users have no passwordHash and cannot sign in via credentials.
        if (!user || !user.passwordHash || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // The shape returned here is what flows into `jwt({ user })`.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    // 👉 Add OAuth/SSO providers here if your IdP supports it. They use the
    //    same JWT/session callbacks defined in `auth.config.example.ts`.
  ],
});
