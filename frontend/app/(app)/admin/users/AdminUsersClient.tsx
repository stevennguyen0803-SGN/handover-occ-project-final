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
    if (result.mode === 'create') {
      const created: UserDetail = {
        id: `u-${Date.now()}`,
        email: result.payload.email,
        name: result.payload.name,
        role: result.payload.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, created])
      push({
        tone: 'success',
        title: t('toast.userCreated'),
        body: created.email,
      })
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === result.userId
            ? {
                ...u,
                ...result.payload,
                updatedAt: new Date().toISOString(),
              }
            : u
        )
      )
      push({ tone: 'success', title: t('toast.userUpdated') })
    }
  }

  const handleToggleActive = async (user: UserDetail) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    )
    push({
      tone: 'success',
      title: user.isActive
        ? t('toast.userDeactivated')
        : t('toast.userReactivated'),
    })
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
