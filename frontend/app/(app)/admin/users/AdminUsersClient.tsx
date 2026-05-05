'use client'

import { useMemo, useState } from 'react'

import { UserDeactivateDialog } from '@/components/admin/UserDeactivateDialog'
import { UserFilters } from '@/components/admin/UserFilters'
import {
  UserFormDialog,
  type UserFormResult,
} from '@/components/admin/UserFormDialog'
import { UsersTable } from '@/components/admin/UsersTable'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/hooks/useI18n'
import type {
  UserDetail,
  UserFiltersValue,
  UserRole,
} from '@/lib/types'

const DEFAULT_FILTERS: UserFiltersValue = {
  search: '',
  role: 'All',
  status: 'All',
}

type FormState =
  | { mode: 'create' }
  | { mode: 'edit'; user: UserDetail }
  | null

export function AdminUsersClient({
  initialUsers,
  initialError,
}: {
  initialUsers: UserDetail[]
  initialError?: string
}) {
  const { t } = useI18n()
  const { push } = useToast()

  const [users, setUsers] = useState<UserDetail[]>(initialUsers)
  const [filters, setFilters] = useState<UserFiltersValue>(DEFAULT_FILTERS)
  const [formOpen, setFormOpen] = useState<FormState>(null)
  const [deactivating, setDeactivating] = useState<UserDetail | null>(null)

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim()
    return users.filter((u) => {
      if (filters.role !== 'All' && u.role !== filters.role) return false
      if (filters.status === 'Active' && !u.isActive) return false
      if (filters.status === 'Inactive' && u.isActive) return false
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, filters])

  const counts = useMemo<Partial<Record<UserRole | 'All', number>>>(() => {
    const acc: Partial<Record<UserRole | 'All', number>> = {
      All: users.length,
    }
    for (const u of users) acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, [users])

  const handleSubmit = async (result: UserFormResult) => {
    try {
      if (result.mode === 'create') {
        const res = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.payload),
        })
        if (!res.ok) throw new Error('Failed to create user')
        const created = (await res.json()) as UserDetail
        setUsers((prev) => [...prev, created])
        push({
          tone: 'success',
          title: t('toast.userCreated'),
          body: created.email,
        })
      } else {
        const res = await fetch(
          `/api/v1/users/${encodeURIComponent(result.userId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.payload),
          }
        )
        if (!res.ok) throw new Error('Failed to update user')
        const updated = (await res.json()) as UserDetail
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
        )
        push({ tone: 'success', title: t('toast.userUpdated') })
      }
    } catch {
      push({ tone: 'error', title: t('settings.toast.error') })
    }
  }

  const handleToggleActive = async (user: UserDetail) => {
    try {
      let nextUser: UserDetail
      if (user.isActive) {
        const res = await fetch(
          `/api/v1/users/${encodeURIComponent(user.id)}`,
          { method: 'DELETE' }
        )
        if (!res.ok) throw new Error('Failed to deactivate')
        nextUser = (await res.json()) as UserDetail
      } else {
        const res = await fetch(
          `/api/v1/users/${encodeURIComponent(user.id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          }
        )
        if (!res.ok) throw new Error('Failed to reactivate')
        nextUser = (await res.json()) as UserDetail
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === nextUser.id ? { ...u, ...nextUser } : u))
      )
      push({
        tone: 'success',
        title: user.isActive
          ? t('toast.userDeactivated')
          : t('toast.userReactivated'),
      })
    } catch {
      push({ tone: 'error', title: t('settings.toast.error') })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-fg">{t('admin.title')}</h1>
          <p className="text-sm text-fg-mute">{t('admin.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen({ mode: 'create' })}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-strong"
        >
          {t('admin.create')}
        </button>
      </header>

      {initialError && (
        <div className="rounded-md border border-priority-high bg-priority-high-bg px-3 py-2 text-sm text-priority-high-fg">
          {initialError}.
        </div>
      )}

      <UserFilters value={filters} onChange={setFilters} counts={counts} />

      <UsersTable
        users={filtered}
        onEdit={(user) => setFormOpen({ mode: 'edit', user })}
        onToggleActive={(user) => setDeactivating(user)}
        emptyAction={
          <button
            type="button"
            onClick={() => setFormOpen({ mode: 'create' })}
            className="rounded-md bg-accent px-3 py-2 text-sm text-accent-fg"
          >
            {t('admin.create')}
          </button>
        }
      />

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(null)}
        onSubmit={handleSubmit}
      />
      <UserDeactivateDialog
        user={deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={handleToggleActive}
      />
    </div>
  )
}
