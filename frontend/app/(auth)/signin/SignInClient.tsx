'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

import { SignInForm } from '@/components/auth/SignInForm'
import { SignInLayout } from '@/components/auth/SignInLayout'

export function SignInClient() {
  const params = useSearchParams()
  const router = useRouter()
  const initialError = params.get('error') ?? undefined
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'

  const handle = async (input: {
    email: string
    password: string
  }): Promise<string | undefined> => {
    const res = await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirect: false,
      callbackUrl,
    })
    if (!res || res.error) {
      return res?.error ?? 'CredentialsSignin'
    }
    router.push(res.url ?? callbackUrl)
    router.refresh()
    return undefined
  }

  return (
    <SignInLayout>
      <SignInForm
        onSubmit={handle}
        initialError={initialError}
        forgotPasswordHref="/forgot-password"
      />
    </SignInLayout>
  )
}
