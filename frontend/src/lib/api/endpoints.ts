/**
 * The single seam between the UI and the backend.
 *
 * Every screen imports its data functions from here and nowhere else. Today
 * these delegate to the in-memory mock in `lib/mock/api.ts`. When the Express
 * API is ready, this is the ONLY file that changes: each group is repointed at
 * the real `axios` client in `lib/api/client.ts`, the mock import is deleted,
 * and the screens are untouched.
 *
 * Keeping this boundary honest is why the mock functions already return the
 * exact shapes in `types/domain.ts`.
 */
export {
  authApi,
  refApi,
  studentApi,
  teacherApi,
  classApi,
  sessionApi,
  attendanceApi,
  cardApi,
  feeApi,
  paymentApi,
  discountApi,
  correctionApi,
  userApi,
  auditApi,
  reportApi,
  ApiError,
  serverNow,
  currentMonth,
} from '@/lib/mock/api'

export type { StudentInput, PaymentInput } from '@/lib/mock/api'

/** Centralised React Query keys so invalidation is consistent and typo-proof. */
export const qk = {
  me: ['me'] as const,
  dashboard: ['dashboard'] as const,
  revenueTrend: (months: number) => ['revenueTrend', months] as const,

  students: ['students'] as const,
  student: (id: string) => ['student', id] as const,
  studentEnrollments: (id: string) => ['student', id, 'enrollments'] as const,
  studentAttendance: (id: string) => ['student', id, 'attendance'] as const,
  studentDues: (id: string) => ['student', id, 'dues'] as const,
  studentOpenDues: (id: string) => ['student', id, 'openDues'] as const,

  teachers: ['teachers'] as const,
  teacher: (id: string) => ['teacher', id] as const,

  classes: ['classes'] as const,
  class: (id: string) => ['class', id] as const,
  classRoster: (id: string) => ['class', id, 'roster'] as const,
  classSessions: (id: string) => ['class', id, 'sessions'] as const,

  subjects: ['subjects'] as const,
  grades: ['grades'] as const,
  institute: ['institute'] as const,

  todaySessions: ['sessions', 'today'] as const,
  session: (id: string) => ['session', id] as const,

  card: (studentId: string) => ['card', studentId] as const,

  arrears: ['arrears'] as const,
  payments: ['payments'] as const,
  payment: (id: string) => ['payment', id] as const,
  collection: (date: string) => ['collection', date] as const,

  discounts: ['discounts'] as const,
  corrections: ['corrections'] as const,
  users: ['users'] as const,
  audit: ['audit'] as const,

  financialSummary: ['reports', 'financial'] as const,
  enrollmentSummary: ['reports', 'enrollment'] as const,
  attendanceSummary: ['reports', 'attendance'] as const,
  teacherPayments: ['reports', 'teacherPayments'] as const,
}
