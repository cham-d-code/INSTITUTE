import type {
  AttendanceRecord,
  ClassRecord,
  ClassSession,
  CorrectionRequest,
  DashboardSummary,
  Discount,
  Due,
  Grade,
  Payment,
  ScanResult,
  Student,
  Subject,
  Teacher,
  TrendPoint,
  User,
} from '@/types/domain'
import * as seed from './seed'

/**
 * In-memory mock backend.
 *
 * Every function here is the placeholder for one real API endpoint. Components
 * never import this module directly — they go through `lib/api/endpoints.ts`,
 * which is the single seam where the real Express client takes over. Swapping
 * that file is the whole migration.
 *
 * Reads return deep clones so a component can never mutate the store by
 * holding onto a returned object. Writes mutate the seed arrays in place.
 */

const clone = <T>(v: T): T => structuredClone(v)

/** Simulated latency so loading states are visible during review. */
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

/** The mock "server clock". Pinned to the demo's today so seeded sessions,
 *  dues and payments line up regardless of the real date. */
export const serverNow = () => new Date(seed.DEMO_TODAY)
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
export const currentMonth = () => monthKey(serverNow())

const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

/* ======================================================================
   Auth
   ==================================================================== */

let sessionUserId: string | null = 'u-owner' // demo starts signed in as the owner

export const authApi = {
  async me(): Promise<User | null> {
    await delay(120)
    const u = seed.users.find((x) => x.id === sessionUserId)
    return u && u.isActive ? clone(u) : null
  },
  async login(username: string, _password: string): Promise<User> {
    await delay()
    const u = seed.users.find((x) => x.username === username)
    // Generic failure — never reveal which half was wrong, or that the
    // account is disabled (that would turn login into a staff directory).
    if (!u || !u.isActive) throw new ApiError('Incorrect username or password.', 401)
    sessionUserId = u.id
    return clone(u)
  },
  async logout(): Promise<void> {
    await delay(80)
    sessionUserId = null
  },
  /** Lets the screens switch role to preview assistant-limited views. */
  async loginAs(userId: string): Promise<User> {
    await delay(120)
    const u = seed.users.find((x) => x.id === userId && x.isActive)
    if (!u) throw new ApiError('No such active account.', 404)
    sessionUserId = u.id
    return clone(u)
  },
  currentUserId: () => sessionUserId,
}

export class ApiError extends Error {
  status: number
  code?: string
  // Parameter properties are disallowed under `erasableSyntaxOnly`, so assign
  // in the body instead.
  constructor(message: string, status = 400, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const requireUser = (): User => {
  const u = seed.users.find((x) => x.id === sessionUserId)
  if (!u) throw new ApiError('Not signed in.', 401)
  return u
}

/* ======================================================================
   Reference data
   ==================================================================== */

export const refApi = {
  async subjects(): Promise<Subject[]> {
    await delay(80)
    return clone(seed.subjects)
  },
  async grades(): Promise<Grade[]> {
    await delay(80)
    return clone([...seed.grades].sort((a, b) => a.sortOrder - b.sortOrder))
  },
  async addSubject(name: string): Promise<Subject> {
    await delay()
    const s: Subject = { id: genId('sub'), name, code: null, isActive: true }
    seed.subjects.push(s)
    return clone(s)
  },
  async addGrade(name: string, sortOrder: number): Promise<Grade> {
    await delay()
    const g: Grade = { id: genId('g'), name, sortOrder, isActive: true }
    seed.grades.push(g)
    return clone(g)
  },
  async institute() {
    await delay(80)
    return clone(seed.institute)
  },
  async updateInstitute(patch: Partial<typeof seed.institute>) {
    await delay()
    Object.assign(seed.institute, patch)
    return clone(seed.institute)
  },
}

/* ======================================================================
   Students
   ==================================================================== */

export interface StudentInput {
  fullName: string
  displayName?: string | null
  grade: string
  academicYear: string
  dateOfBirth?: string | null
  gender?: Student['gender']
  address?: string | null
  phone?: string | null
  notes?: string | null
  guardians: Array<{
    fullName: string
    relationship: string
    phonePrimary: string
    phoneSecondary?: string | null
    email?: string | null
    address?: string | null
    isPrimary: boolean
  }>
  classIds: string[]
}

export const studentApi = {
  async list(): Promise<Student[]> {
    await delay()
    return clone(seed.students)
  },
  async get(id: string): Promise<Student> {
    await delay(140)
    const s = seed.students.find((x) => x.id === id)
    if (!s) throw new ApiError('Student not found.', 404)
    return clone(s)
  },
  /** FR-014: warn on a likely duplicate before saving. */
  async checkDuplicate(fullName: string, guardianPhone: string): Promise<Student | null> {
    await delay(120)
    const norm = (v: string) => v.toLowerCase().replace(/\s+/g, '')
    const hit = seed.students.find(
      (s) =>
        norm(s.fullName) === norm(fullName) &&
        s.guardians.some((g) => norm(g.phonePrimary) === norm(guardianPhone)),
    )
    return hit ? clone(hit) : null
  },
  async create(input: StudentInput): Promise<Student> {
    await delay()
    requireUser()
    const seq = seed.students.length + 1
    const id = genId('st')
    const now = serverNow()
    const guardians = input.guardians.map((g) => ({
      id: genId('gd'),
      studentId: id,
      fullName: g.fullName,
      relationship: g.relationship,
      phonePrimary: g.phonePrimary,
      phoneSecondary: g.phoneSecondary ?? null,
      email: g.email ?? null,
      address: g.address ?? input.address ?? null,
      isPrimary: g.isPrimary,
    }))
    const student: Student = {
      id,
      studentCode: `STU-2026-${String(seq).padStart(4, '0')}`,
      fullName: input.fullName,
      displayName: input.displayName ?? null,
      grade: input.grade,
      academicYear: input.academicYear,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      phone: input.phone ?? null,
      photoUrl: null,
      status: 'active',
      registrationDate: now.toISOString().slice(0, 10),
      notes: input.notes ?? null,
      guardians,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    seed.students.push(student)
    seed.guardiansAll.push(...guardians)

    // FR-013: enrolments created in the same step.
    for (const classId of input.classIds) {
      seed.enrollments.push({
        id: genId('en'),
        studentId: id,
        classId,
        startDate: student.registrationDate,
        endDate: null,
        status: 'active',
      })
      recomputeEnrolledCount(classId)
      generateCurrentMonthDue(id, classId)
    }

    // FR-041: mint the QR token.
    seed.qrTokens.push({
      id: genId('qr'),
      studentId: id,
      token: `TIMS-${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
      issuedAt: now.toISOString(),
      revokedAt: null,
      revokedReason: null,
      isActive: true,
      issueNumber: 1,
    })

    writeAudit('create', 'Student', id, student.studentCode, null, { fullName: student.fullName })
    return clone(student)
  },
  async update(id: string, patch: Partial<StudentInput>): Promise<Student> {
    await delay()
    requireUser()
    const s = seed.students.find((x) => x.id === id)
    if (!s) throw new ApiError('Student not found.', 404)
    const before = { grade: s.grade, fullName: s.fullName, address: s.address }
    Object.assign(s, {
      fullName: patch.fullName ?? s.fullName,
      displayName: patch.displayName ?? s.displayName,
      grade: patch.grade ?? s.grade,
      address: patch.address ?? s.address,
      phone: patch.phone ?? s.phone,
      notes: patch.notes ?? s.notes,
      updatedAt: serverNow().toISOString(),
    })
    writeAudit('update', 'Student', id, s.studentCode, before, {
      grade: s.grade,
      fullName: s.fullName,
      address: s.address,
    })
    return clone(s)
  },
  async setStatus(id: string, status: Student['status']): Promise<Student> {
    await delay()
    requireUser()
    const s = seed.students.find((x) => x.id === id)
    if (!s) throw new ApiError('Student not found.', 404)
    const before = { status: s.status }
    s.status = status
    s.updatedAt = serverNow().toISOString()
    writeAudit('update', 'Student', id, s.studentCode, before, { status })
    return clone(s)
  },
  async enrollments(studentId: string) {
    await delay(120)
    return clone(seed.enrollments.filter((e) => e.studentId === studentId))
  },
  async attendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
    await delay(160)
    return clone(
      seed.attendance
        .filter((a) => a.studentId === studentId)
        .sort((a, b) => (a.markedAt < b.markedAt ? 1 : -1)),
    )
  },
}

/* ======================================================================
   Teachers
   ==================================================================== */

export const teacherApi = {
  async list(): Promise<Array<Teacher & { classCount: number }>> {
    await delay()
    return clone(
      seed.teachers.map((t) => ({
        ...t,
        classCount: seed.classes.filter((c) => c.teacherId === t.id).length,
      })),
    )
  },
  async get(id: string) {
    await delay(140)
    const t = seed.teachers.find((x) => x.id === id)
    if (!t) throw new ApiError('Teacher not found.', 404)
    return {
      ...clone(t),
      arrangement: clone(seed.teacherArrangements[id] ?? null),
      classes: clone(seed.classes.filter((c) => c.teacherId === id)),
    }
  },
  async create(input: Omit<Teacher, 'id' | 'teacherCode' | 'createdAt' | 'isActive'>): Promise<Teacher> {
    await delay()
    requireUser()
    const t: Teacher = {
      ...input,
      id: genId('t'),
      teacherCode: `TCH-${String(seed.teachers.length + 1).padStart(3, '0')}`,
      isActive: true,
      createdAt: serverNow().toISOString(),
    }
    seed.teachers.push(t)
    writeAudit('create', 'Teacher', t.id, t.teacherCode, null, { fullName: t.fullName })
    return clone(t)
  },
  async setActive(id: string, isActive: boolean) {
    await delay()
    requireUser()
    const t = seed.teachers.find((x) => x.id === id)
    if (!t) throw new ApiError('Teacher not found.', 404)
    t.isActive = isActive
    writeAudit(isActive ? 'reactivate' : 'deactivate', 'Teacher', id, t.teacherCode, null, null)
    return clone(t)
  },
}

/* ======================================================================
   Classes, roster, sessions
   ==================================================================== */

function recomputeEnrolledCount(classId: string) {
  const c = seed.classes.find((x) => x.id === classId)
  if (c) c.enrolledCount = seed.enrollments.filter((e) => e.classId === classId && e.status === 'active').length
}

export const classApi = {
  async list(): Promise<ClassRecord[]> {
    await delay()
    return clone(seed.classes)
  },
  async get(id: string): Promise<ClassRecord> {
    await delay(140)
    const c = seed.classes.find((x) => x.id === id)
    if (!c) throw new ApiError('Class not found.', 404)
    return clone(c)
  },
  /** FR-033: roster with each student's payment status for THIS class. */
  async roster(classId: string) {
    await delay(160)
    const month = currentMonth()
    const rows = seed.enrollments
      .filter((e) => e.classId === classId && e.status === 'active')
      .map((e) => {
        const s = seed.students.find((x) => x.id === e.studentId)!
        const due = seed.dues.find((d) => d.studentId === e.studentId && d.classId === classId && d.month === month)
        return {
          student: clone(s),
          enrollment: clone(e),
          feeStatus: due ? { status: due.status, outstanding: due.outstanding } : null,
        }
      })
    return rows
  },
  async sessions(classId: string): Promise<ClassSession[]> {
    await delay(140)
    return clone(
      seed.sessions.filter((s) => s.classId === classId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    )
  },
  async create(input: {
    subjectId: string
    grade: string
    teacherId: string
    schedules: ClassRecord['schedules']
    hall: string | null
    monthlyFee: number
    capacity: number | null
  }): Promise<ClassRecord> {
    await delay()
    requireUser()
    const subject = seed.subjects.find((s) => s.id === input.subjectId)
    const teacher = seed.teachers.find((t) => t.id === input.teacherId)
    if (!subject || !teacher) throw new ApiError('Unknown subject or teacher.', 400)
    const c: ClassRecord = {
      id: genId('c'),
      classCode: genId('CLS').toUpperCase(),
      subjectId: input.subjectId,
      subjectName: subject.name,
      grade: input.grade,
      teacherId: input.teacherId,
      teacherName: teacher.fullName,
      schedules: input.schedules,
      hall: input.hall,
      monthlyFee: input.monthlyFee,
      capacity: input.capacity,
      enrolledCount: 0,
      isActive: true,
    }
    seed.classes.push(c)
    writeAudit('create', 'Class', c.id, `${c.grade} ${c.subjectName}`, null, null)
    return clone(c)
  },
  async enroll(studentId: string, classId: string) {
    await delay()
    requireUser()
    if (seed.enrollments.some((e) => e.studentId === studentId && e.classId === classId && e.status === 'active'))
      throw new ApiError('Already enrolled in this class.', 409)
    seed.enrollments.push({
      id: genId('en'),
      studentId,
      classId,
      startDate: serverNow().toISOString().slice(0, 10),
      endDate: null,
      status: 'active',
    })
    recomputeEnrolledCount(classId)
    generateCurrentMonthDue(studentId, classId)
    writeAudit('create', 'Enrollment', `${studentId}:${classId}`, null, null, null)
  },
  async unenroll(studentId: string, classId: string) {
    await delay()
    requireUser()
    const e = seed.enrollments.find((x) => x.studentId === studentId && x.classId === classId && x.status === 'active')
    if (!e) throw new ApiError('Not enrolled.', 404)
    e.status = 'ended'
    e.endDate = serverNow().toISOString().slice(0, 10)
    recomputeEnrolledCount(classId)
    writeAudit('update', 'Enrollment', e.id, null, { status: 'active' }, { status: 'ended' })
  },
}

/* ======================================================================
   Sessions & attendance
   ==================================================================== */

export const sessionApi = {
  async today(): Promise<Array<ClassSession & { className: string; teacherName: string; hall: string | null }>> {
    await delay(160)
    const today = serverNow().toISOString().slice(0, 10)
    return clone(
      seed.sessions
        .filter((s) => s.date === today)
        .map((s) => {
          const c = seed.classes.find((x) => x.id === s.classId)!
          return { ...s, className: `${c.grade} ${c.subjectName}`, teacherName: c.teacherName, hall: c.hall }
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    )
  },
  async get(id: string) {
    await delay(140)
    const s = seed.sessions.find((x) => x.id === id)
    if (!s) throw new ApiError('Session not found.', 404)
    const c = seed.classes.find((x) => x.id === s.classId)!
    const records = seed.attendance.filter((a) => a.sessionId === id)
    const roster = seed.enrollments.filter((e) => e.classId === s.classId && e.status === 'active')
    const presentIds = new Set(records.filter((r) => r.status !== 'void').map((r) => r.studentId))
    const absentees = roster
      .filter((e) => !presentIds.has(e.studentId))
      .map((e) => seed.students.find((x) => x.id === e.studentId)!)
    return {
      session: clone(s),
      class: clone(c),
      records: clone(records.sort((a, b) => (a.markedAt < b.markedAt ? 1 : -1))),
      absentees: clone(absentees),
      rosterCount: roster.length,
    }
  },
  async close(id: string) {
    await delay()
    requireUser()
    const s = seed.sessions.find((x) => x.id === id)
    if (!s) throw new ApiError('Session not found.', 404)
    s.status = 'closed'
    s.closedAt = serverNow().toISOString()
    const roster = seed.enrollments.filter((e) => e.classId === s.classId && e.status === 'active')
    s.absentCount = Math.max(0, roster.length - s.presentCount - s.lateCount)
    writeAudit('update', 'ClassSession', id, null, { status: 'open' }, { status: 'closed' })
    return clone(s)
  },
}

// Per-session monotonic scan clock so seeded/live scans get believable times.
const scanClock: Record<string, number> = {}
function nextScanTime(session: ClassSession): Date {
  const [h, m] = session.startTime.split(':').map(Number)
  const start = new Date(session.date)
  start.setHours(h, m, 0, 0)
  const count = (scanClock[session.id] ??= seed.attendance.filter((a) => a.sessionId === session.id).length)
  scanClock[session.id] = count + 1
  return new Date(start.getTime() + count * 90_000)
}

function feeStatusFor(studentId: string, classId: string) {
  const month = currentMonth()
  const due = seed.dues.find((d) => d.studentId === studentId && d.classId === classId && d.month === month)
  if (!due) return { month, isPaid: true, outstanding: 0 }
  return { month, isPaid: due.status === 'paid' || due.status === 'waived', outstanding: due.outstanding }
}

export const attendanceApi = {
  /** The core door flow — FR-050..055, FR-080. */
  async scan(token: string, sessionId: string): Promise<ScanResult> {
    await delay(160)
    const actor = requireUser()
    const session = seed.sessions.find((s) => s.id === sessionId)
    if (!session) throw new ApiError('Session not found.', 404)
    const cls = seed.classes.find((c) => c.id === session.classId)!

    const qr = seed.qrTokens.find((q) => q.token === token)
    if (!qr) {
      return blankScan('unknown_card')
    }
    if (!qr.isActive || qr.revokedAt) {
      return blankScan('card_revoked')
    }
    const student = seed.students.find((s) => s.id === qr.studentId)!
    const enrolled = seed.enrollments.some(
      (e) => e.studentId === student.id && e.classId === session.classId && e.status === 'active',
    )
    const studentBrief = {
      id: student.id,
      studentCode: student.studentCode,
      fullName: student.fullName,
      displayName: student.displayName,
      photoUrl: student.photoUrl,
      grade: student.grade,
    }
    const className = `${cls.grade} ${cls.subjectName}`

    if (!enrolled) {
      return {
        outcome: 'not_enrolled',
        student: studentBrief,
        className,
        alreadyMarkedAt: null,
        attendance: null,
        feeStatus: null,
        isLate: false,
      }
    }

    // FR-053: duplicate scan for the same session.
    const existing = seed.attendance.find(
      (a) => a.sessionId === sessionId && a.studentId === student.id && a.status !== 'void',
    )
    if (existing) {
      return {
        outcome: 'duplicate',
        student: studentBrief,
        className,
        alreadyMarkedAt: existing.markedAt,
        attendance: clone(existing),
        feeStatus: feeStatusFor(student.id, session.classId),
        isLate: existing.status === 'late',
      }
    }

    const markedAt = nextScanTime(session)
    const isLate = session.lateAfter ? markedAt > new Date(session.lateAfter) : false
    const record: AttendanceRecord = {
      id: genId('at'),
      sessionId,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      status: isLate ? 'late' : 'present',
      method: 'scan',
      markedAt: markedAt.toISOString(),
      capturedAt: null,
      markedByUserId: actor.id,
      markedByName: actor.fullName,
      deviceId: `device-${actor.id.slice(-4)}`,
      reason: null,
      isGuest: false,
      voidedAt: null,
      voidedReason: null,
    }
    seed.attendance.push(record)
    if (isLate) session.lateCount++
    else session.presentCount++
    if (session.status === 'scheduled') session.status = 'open'
    writeAudit('scan', 'AttendanceRecord', record.id, className, null, { student: student.studentCode })

    const fee = feeStatusFor(student.id, session.classId)
    return {
      outcome: fee.isPaid ? 'ok' : 'unpaid',
      student: studentBrief,
      className,
      alreadyMarkedAt: null,
      attendance: clone(record),
      feeStatus: fee,
      isLate,
    }
  },

  /** FR-056: manual marking with a mandatory reason. */
  async markManual(sessionId: string, studentId: string, reason: string): Promise<AttendanceRecord> {
    await delay()
    const actor = requireUser()
    const session = seed.sessions.find((s) => s.id === sessionId)
    if (!session) throw new ApiError('Session not found.', 404)
    if (!reason.trim()) throw new ApiError('A reason is required for a manual mark.', 400)
    if (seed.attendance.some((a) => a.sessionId === sessionId && a.studentId === studentId && a.status !== 'void'))
      throw new ApiError('Already marked for this session.', 409)
    const student = seed.students.find((s) => s.id === studentId)!
    const markedAt = nextScanTime(session)
    const isLate = session.lateAfter ? markedAt > new Date(session.lateAfter) : false
    const record: AttendanceRecord = {
      id: genId('at'),
      sessionId,
      studentId,
      studentName: student.fullName,
      studentCode: student.studentCode,
      status: isLate ? 'late' : 'present',
      method: 'manual',
      markedAt: markedAt.toISOString(),
      capturedAt: null,
      markedByUserId: actor.id,
      markedByName: actor.fullName,
      deviceId: `device-${actor.id.slice(-4)}`,
      reason,
      isGuest: false,
      voidedAt: null,
      voidedReason: null,
    }
    seed.attendance.push(record)
    if (isLate) session.lateCount++
    else session.presentCount++
    writeAudit('create', 'AttendanceRecord', record.id, 'manual', null, { reason })
    return clone(record)
  },

  /** FR-057: Super Admin void (assistants raise a correction request instead). */
  async voidRecord(id: string, reason: string): Promise<AttendanceRecord> {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can void a record.', 403)
    const rec = seed.attendance.find((a) => a.id === id)
    if (!rec) throw new ApiError('Record not found.', 404)
    rec.status = 'void'
    rec.voidedAt = serverNow().toISOString()
    rec.voidedReason = reason
    writeAudit('void', 'AttendanceRecord', id, null, null, { reason })
    return clone(rec)
  },
}

function blankScan(outcome: ScanResult['outcome']): ScanResult {
  return { outcome, student: null, className: null, alreadyMarkedAt: null, attendance: null, feeStatus: null, isLate: false }
}

/* ======================================================================
   Cards (FR-040..043)
   ==================================================================== */

export const cardApi = {
  async activeToken(studentId: string) {
    await delay(120)
    const t = seed.qrTokens.find((q) => q.studentId === studentId && q.isActive)
    return t ? clone(t) : null
  },
  async reissue(studentId: string, reason: string) {
    await delay()
    requireUser()
    const student = seed.students.find((s) => s.id === studentId)
    if (!student) throw new ApiError('Student not found.', 404)
    const prev = seed.qrTokens.find((q) => q.studentId === studentId && q.isActive)
    const now = serverNow().toISOString()
    if (prev) {
      prev.isActive = false
      prev.revokedAt = now
      prev.revokedReason = reason
    }
    const token = {
      id: genId('qr'),
      studentId,
      token: `TIMS-${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
      issuedAt: now,
      revokedAt: null,
      revokedReason: null,
      isActive: true,
      issueNumber: (prev?.issueNumber ?? 0) + 1,
    }
    seed.qrTokens.push(token)
    writeAudit('card_reissue', 'QRToken', token.id, student.studentCode, null, { reason })
    return clone(token)
  },
}

/* ======================================================================
   Fees, dues, payments
   ==================================================================== */

function generateCurrentMonthDue(studentId: string, classId: string) {
  const month = currentMonth()
  if (seed.dues.some((d) => d.studentId === studentId && d.classId === classId && d.month === month)) return
  const cls = seed.classes.find((c) => c.id === classId)!
  const student = seed.students.find((s) => s.id === studentId)!
  seed.dues.push({
    id: genId('due'),
    studentId,
    studentName: student.fullName,
    studentCode: student.studentCode,
    classId,
    className: `${cls.grade} ${cls.subjectName}`,
    month,
    kind: 'monthly_fee',
    grossAmount: cls.monthlyFee,
    discountAmount: 0,
    netAmount: cls.monthlyFee,
    paidAmount: 0,
    outstanding: cls.monthlyFee,
    status: 'unpaid',
    dueDate: `${month}-05`,
  })
}

export const feeApi = {
  /** Outstanding dues for a student, for the payment screen. */
  async openDues(studentId: string): Promise<Due[]> {
    await delay(140)
    return clone(
      seed.dues
        .filter((d) => d.studentId === studentId && d.outstanding > 0)
        .sort((a, b) => a.month.localeCompare(b.month)),
    )
  },
  async duesForStudent(studentId: string): Promise<Due[]> {
    await delay(140)
    return clone(seed.dues.filter((d) => d.studentId === studentId).sort((a, b) => b.month.localeCompare(a.month)))
  },
  /** FR-079: arrears across the institute. */
  async arrears(): Promise<Due[]> {
    await delay()
    return clone(
      seed.dues
        .filter((d) => d.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding),
    )
  },
}

export interface PaymentInput {
  studentId: string
  allocations: Array<{ dueId: string; amount: number }>
  method: 'cash' | 'bank_transfer'
  bankReference?: string | null
}

let receiptCounter = 9000

export const paymentApi = {
  async list(): Promise<Payment[]> {
    await delay()
    return clone([...seed.payments].sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1)))
  },
  async get(id: string): Promise<Payment> {
    await delay(120)
    const p = seed.payments.find((x) => x.id === id)
    if (!p) throw new ApiError('Payment not found.', 404)
    return clone(p)
  },
  /** FR-072..075: record a payment, allocate to dues, mint a receipt. */
  async record(input: PaymentInput): Promise<Payment> {
    await delay()
    const actor = requireUser()
    const student = seed.students.find((s) => s.id === input.studentId)
    if (!student) throw new ApiError('Student not found.', 404)
    if (!input.allocations.length) throw new ApiError('Select at least one month to pay.', 400)

    const allocations = input.allocations.map((a) => {
      const due = seed.dues.find((d) => d.id === a.dueId)
      if (!due) throw new ApiError('Due not found.', 404)
      if (a.amount <= 0 || a.amount > due.outstanding)
        throw new ApiError(`Amount for ${due.className} exceeds the outstanding balance.`, 400)
      return { due, amount: a.amount }
    })

    // Apply allocations (partial payments supported — FR-075).
    for (const { due, amount } of allocations) {
      due.paidAmount += amount
      due.outstanding = Math.max(0, due.netAmount - due.paidAmount)
      due.status = due.outstanding === 0 ? 'paid' : 'partial'
    }

    const total = allocations.reduce((sum, a) => sum + a.amount, 0)
    receiptCounter++
    const payment: Payment = {
      id: genId('pay'),
      receiptNumber: `RCP-2026-${String(receiptCounter).padStart(5, '0')}`,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      allocations: allocations.map(({ due, amount }) => ({
        dueId: due.id,
        classId: due.classId,
        className: due.className,
        month: due.month,
        amount,
      })),
      amount: total,
      method: input.method,
      bankReference: input.bankReference ?? null,
      paidAt: serverNow().toISOString(),
      collectedByUserId: actor.id,
      collectedByName: actor.fullName,
      deviceId: `device-${actor.id.slice(-4)}`,
      status: 'valid',
      voidedAt: null,
      voidedReason: null,
      voidedByUserId: null,
      reprintCount: 0,
    }
    seed.payments.push(payment)
    writeAudit('payment', 'Payment', payment.id, payment.receiptNumber, null, { amount: total })
    return clone(payment)
  },
  /** FR-077: Super Admin void. Original stays visible. */
  async voidPayment(id: string, reason: string): Promise<Payment> {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can void a payment.', 403)
    const p = seed.payments.find((x) => x.id === id)
    if (!p) throw new ApiError('Payment not found.', 404)
    if (p.status === 'void') throw new ApiError('Already voided.', 409)
    // Reverse the allocations.
    for (const alloc of p.allocations) {
      const due = seed.dues.find((d) => d.id === alloc.dueId)
      if (due) {
        due.paidAmount = Math.max(0, due.paidAmount - alloc.amount)
        due.outstanding = Math.max(0, due.netAmount - due.paidAmount)
        due.status = due.paidAmount === 0 ? 'unpaid' : due.outstanding === 0 ? 'paid' : 'partial'
      }
    }
    p.status = 'void'
    p.voidedAt = serverNow().toISOString()
    p.voidedReason = reason
    p.voidedByUserId = actor.id
    writeAudit('void', 'Payment', id, p.receiptNumber, null, { reason })
    return clone(p)
  },
  async reprint(id: string): Promise<Payment> {
    await delay(120)
    requireUser()
    const p = seed.payments.find((x) => x.id === id)
    if (!p) throw new ApiError('Payment not found.', 404)
    p.reprintCount++
    writeAudit('receipt_reprint', 'Payment', id, p.receiptNumber, null, { reprintCount: p.reprintCount })
    return clone(p)
  },
  /** FR-078: per-assistant collection for a day. */
  async collection(dateIso: string) {
    await delay(160)
    const day = dateIso.slice(0, 10)
    const rows = seed.payments.filter((p) => p.status === 'valid' && p.paidAt.slice(0, 10) === day)
    const byAssistant = new Map<string, { userId: string; name: string; amount: number; count: number; cash: number; transfer: number }>()
    for (const p of rows) {
      const entry = byAssistant.get(p.collectedByUserId) ?? {
        userId: p.collectedByUserId,
        name: p.collectedByName,
        amount: 0,
        count: 0,
        cash: 0,
        transfer: 0,
      }
      entry.amount += p.amount
      entry.count++
      if (p.method === 'cash') entry.cash += p.amount
      else entry.transfer += p.amount
      byAssistant.set(p.collectedByUserId, entry)
    }
    return {
      date: day,
      total: rows.reduce((s, p) => s + p.amount, 0),
      byAssistant: [...byAssistant.values()].sort((a, b) => b.amount - a.amount),
      payments: clone(rows.sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))),
    }
  },
}

/* ======================================================================
   Discounts (FR-076)
   ==================================================================== */

export const discountApi = {
  async list(): Promise<Discount[]> {
    await delay()
    return clone(seed.discounts)
  },
  async decide(id: string, approve: boolean, note?: string) {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can approve discounts.', 403)
    const d = seed.discounts.find((x) => x.id === id)
    if (!d) throw new ApiError('Discount not found.', 404)
    d.status = approve ? 'approved' : 'rejected'
    d.approvedByUserId = actor.id
    d.approvedByName = actor.fullName
    d.approvedAt = serverNow().toISOString()
    writeAudit(approve ? 'approve' : 'reject', 'Discount', id, d.studentName, null, { note: note ?? null })
    return clone(d)
  },
}

/* ======================================================================
   Corrections (§6.4)
   ==================================================================== */

export const correctionApi = {
  async list(): Promise<CorrectionRequest[]> {
    await delay()
    return clone([...seed.corrections].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1)))
  },
  async raise(input: { targetType: CorrectionRequest['targetType']; targetId: string; reason: string; proposedChange: string }) {
    await delay()
    const actor = requireUser()
    const c: CorrectionRequest = {
      id: genId('corr'),
      targetType: input.targetType,
      targetId: input.targetId,
      requestedByUserId: actor.id,
      requestedByName: actor.fullName,
      requestedAt: serverNow().toISOString(),
      reason: input.reason,
      proposedChange: input.proposedChange,
      status: 'pending',
      reviewedByUserId: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewNote: null,
    }
    seed.corrections.push(c)
    writeAudit('create', 'CorrectionRequest', c.id, input.targetType, null, null)
    return clone(c)
  },
  async decide(id: string, approve: boolean, note: string) {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can review corrections.', 403)
    const c = seed.corrections.find((x) => x.id === id)
    if (!c) throw new ApiError('Correction not found.', 404)
    c.status = approve ? 'approved' : 'rejected'
    c.reviewedByUserId = actor.id
    c.reviewedByName = actor.fullName
    c.reviewedAt = serverNow().toISOString()
    c.reviewNote = note
    // On approval, void the referenced record (retained, marked VOID).
    if (approve && c.targetType === 'payment') {
      const p = seed.payments.find((x) => x.id === c.targetId)
      if (p && p.status === 'valid') {
        p.status = 'void'
        p.voidedAt = serverNow().toISOString()
        p.voidedReason = `Correction ${c.id}: ${c.reason}`
        p.voidedByUserId = actor.id
      }
    }
    if (approve && c.targetType === 'attendance') {
      const a = seed.attendance.find((x) => x.id === c.targetId)
      if (a && a.status !== 'void') {
        a.status = 'void'
        a.voidedAt = serverNow().toISOString()
        a.voidedReason = `Correction ${c.id}: ${c.reason}`
      }
    }
    writeAudit(approve ? 'approve' : 'reject', 'CorrectionRequest', id, c.targetType, null, { note })
    return clone(c)
  },
}

/* ======================================================================
   Users (§2, FR-001..006)
   ==================================================================== */

export const userApi = {
  async list(): Promise<User[]> {
    await delay()
    return clone(seed.users)
  },
  async create(input: { fullName: string; username: string; email: string | null; phone: string | null; role: User['role'] }) {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can manage users.', 403)
    if (seed.users.some((u) => u.username === input.username)) throw new ApiError('That username is taken.', 409)
    const u: User = {
      id: genId('u'),
      fullName: input.fullName,
      username: input.username,
      email: input.email,
      phone: input.phone,
      photoUrl: null,
      role: input.role,
      isActive: true,
      mustChangePassword: true, // FR-004
      twoFactorEnabled: false,
      lastLoginAt: null,
      createdAt: serverNow().toISOString(),
    }
    seed.users.push(u)
    writeAudit('create', 'User', u.id, u.username, null, { role: u.role })
    return clone(u)
  },
  async setActive(id: string, isActive: boolean) {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can manage users.', 403)
    const u = seed.users.find((x) => x.id === id)
    if (!u) throw new ApiError('User not found.', 404)
    // There must always be at least one active Super Admin (§2).
    if (!isActive && u.role === 'super_admin') {
      const otherActiveAdmins = seed.users.filter((x) => x.role === 'super_admin' && x.isActive && x.id !== id)
      if (otherActiveAdmins.length === 0)
        throw new ApiError('Cannot deactivate the only active Super Admin.', 400)
    }
    u.isActive = isActive
    writeAudit(isActive ? 'reactivate' : 'deactivate', 'User', id, u.username, null, null)
    return clone(u)
  },
}

/* ======================================================================
   Audit (FR-090..093)
   ==================================================================== */

function writeAudit(
  action: import('@/types/domain').AuditAction,
  entityType: string,
  entityId: string,
  entityLabel: string | null,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) {
  const actor = seed.users.find((u) => u.id === sessionUserId)
  if (!actor) return
  seed.audit.unshift({
    id: genId('aud'),
    actorUserId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    entityLabel,
    before,
    after,
    occurredAt: serverNow().toISOString(),
    ipAddress: '192.168.1.10',
    deviceId: `device-${actor.id.slice(-4)}`,
    userAgent: 'Web',
  })
}

export const auditApi = {
  async list(): Promise<import('@/types/domain').AuditLogEntry[]> {
    await delay()
    const actor = requireUser()
    if (actor.role !== 'super_admin') throw new ApiError('Only a Super Admin can view the audit log.', 403)
    return clone(seed.audit)
  },
}

/* ======================================================================
   Dashboard & reports (§3.10)
   ==================================================================== */

export const reportApi = {
  async dashboard(): Promise<DashboardSummary> {
    await delay(200)
    const today = serverNow().toISOString().slice(0, 10)
    const month = currentMonth()
    const prevMonth = (() => {
      const d = serverNow()
      d.setMonth(d.getMonth() - 1)
      return monthKey(d)
    })()

    const todaySessions = seed.sessions.filter((s) => s.date === today)
    const todayScans = seed.attendance.filter((a) => a.markedAt.slice(0, 10) === today && a.status !== 'void').length
    const todayPayments = seed.payments.filter((p) => p.status === 'valid' && p.paidAt.slice(0, 10) === today)

    const monthRevenue = (m: string) =>
      seed.payments
        .filter((p) => p.status === 'valid' && p.paidAt.slice(0, 7) === m)
        .reduce((s, p) => s + p.amount, 0)

    const byAssistant = new Map<string, { userId: string; name: string; amount: number; count: number }>()
    for (const p of todayPayments) {
      const e = byAssistant.get(p.collectedByUserId) ?? { userId: p.collectedByUserId, name: p.collectedByName, amount: 0, count: 0 }
      e.amount += p.amount
      e.count++
      byAssistant.set(p.collectedByUserId, e)
    }

    return {
      todaySessions: {
        total: todaySessions.length,
        open: todaySessions.filter((s) => s.status === 'open').length,
        closed: todaySessions.filter((s) => s.status === 'closed').length,
      },
      todayScans,
      todayCollection: todayPayments.reduce((s, p) => s + p.amount, 0),
      collectionByAssistant: [...byAssistant.values()],
      monthToDateRevenue: monthRevenue(month),
      previousMonthRevenue: monthRevenue(prevMonth),
      arrearsTotal: seed.dues.filter((d) => d.outstanding > 0).reduce((s, d) => s + d.outstanding, 0),
      activeStudents: seed.students.filter((s) => s.status === 'active').length,
      alerts: {
        longAbsentees: 7,
        unpaidStudents: new Set(seed.dues.filter((d) => d.month === month && d.outstanding > 0).map((d) => d.studentId)).size,
        pendingCorrections: seed.corrections.filter((c) => c.status === 'pending').length,
        pendingDiscounts: seed.discounts.filter((d) => d.status === 'pending').length,
      },
    }
  },

  async revenueTrend(months = 6): Promise<TrendPoint[]> {
    await delay(160)
    const out: TrendPoint[] = []
    const base = serverNow()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(base)
      d.setMonth(d.getMonth() - i)
      const m = monthKey(d)
      const value = seed.payments
        .filter((p) => p.status === 'valid' && p.paidAt.slice(0, 7) === m)
        .reduce((s, p) => s + p.amount, 0)
      out.push({ label: d.toLocaleString('en', { month: 'short' }), value })
    }
    return out
  },

  async todaySessions() {
    return sessionApi.today()
  },

  /** FR-112: collections grouped by dimension. */
  async financialSummary() {
    await delay(180)
    const valid = seed.payments.filter((p) => p.status === 'valid')
    const byMonth = new Map<string, number>()
    const byClass = new Map<string, number>()
    const byAssistant = new Map<string, number>()
    for (const p of valid) {
      byMonth.set(p.paidAt.slice(0, 7), (byMonth.get(p.paidAt.slice(0, 7)) ?? 0) + p.amount)
      byAssistant.set(p.collectedByName, (byAssistant.get(p.collectedByName) ?? 0) + p.amount)
      for (const a of p.allocations) byClass.set(a.className, (byClass.get(a.className) ?? 0) + a.amount)
    }
    return {
      totalCollected: valid.reduce((s, p) => s + p.amount, 0),
      voidedCount: seed.payments.filter((p) => p.status === 'void').length,
      voidedAmount: seed.payments.filter((p) => p.status === 'void').reduce((s, p) => s + p.amount, 0),
      arrears: seed.dues.filter((d) => d.outstanding > 0).reduce((s, d) => s + d.outstanding, 0),
      byMonth: [...byMonth.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)),
      byClass: [...byClass.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      byAssistant: [...byAssistant.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    }
  },

  /** FR-113: enrollment analytics. */
  async enrollmentSummary() {
    await delay(160)
    const byGrade = new Map<string, number>()
    for (const s of seed.students.filter((x) => x.status === 'active')) {
      byGrade.set(s.grade, (byGrade.get(s.grade) ?? 0) + 1)
    }
    const byClass = seed.classes.map((c) => ({ label: `${c.grade} ${c.subjectName}`, value: c.enrolledCount }))
    return {
      activeStudents: seed.students.filter((s) => s.status === 'active').length,
      inactive: seed.students.filter((s) => s.status === 'inactive').length,
      left: seed.students.filter((s) => s.status === 'left').length,
      byGrade: [...byGrade.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)),
      byClass: byClass.sort((a, b) => b.value - a.value),
    }
  },

  /** FR-111: attendance analytics. */
  async attendanceSummary() {
    await delay(160)
    const closed = seed.sessions.filter((s) => s.status === 'closed')
    const byClass = new Map<string, { present: number; total: number }>()
    for (const s of closed) {
      const c = seed.classes.find((x) => x.id === s.classId)!
      const label = `${c.grade} ${c.subjectName}`
      const e = byClass.get(label) ?? { present: 0, total: 0 }
      e.present += s.presentCount + s.lateCount
      e.total += s.presentCount + s.lateCount + s.absentCount
      byClass.set(label, e)
    }
    return {
      sessionsHeld: closed.length,
      avgAttendance:
        closed.length === 0
          ? 0
          : Math.round(
              ([...byClass.values()].reduce((s, v) => s + (v.total ? v.present / v.total : 0), 0) / byClass.size) * 100,
            ),
      byClass: [...byClass.entries()]
        .map(([label, v]) => ({ label, value: v.total ? Math.round((v.present / v.total) * 100) : 0 }))
        .sort((a, b) => b.value - a.value),
    }
  },

  /** FR-082: teacher payment report. */
  async teacherPayments() {
    await delay(180)
    const month = currentMonth()
    return seed.teachers.map((t) => {
      const arr = seed.teacherArrangements[t.id]
      const classIds = seed.classes.filter((c) => c.teacherId === t.id).map((c) => c.id)
      const collected = seed.payments
        .filter((p) => p.status === 'valid' && p.paidAt.slice(0, 7) === month)
        .flatMap((p) => p.allocations)
        .filter((a) => classIds.includes(a.classId))
        .reduce((s, a) => s + a.amount, 0)
      const sessionsThisMonth = seed.sessions.filter(
        (s) => classIds.includes(s.classId) && s.date.slice(0, 7) === month && s.status === 'closed',
      ).length
      let owed = 0
      if (arr?.type === 'revenue_share') owed = Math.round((collected * (arr.percentage ?? 0)) / 100)
      else if (arr?.type === 'fixed_monthly') owed = arr.amount ?? 0
      else if (arr?.type === 'per_session') owed = (arr.amount ?? 0) * sessionsThisMonth
      return {
        teacherId: t.id,
        teacherName: t.fullName,
        arrangement: arr,
        collected,
        sessionsThisMonth,
        owed,
      }
    })
  },
}
