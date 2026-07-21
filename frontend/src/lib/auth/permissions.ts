import type { UserRole } from '@/types/domain'

/**
 * Permission matrix for §2 of the requirements.
 *
 * IMPORTANT: this shapes the UI only — it hides buttons and blocks routes so
 * staff aren't shown actions they cannot complete. It is NOT a security
 * boundary. NFR-04 requires role checks to be enforced server-side on every
 * request; anything gated here must be gated again in the API. Treat a
 * frontend-only check as a usability affordance, never as protection.
 */
export type Permission =
  // User & access management (FR-001..006)
  | 'users.view'
  | 'users.manage'
  // Students (FR-010..019)
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'students.promote'
  // Teachers (FR-020..024)
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  // Classes & enrollment (FR-030..036)
  | 'classes.view'
  | 'classes.manage'
  | 'enrollments.manage'
  // ID cards (FR-040..044)
  | 'cards.print'
  | 'cards.reissue'
  // Attendance (FR-050..061)
  | 'attendance.view'
  | 'attendance.scan'
  | 'attendance.markManual'
  /** FR-057: assistants may never edit or void attendance directly. */
  | 'attendance.void'
  | 'attendance.requestCorrection'
  | 'attendance.approveCorrection'
  // Fees & payments (FR-070..083)
  | 'payments.view'
  | 'payments.record'
  | 'payments.reprintReceipt'
  /** FR-077: voids and refunds are Super Admin actions. */
  | 'payments.void'
  | 'payments.refund'
  | 'fees.configure'
  | 'discounts.request'
  | 'discounts.approve'
  /** FR-078: an assistant sees only their own day's collection. */
  | 'collection.viewOwn'
  | 'collection.viewAll'
  | 'arrears.view'
  // Reports (§3.10)
  | 'reports.operational'
  /** Revenue, profit and teacher-cost reports are owner-only (§2). */
  | 'reports.financial'
  | 'reports.export'
  // Audit (FR-091)
  | 'audit.view'
  // Settings
  | 'settings.manage'

const SUPER_ADMIN: Permission[] = [
  'users.view',
  'users.manage',
  'students.view',
  'students.create',
  'students.edit',
  'students.delete',
  'students.promote',
  'teachers.view',
  'teachers.create',
  'teachers.edit',
  'classes.view',
  'classes.manage',
  'enrollments.manage',
  'cards.print',
  'cards.reissue',
  'attendance.view',
  'attendance.scan',
  'attendance.markManual',
  'attendance.void',
  'attendance.requestCorrection',
  'attendance.approveCorrection',
  'payments.view',
  'payments.record',
  'payments.reprintReceipt',
  'payments.void',
  'payments.refund',
  'fees.configure',
  'discounts.request',
  'discounts.approve',
  'collection.viewOwn',
  'collection.viewAll',
  'arrears.view',
  'reports.operational',
  'reports.financial',
  'reports.export',
  'audit.view',
  'settings.manage',
]

/**
 * Deliberately narrow. The assistant role exists to be *accountable*: they can
 * create and record, but never rewrite history. Every omission below maps to a
 * specific line in §2 or the fraud mitigations in §8.
 */
const ASSISTANT: Permission[] = [
  'students.view',
  'students.create',
  'students.edit',
  'teachers.view',
  'teachers.create',
  'teachers.edit',
  'classes.view',
  'enrollments.manage',
  'cards.print',
  'cards.reissue',
  'attendance.view',
  'attendance.scan',
  'attendance.markManual',
  'attendance.requestCorrection',
  'payments.view',
  'payments.record',
  'payments.reprintReceipt',
  'discounts.request',
  'collection.viewOwn',
  'arrears.view',
  'reports.operational',
]

/** FR: optional view-only login for teachers (§2, "Should have"). */
const TEACHER: Permission[] = ['classes.view', 'attendance.view', 'reports.operational']

const MATRIX: Record<UserRole, ReadonlySet<Permission>> = {
  super_admin: new Set(SUPER_ADMIN),
  assistant: new Set(ASSISTANT),
  teacher: new Set(TEACHER),
}

export function roleHas(role: UserRole, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false
}

export function roleHasAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHas(role, p))
}

export function roleHasAll(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHas(role, p))
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  assistant: 'Assistant',
  teacher: 'Teacher',
}
