'use client';

import { useI18n } from '../../hooks/useI18n';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { formatDate, formatDateTime } from '../../lib/format';
import type { UserDetail, UserRole } from '../../lib/types';

export interface UsersTableProps {
  users: ReadonlyArray<UserDetail>;
  /** Called when the admin clicks a row's edit action. */
  onEdit?: (user: UserDetail) => void;
  /** Called when the admin clicks deactivate or reactivate. */
  onToggleActive?: (user: UserDetail) => void;
  /** Called when the admin clicks reset password. */
  onResetPassword?: (user: UserDetail) => void;
  emptyAction?: React.ReactNode;
}

const ROLE_TONE: Record<UserRole, 'neutral' | 'priority-high' | 'priority-normal' | 'shift'> = {
  ADMIN: 'priority-high',
  SUPERVISOR: 'shift',
  OCC_STAFF: 'priority-normal',
  MANAGEMENT_VIEWER: 'neutral',
};

/**
 * Read-only table of users for the admin console. All mutations happen
 * through callback props; keep this component "dumb" so server actions
 * or fetch wrappers can plug in cleanly.
 */
export function UsersTable({
  users,
  onEdit,
  onToggleActive,
  onResetPassword,
  emptyAction,
}: UsersTableProps) {
  const { t } = useI18n();

  if (users.length === 0) {
    return <EmptyState title={t('admin.empty.title')} body={t('admin.empty.body')} action={emptyAction} />;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="min-w-full text-sm">
        <thead className="bg-bg-row text-left text-xs uppercase text-fg-mute">
          <tr>
            <th className="px-3 py-2">{t('admin.col.name')}</th>
            <th className="px-3 py-2">{t('admin.col.email')}</th>
            <th className="px-3 py-2">{t('admin.col.role')}</th>
            <th className="px-3 py-2">{t('admin.col.status')}</th>
            <th className="px-3 py-2">{t('admin.col.activity')}</th>
            <th className="px-3 py-2">{t('admin.col.lastLogin')}</th>
            <th className="px-3 py-2 text-right">{t('admin.col.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-bg-row">
              <td className="px-3 py-2 font-medium text-fg">
                {u.name}
                <div className="text-xs text-fg-faint">
                  {t('reports.preview.generatedAt')}: {formatDate(u.createdAt)}
                </div>
              </td>
              <td className="px-3 py-2 text-fg-soft">{u.email}</td>
              <td className="px-3 py-2">
                <Badge tone={ROLE_TONE[u.role]}>{t(`admin.role.${u.role}`)}</Badge>
              </td>
              <td className="px-3 py-2">
                <Badge tone={u.isActive ? 'ack-done' : 'neutral'}>
                  {u.isActive ? t('admin.status.active') : t('admin.status.inactive')}
                </Badge>
              </td>
              <td className="px-3 py-2 text-xs text-fg-soft">
                {u.handoversPreparedCount !== undefined && (
                  <div>{t('admin.activity.prepared', { n: u.handoversPreparedCount })}</div>
                )}
                {u.handoversReceivedCount !== undefined && (
                  <div>{t('admin.activity.received', { n: u.handoversReceivedCount })}</div>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-fg-soft">
                {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
              </td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(u)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-fg-soft hover:border-accent hover:text-accent"
                    >
                      {t('common.edit')}
                    </button>
                  )}
                  {onResetPassword && (
                    <button
                      type="button"
                      onClick={() => onResetPassword(u)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-fg-soft hover:border-accent hover:text-accent"
                    >
                      {t('admin.action.resetPwd')}
                    </button>
                  )}
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(u)}
                      className="rounded-md border border-line px-2 py-1 text-xs text-fg-soft hover:border-priority-critical-fg hover:text-priority-critical-fg"
                    >
                      {u.isActive ? t('admin.action.deactivate') : t('admin.action.reactivate')}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
