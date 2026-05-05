import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OCC Handover System',
  description:
    'Operations Control Centre shift-handover management — replaces spreadsheets, emails, and verbal updates with a structured, auditable workflow.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  )
}
