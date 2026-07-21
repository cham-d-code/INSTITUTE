/**
 * Core domain types, mirroring the high-level data model in §7 of the
 * requirements. These are the shapes the API is expected to return; the
 * backend modules under `backend/src/modules` are organised to match.
 *
 * Money is represented in *cents* (integer) throughout. Never use a float for
 * a fee, a payment, or a balance — Rs. 2,500.00 is 250000 here. Formatting to
 * "Rs. 2,500.00" happens only at the display boundary, in `lib/format.ts`.
 */

/** ISO-8601 timestamp string, e.g. "2026-07-21T08:03:00.000Z". */
export type ISODateTime = string
/** ISO calendar date, e.g. "2026-07-21". */
export type ISODate = string
/** Billing month key, e.g. "2026-07". */
export type BillingMonth = string
/** An integer count of cents. See note above. */
export type Cents = number

/* -------------------------------------------------------------------------
   Users & access (§2, FR-001..006)
   ---------------------------------------------------------------------- */

export type UserRole = 'super_admin' | 'assistant' | 'teacher'

export interface User {
  id: string
  fullName: string
  username: string
  email: string | null
  phone: string | null
  photoUrl: string | null
  role: UserRole
  isActive: boolean
  /** FR-004: forces the change-password screen before anything else loads. */
  mustChangePassword: boolean
  /** FR-006: OTP enrolment state for Super Admins. */
  twoFactorEnabled: boolean
  lastLoginAt: ISODateTime | null
  createdAt: ISODateTime
}

/* -------------------------------------------------------------------------
   Students & guardians (§3.2, FR-010..019)
   ---------------------------------------------------------------------- */

/** FR-016. Inactive/Left are excluded from rosters and fee generation but
 *  retained for history — never delete a student. */
export type StudentStatus = 'active' | 'inactive' | 'left'

export interface Guardian {
  id: string
  studentId: string
  fullName: string
  /** e.g. "Mother", "Father", "Guardian". */
  relationship: string
  phonePrimary: string
  phoneSecondary: string | null
  email: string | null
  address: string | null
  /** The guardian who receives notifications by default (FR-101, Phase 2). */
  isPrimary: boolean
}

export interface Student {
  id: string
  /** FR-012: human-readable, immutable, e.g. "STU-2026-0417". */
  studentCode: string
  fullName: string
  displayName: string | null
  grade: string
  academicYear: string
  dateOfBirth: ISODate | null
  gender: 'male' | 'female' | 'other' | null
  address: string | null
  phone: string | null
  photoUrl: string | null
  status: StudentStatus
  registrationDate: ISODate
  /** FR-019, visible per role permissions. */
  notes: string | null
  guardians: Guardian[]
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

/* -------------------------------------------------------------------------
   Teachers (§3.3, FR-020..024)
   ---------------------------------------------------------------------- */

/** FR-023: drives the teacher payment report (FR-082). */
export type TeacherPaymentType = 'per_session' | 'fixed_monthly' | 'revenue_share'

export interface TeacherPaymentArrangement {
  type: TeacherPaymentType
  /** Set for per_session and fixed_monthly. */
  amount: Cents | null
  /** Set for revenue_share; 0–100. */
  percentage: number | null
}

export interface Teacher {
  id: string
  teacherCode: string
  fullName: string
  phone: string
  email: string | null
  address: string | null
  nicNumber: string | null
  photoUrl: string | null
  subjectIds: string[]
  grades: string[]
  isActive: boolean
  createdAt: ISODateTime
}

/* -------------------------------------------------------------------------
   Classes, sessions & enrollment (§3.4, FR-030..036)
   ---------------------------------------------------------------------- */

export interface Subject {
  id: string
  name: string
  code: string | null
  isActive: boolean
}

export interface Grade {
  id: string
  name: string
  /** Controls ordering in dropdowns and the bulk promotion ladder (FR-018). */
  sortOrder: number
  isActive: boolean
}

/** 0 = Sunday, matching JS `Date#getDay()`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ClassSchedule {
  weekday: Weekday
  /** "HH:mm", 24-hour, in the institute's local timezone. */
  startTime: string
  endTime: string
}

export interface ClassRecord {
  id: string
  classCode: string
  subjectId: string
  subjectName: string
  grade: string
  teacherId: string
  teacherName: string
  schedules: ClassSchedule[]
  hall: string | null
  monthlyFee: Cents
  /** FR-036, optional cap. */
  capacity: number | null
  enrolledCount: number
  isActive: boolean
}

export type EnrollmentStatus = 'active' | 'ended'

export interface Enrollment {
  id: string
  studentId: string
  classId: string
  /** FR-032: these dates drive fee generation, including proration. */
  startDate: ISODate
  endDate: ISODate | null
  status: EnrollmentStatus
}

/** FR-034: a dated occurrence, including one-off and rescheduled sessions. */
export type SessionStatus = 'scheduled' | 'open' | 'closed' | 'cancelled'

export interface ClassSession {
  id: string
  classId: string
  date: ISODate
  startTime: string
  endTime: string
  status: SessionStatus
  /** True for extra/rescheduled sessions that are not part of the recurrence. */
  isAdHoc: boolean
  /** FR-055: scans after this instant are flagged Late. */
  lateAfter: ISODateTime | null
  /** FR-060: absentees are only derivable once the session is closed. */
  closedAt: ISODateTime | null
  presentCount: number
  lateCount: number
  absentCount: number
}

/* -------------------------------------------------------------------------
   QR tokens & ID cards (§3.5, FR-040..044)
   ---------------------------------------------------------------------- */

/**
 * FR-041: the QR encodes only this opaque token, never personal data, so a
 * photographed card leaks nothing. Exactly one token per student is active;
 * a reissue revokes the previous one instantly (FR-043, §6.5).
 */
export interface QRToken {
  id: string
  studentId: string
  /** Opaque, server-generated, non-guessable. */
  token: string
  issuedAt: ISODateTime
  revokedAt: ISODateTime | null
  revokedReason: string | null
  isActive: boolean
  /** Increments on each reissue; printed small on the card for support. */
  issueNumber: number
}

/* -------------------------------------------------------------------------
   Attendance (§3.6, FR-050..061)
   ---------------------------------------------------------------------- */

export type AttendanceStatus = 'present' | 'late' | 'void'
/** FR-056: manual marks are visually distinguished from scans in reports. */
export type AttendanceMethod = 'scan' | 'manual'

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  studentCode: string
  status: AttendanceStatus
  method: AttendanceMethod
  /** Server-validated instant the scan was accepted (FR-050). */
  markedAt: ISODateTime
  /** FR-058: the on-device instant, preserved when a queued scan syncs late. */
  capturedAt: ISODateTime | null
  /** FR-092: shown on every attendance record in reports. */
  markedByUserId: string
  markedByName: string
  deviceId: string | null
  /** Mandatory when method is 'manual' (FR-056). */
  reason: string | null
  /** FR-054: scanned into a class they are not enrolled in, held for review. */
  isGuest: boolean
  voidedAt: ISODateTime | null
  voidedReason: string | null
}

/** The result the scanner renders after reading a card (FR-052, §6.2). */
export type ScanOutcome =
  /** Enrolled and paid — green, proceed. */
  | 'ok'
  /** Enrolled, fee outstanding — amber, direct to the payment desk. */
  | 'unpaid'
  /** Not enrolled in the selected class — red. */
  | 'not_enrolled'
  /** FR-053: already scanned into this session. */
  | 'duplicate'
  /** §6.5: the card was reissued and this token is dead. */
  | 'card_revoked'
  /** Token not recognised at all. */
  | 'unknown_card'

export interface ScanResult {
  outcome: ScanOutcome
  student: Pick<Student, 'id' | 'studentCode' | 'fullName' | 'displayName' | 'photoUrl' | 'grade'> | null
  className: string | null
  /** Present when outcome is 'duplicate' — "already marked at HH:MM". */
  alreadyMarkedAt: ISODateTime | null
  /** Present when outcome is 'ok' or 'unpaid'. */
  attendance: AttendanceRecord | null
  /** FR-080: live fee state for the current billing month of this class. */
  feeStatus: {
    month: BillingMonth
    isPaid: boolean
    outstanding: Cents
  } | null
  isLate: boolean
}

/* -------------------------------------------------------------------------
   Fees & payments (§3.7, FR-070..083)
   ---------------------------------------------------------------------- */

export type ChargeKind = 'monthly_fee' | 'admission' | 'material' | 'exam' | 'card_reissue' | 'other'

export type DueStatus = 'unpaid' | 'partial' | 'paid' | 'waived'

/** A generated obligation: one student, one class, one month (FR-071). */
export interface Due {
  id: string
  studentId: string
  studentName: string
  studentCode: string
  classId: string
  className: string
  month: BillingMonth
  kind: ChargeKind
  grossAmount: Cents
  discountAmount: Cents
  /** grossAmount - discountAmount. */
  netAmount: Cents
  paidAmount: Cents
  /** netAmount - paidAmount; never negative. */
  outstanding: Cents
  status: DueStatus
  dueDate: ISODate
}

export type PaymentMethod = 'cash' | 'bank_transfer'
export type PaymentStatus = 'valid' | 'void'

export interface Payment {
  id: string
  /** FR-073: auto-generated and sequential, e.g. "RCP-2026-08841". */
  receiptNumber: string
  studentId: string
  studentName: string
  studentCode: string
  /** A payment can settle several dues at once (FR-072, FR-081). */
  allocations: PaymentAllocation[]
  amount: Cents
  method: PaymentMethod
  bankReference: string | null
  paidAt: ISODateTime
  /** FR-073 / FR-092: the assistant who took the money. */
  collectedByUserId: string
  collectedByName: string
  deviceId: string | null
  status: PaymentStatus
  /** FR-077: voids are Super Admin actions and always carry a reason. */
  voidedAt: ISODateTime | null
  voidedReason: string | null
  voidedByUserId: string | null
  /** FR-074: reprints are logged; this is how many have been issued. */
  reprintCount: number
}

export interface PaymentAllocation {
  dueId: string
  classId: string
  className: string
  month: BillingMonth
  amount: Cents
}

/** FR-076: requires Super Admin approval and a recorded reason. */
export type DiscountKind = 'percentage' | 'fixed'

export interface Discount {
  id: string
  studentId: string
  studentName: string
  classId: string | null
  className: string | null
  kind: DiscountKind
  /** Percent (0–100) when kind is 'percentage', else cents. */
  value: number
  reason: string
  effectiveFrom: BillingMonth
  effectiveTo: BillingMonth | null
  approvedByUserId: string | null
  approvedByName: string | null
  approvedAt: ISODateTime | null
  status: 'pending' | 'approved' | 'rejected'
}

/* -------------------------------------------------------------------------
   Corrections (§6.4, FR-057, FR-077)
   ---------------------------------------------------------------------- */

export type CorrectionTargetType = 'attendance' | 'payment'
export type CorrectionStatus = 'pending' | 'approved' | 'rejected'

/**
 * Assistants can never mutate a past attendance or payment record directly.
 * They raise one of these; a Super Admin approves, which voids the original
 * (retained, marked VOID with a reason) and applies the correction.
 */
export interface CorrectionRequest {
  id: string
  targetType: CorrectionTargetType
  targetId: string
  requestedByUserId: string
  requestedByName: string
  requestedAt: ISODateTime
  reason: string
  proposedChange: string
  status: CorrectionStatus
  reviewedByUserId: string | null
  reviewedByName: string | null
  reviewedAt: ISODateTime | null
  reviewNote: string | null
}

/* -------------------------------------------------------------------------
   Audit trail (§3.8, FR-090..093)
   ---------------------------------------------------------------------- */

export type AuditAction =
  | 'create'
  | 'update'
  | 'void'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'card_issue'
  | 'card_reissue'
  | 'scan'
  | 'payment'
  | 'refund'
  | 'receipt_reprint'
  | 'export'
  | 'deactivate'
  | 'reactivate'

/** Append-only. Nobody, including a Super Admin, can edit or delete these
 *  (FR-093, NFR-10 enforces it at the database grant level). */
export interface AuditLogEntry {
  id: string
  actorUserId: string
  actorName: string
  actorRole: UserRole
  action: AuditAction
  entityType: string
  entityId: string
  entityLabel: string | null
  /** Field-level diff; null for actions with no before-state (e.g. login). */
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  occurredAt: ISODateTime
  ipAddress: string | null
  deviceId: string | null
  userAgent: string | null
}

/* -------------------------------------------------------------------------
   Reporting (§3.10, FR-110..115)
   ---------------------------------------------------------------------- */

export interface DashboardSummary {
  todaySessions: { total: number; open: number; closed: number }
  todayScans: number
  todayCollection: Cents
  collectionByAssistant: Array<{ userId: string; name: string; amount: Cents; count: number }>
  monthToDateRevenue: Cents
  previousMonthRevenue: Cents
  arrearsTotal: Cents
  activeStudents: number
  alerts: {
    longAbsentees: number
    unpaidStudents: number
    pendingCorrections: number
    pendingDiscounts: number
  }
}

export interface TrendPoint {
  label: string
  value: number
}

/* -------------------------------------------------------------------------
   Shared API envelope
   ---------------------------------------------------------------------- */

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
