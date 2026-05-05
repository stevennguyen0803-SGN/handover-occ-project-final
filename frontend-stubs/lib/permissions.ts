import type { UserRole } from './types';

/**
 * Action keys used by the UI. Mirror BR-12 in `shared/BUSINESS_RULES.md`
 * and the route matrix in `shared/roles.md`. Keep them in sync.
 */
export type Capability =
  | 'createHandover'
  | 'viewAllHandovers'
  | 'updateOpenItems'
  | 'closeOrResolveItems'
  | 'softDelete'
  | 'manageUsers'
  | 'export'
  | 'viewAuditLog'
  | 'acknowledge';

const MATRIX: Record<Capability, readonly UserRole[]> = {
  createHandover: ['OCC_STAFF', 'SUPERVISOR', 'ADMIN'],
  viewAllHandovers: ['SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'],
  updateOpenItems: ['OCC_STAFF', 'SUPERVISOR', 'ADMIN'],
  closeOrResolveItems: ['OCC_STAFF', 'SUPERVISOR', 'ADMIN'],
  softDelete: ['SUPERVISOR', 'ADMIN'],
  manageUsers: ['ADMIN'],
  export: ['OCC_STAFF', 'SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'],
  viewAuditLog: ['SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN'],
  // BR-10: caller cannot acknowledge their own handover — enforce in service layer.
  acknowledge: ['OCC_STAFF', 'SUPERVISOR'],
};

export function can(role: UserRole | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[capability].includes(role);
}
