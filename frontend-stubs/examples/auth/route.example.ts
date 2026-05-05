/**
 * NextAuth.js v5 (Auth.js) route handler. Drop at
 * `app/api/auth/[...nextauth]/route.ts` in your Next.js frontend.
 *
 * Backed by `auth.example.ts` → `auth.ts` (which exports `handlers`).
 *
 * In your real app the import path is just:
 *
 *     export const { GET, POST } = handlers;
 *     import { handlers } from '@/auth';
 */
import { handlers } from '../../auth.example';

export const { GET, POST } = handlers;
