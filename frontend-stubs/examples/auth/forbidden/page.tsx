/**
 * Example 403 page. Drop at `app/forbidden/page.tsx`. The Edge-safe
 * `authorized()` callback in `auth.config.example.ts` redirects here
 * when an authenticated user hits a route their role does not allow.
 *
 * The plain `401` (no session) path goes to `/signin` — see
 * `pages.signIn` in `auth.config.example.ts`.
 */
import { UnauthorizedView } from '../../../components/auth/UnauthorizedView';

export default function ForbiddenPage() {
  return <UnauthorizedView />;
}
