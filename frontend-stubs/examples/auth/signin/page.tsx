/**
 * Example sign-in page. Drop at `app/(auth)/signin/page.tsx`.
 *
 * The page reads the `?error=…` URL param Auth.js appends after a
 * failed credential check, and renders the `<SignInForm>` inside the
 * branded `<SignInLayout>`.
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { SignInForm } from '../../../components/auth/SignInForm';
import { SignInLayout } from '../../../components/auth/SignInLayout';

export default function SignInPage() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get('error') ?? undefined;
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  // 👉 In the integrated app, replace this with:
  //
  //    import { signIn } from '@/auth';
  //    const handle = async ({ email, password }) => {
  //      const res = await signIn('credentials', {
  //        email, password, redirect: false, callbackUrl,
  //      });
  //      if (res?.error) return res.error; // 'CredentialsSignin' etc.
  //      router.push(res?.url ?? callbackUrl);
  //      return undefined;
  //    };
  const handle = async (input: { email: string; password: string }): Promise<string | undefined> => {
    void input;
    router.push(callbackUrl);
    return undefined;
  };

  return (
    <SignInLayout>
      <SignInForm onSubmit={handle} initialError={error} forgotPasswordHref="/forgot-password" />
    </SignInLayout>
  );
}
