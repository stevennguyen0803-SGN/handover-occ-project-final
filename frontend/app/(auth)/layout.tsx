import { AuthProviders } from './AuthProviders'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProviders>{children}</AuthProviders>
}
