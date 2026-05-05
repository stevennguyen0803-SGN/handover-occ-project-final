import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { backendFetch, BackendApiError } from '@/lib/server/api-client'
import type { UserDetail } from '@/lib/types'

import { AdminUsersClient } from './AdminUsersClient'

async function loadUsers(): Promise<{
  users: UserDetail[]
  error?: string
}> {
  try {
    const data = await backendFetch<{ data: UserDetail[] } | UserDetail[]>(
      '/api/v1/users'
    )
    const users = Array.isArray(data) ? data : data.data
    return { users }
  } catch (err) {
    const message =
      err instanceof BackendApiError
        ? `Backend ${err.status}: ${err.message}`
        : 'Backend unreachable'
    return { users: [], error: message }
  }
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/signin')
  if (session.user.role !== 'ADMIN') redirect('/forbidden')

  const { users, error } = await loadUsers()
  return <AdminUsersClient initialUsers={users} initialError={error} />
}
