import type {
  AttendanceRecord,
  AuditLogEntry,
  ClassRecord,
  ClassSession,
  CorrectionRequest,
  Discount,
  Due,
  Enrollment,
  Grade,
  Guardian,
  Payment,
  QRToken,
  Student,
  Subject,
  Teacher,
  User,
} from '@/types/domain'
import { makeRng } from './prng'

/**
 * The seeded demo dataset.
 *
 * Everything here is fabricated but internally consistent: students are
 * enrolled in real classes, sessions belong to those classes, attendance
 * belongs to those sessions, dues follow the enrolments, and payments settle
 * those dues. This is what lets every screen work before the API exists.
 *
 * The whole file is disposable. When the backend lands, `lib/api/endpoints.ts`
 * stops importing the mock store and nothing here ships.
 */

const rng = makeRng(20260721)

/** "today" is pinned so the demo reads sensibly regardless of the real date.
 *  A Saturday on purpose — the requirements' peak is weekend mornings, so this
 *  puts several classes on today's board (one in progress, some upcoming). */
export const DEMO_TODAY = new Date('2026-07-25T09:00:00')

const iso = (d: Date) => d.toISOString()
const isoDate = (d: Date) => d.toISOString().slice(0, 10)
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

const FIRST = [
  'Nimal', 'Kamala', 'Sunil', 'Dilani', 'Tharindu', 'Ishara', 'Kasun', 'Nadeesha',
  'Ruwan', 'Piyumi', 'Sahan', 'Hiruni', 'Chathura', 'Amaya', 'Dinuka', 'Sanduni',
  'Lahiru', 'Nethmi', 'Pasindu', 'Oshadi', 'Gayan', 'Thilini', 'Roshan', 'Malsha',
  'Yasas', 'Umesha', 'Buddhika', 'Sewwandi', 'Chamara', 'Dulani', 'Isuru', 'Rashmi',
  'Kavindu', 'Ashen', 'Tharush', 'Vihanga', 'Senuri', 'Devmi', 'Rahal', 'Minoli',
]
const LAST = [
  'Perera', 'Silva', 'Fernando', 'Bandara', 'Jayawardena', 'Wickramasinghe',
  'Gunawardena', 'Ratnayake', 'Dissanayake', 'Weerasinghe', 'Rajapaksa', 'Herath',
  'Senanayake', 'Kumara', 'Ekanayake', 'Pathirana',
]
const RELATIONSHIPS = ['Mother', 'Father', 'Guardian']

const name = () => `${rng.pick(FIRST)} ${rng.pick(LAST)}`
const phone = () => `07${rng.int(0, 8)} ${rng.int(100, 999)} ${rng.int(1000, 9999)}`

/* --- Users (§2) --------------------------------------------------------- */

export const users: User[] = [
  {
    id: 'u-owner',
    fullName: 'Chamika Denuwan',
    username: 'owner',
    email: 'owner@institute.lk',
    phone: phone(),
    photoUrl: null,
    role: 'super_admin',
    isActive: true,
    mustChangePassword: false,
    twoFactorEnabled: true,
    lastLoginAt: iso(addDays(DEMO_TODAY, 0)),
    createdAt: iso(new Date('2026-01-02')),
  },
  {
    id: 'u-asha',
    fullName: 'Ashen Fernando',
    username: 'ashen.f',
    email: 'ashen@institute.lk',
    phone: phone(),
    photoUrl: null,
    role: 'assistant',
    isActive: true,
    mustChangePassword: false,
    twoFactorEnabled: false,
    lastLoginAt: iso(addDays(DEMO_TODAY, 0)),
    createdAt: iso(new Date('2026-01-10')),
  },
  {
    id: 'u-dilani',
    fullName: 'Dilani Silva',
    username: 'dilani.s',
    email: 'dilani@institute.lk',
    phone: phone(),
    photoUrl: null,
    role: 'assistant',
    isActive: true,
    mustChangePassword: false,
    twoFactorEnabled: false,
    lastLoginAt: iso(addDays(DEMO_TODAY, -1)),
    createdAt: iso(new Date('2026-02-01')),
  },
  {
    id: 'u-roshan',
    fullName: 'Roshan Perera',
    username: 'roshan.p',
    email: null,
    phone: phone(),
    photoUrl: null,
    role: 'assistant',
    isActive: false,
    mustChangePassword: false,
    twoFactorEnabled: false,
    lastLoginAt: iso(addDays(DEMO_TODAY, -40)),
    createdAt: iso(new Date('2026-01-15')),
  },
]

const assistantIds = users.filter((u) => u.role === 'assistant' && u.isActive).map((u) => u.id)

/* --- Subjects & grades (FR-030) ----------------------------------------- */

export const subjects: Subject[] = [
  { id: 'sub-math', name: 'Mathematics', code: 'MATH', isActive: true },
  { id: 'sub-sci', name: 'Science', code: 'SCI', isActive: true },
  { id: 'sub-eng', name: 'English', code: 'ENG', isActive: true },
  { id: 'sub-chem', name: 'Chemistry', code: 'CHEM', isActive: true },
  { id: 'sub-phy', name: 'Physics', code: 'PHY', isActive: true },
  { id: 'sub-ict', name: 'ICT', code: 'ICT', isActive: true },
]

export const grades: Grade[] = [
  { id: 'g-9', name: 'Grade 9', sortOrder: 9, isActive: true },
  { id: 'g-10', name: 'Grade 10', sortOrder: 10, isActive: true },
  { id: 'g-11', name: 'Grade 11', sortOrder: 11, isActive: true },
  { id: 'g-12', name: 'Grade 12', sortOrder: 12, isActive: true },
  { id: 'g-13', name: 'Grade 13', sortOrder: 13, isActive: true },
]

/* --- Teachers (FR-020..023) --------------------------------------------- */

const teacherSpecs: Array<{ id: string; name: string; subs: string[]; grades: string[] }> = [
  { id: 't-perera', name: 'Mr. Perera', subs: ['sub-math'], grades: ['Grade 10', 'Grade 11'] },
  { id: 't-silva', name: 'Mrs. Silva', subs: ['sub-sci', 'sub-chem'], grades: ['Grade 11', 'Grade 12'] },
  { id: 't-fernando', name: 'Ms. Fernando', subs: ['sub-eng'], grades: ['Grade 9', 'Grade 10'] },
  { id: 't-bandara', name: 'Mr. Bandara', subs: ['sub-chem', 'sub-phy'], grades: ['Grade 12', 'Grade 13'] },
  { id: 't-jaya', name: 'Mr. Jayawardena', subs: ['sub-phy'], grades: ['Grade 13'] },
  { id: 't-ratnayake', name: 'Ms. Ratnayake', subs: ['sub-ict'], grades: ['Grade 10', 'Grade 11'] },
]

export const teachers: Teacher[] = teacherSpecs.map((t, i) => ({
  id: t.id,
  teacherCode: `TCH-${String(i + 1).padStart(3, '0')}`,
  fullName: t.name,
  phone: phone(),
  email: rng.chance(0.6) ? `${t.id.replace('t-', '')}@mail.lk` : null,
  address: rng.chance(0.5) ? `${rng.int(1, 200)}, Temple Road, Colombo` : null,
  nicNumber: rng.chance(0.7) ? `${rng.int(70, 99)}${rng.int(100000, 999999)}V` : null,
  photoUrl: null,
  subjectIds: t.subs,
  grades: t.grades,
  isActive: true,
  createdAt: iso(new Date('2026-01-05')),
}))

// Payment arrangements kept in a side-table so they don't inflate the base
// Teacher type. Used by the teacher payment report (FR-023 / FR-082).
export const teacherArrangements: Record<
  string,
  { type: 'per_session' | 'fixed_monthly' | 'revenue_share'; amount: number | null; percentage: number | null }
> = {}
teacherSpecs.forEach((t, i) => {
  const arrangements = [
    { type: 'revenue_share' as const, amount: null, percentage: 70 },
    { type: 'fixed_monthly' as const, amount: 60_000_00, percentage: null },
    { type: 'per_session' as const, amount: 5_000_00, percentage: null },
  ]
  teacherArrangements[t.id] = arrangements[i % arrangements.length]
})

/* --- Classes (FR-031) --------------------------------------------------- */

interface ClassSpec {
  id: string
  subjectId: string
  grade: string
  teacherId: string
  weekday: number
  start: string
  end: string
  hall: string
  fee: number
  capacity: number | null
}

const classSpecs: ClassSpec[] = [
  { id: 'c-m10', subjectId: 'sub-math', grade: 'Grade 10', teacherId: 't-perera', weekday: 6, start: '08:00', end: '10:00', hall: 'Hall A', fee: 2_500_00, capacity: 45 },
  { id: 'c-m11', subjectId: 'sub-math', grade: 'Grade 11', teacherId: 't-perera', weekday: 6, start: '10:15', end: '12:15', hall: 'Hall A', fee: 2_800_00, capacity: 45 },
  { id: 'c-s11', subjectId: 'sub-sci', grade: 'Grade 11', teacherId: 't-silva', weekday: 0, start: '08:00', end: '10:00', hall: 'Hall B', fee: 2_800_00, capacity: 40 },
  { id: 'c-e9', subjectId: 'sub-eng', grade: 'Grade 9', teacherId: 't-fernando', weekday: 3, start: '15:00', end: '16:30', hall: 'Hall A', fee: 2_000_00, capacity: 35 },
  { id: 'c-e10', subjectId: 'sub-eng', grade: 'Grade 10', teacherId: 't-fernando', weekday: 3, start: '16:45', end: '18:15', hall: 'Hall A', fee: 2_200_00, capacity: 35 },
  { id: 'c-ch12', subjectId: 'sub-chem', grade: 'Grade 12', teacherId: 't-bandara', weekday: 6, start: '13:00', end: '15:30', hall: 'Lab 1', fee: 3_500_00, capacity: 30 },
  { id: 'c-p13', subjectId: 'sub-phy', grade: 'Grade 13', teacherId: 't-jaya', weekday: 2, start: '06:00', end: '08:00', hall: 'Lab 2', fee: 3_800_00, capacity: 25 },
  { id: 'c-ict10', subjectId: 'sub-ict', grade: 'Grade 10', teacherId: 't-ratnayake', weekday: 5, start: '14:00', end: '16:00', hall: 'Computer Lab', fee: 3_000_00, capacity: 24 },
]

const subjectName = (id: string) => subjects.find((s) => s.id === id)!.name
const teacherName = (id: string) => teachers.find((t) => t.id === id)!.fullName

export const enrollments: Enrollment[] = []
export const students: Student[] = []
export const guardiansAll: Guardian[] = []
export const qrTokens: QRToken[] = []

/* --- Students, guardians, enrolments, QR tokens ------------------------- */

const STUDENT_COUNT = 46
for (let i = 0; i < STUDENT_COUNT; i++) {
  const grade = rng.pick(['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'])
  const full = name()
  const id = `st-${i + 1}`
  const status: Student['status'] = rng.chance(0.88) ? 'active' : rng.chance(0.5) ? 'inactive' : 'left'
  const regDate = addDays(DEMO_TODAY, -rng.int(20, 400))
  const studentAddress = `${rng.int(1, 300)}, ${rng.pick(['Galle Road', 'Kandy Road', 'Temple Lane', 'School Road', 'Main Street'])}, ${rng.pick(['Colombo', 'Gampaha', 'Kalutara', 'Nugegoda'])}`

  const guardianCount = rng.chance(0.25) ? 2 : 1
  const studentGuardians: Guardian[] = []
  for (let g = 0; g < guardianCount; g++) {
    studentGuardians.push({
      id: `gd-${id}-${g}`,
      studentId: id,
      fullName: `${rng.pick(FIRST)} ${full.split(' ')[1]}`,
      relationship: g === 0 ? rng.pick(RELATIONSHIPS) : 'Father',
      phonePrimary: phone(),
      phoneSecondary: rng.chance(0.3) ? phone() : null,
      email: rng.chance(0.3) ? `parent${i}@mail.lk` : null,
      address: studentAddress,
      isPrimary: g === 0,
    })
  }
  guardiansAll.push(...studentGuardians)

  students.push({
    id,
    studentCode: `STU-2026-${String(i + 1).padStart(4, '0')}`,
    fullName: full,
    displayName: rng.chance(0.3) ? full.split(' ')[0] : null,
    grade,
    academicYear: '2026',
    dateOfBirth: isoDate(addDays(new Date('2010-01-01'), rng.int(0, 1400))),
    gender: rng.pick(['male', 'female'] as const),
    address: studentAddress,
    phone: rng.chance(0.4) ? phone() : null,
    photoUrl: null,
    status,
    registrationDate: isoDate(regDate),
    notes: rng.chance(0.12) ? rng.pick(['Picked up by grandfather.', 'Peanut allergy.', 'Sits at the front — hearing.']) : null,
    guardians: studentGuardians,
    createdAt: iso(regDate),
    updatedAt: iso(regDate),
  })

  // Active QR token per student (FR-041). Opaque string; the real one is
  // server-minted from a CSPRNG — this is a placeholder.
  qrTokens.push({
    id: `qr-${id}`,
    studentId: id,
    token: `TIMS-${Math.floor(rng.next() * 1e12).toString(36).toUpperCase()}`,
    issuedAt: iso(regDate),
    revokedAt: null,
    revokedReason: null,
    isActive: true,
    issueNumber: 1,
  })

  // Enrol active/inactive students into 1–3 classes matching their grade.
  if (status !== 'left') {
    const eligible = classSpecs.filter((c) => c.grade === grade)
    const chosen = rng.sample(eligible, Math.min(eligible.length, rng.int(1, Math.min(3, eligible.length || 1))))
    for (const c of chosen) {
      enrollments.push({
        id: `en-${id}-${c.id}`,
        studentId: id,
        classId: c.id,
        startDate: isoDate(regDate),
        endDate: null,
        status: 'active',
      })
    }
  }
}

export const classes: ClassRecord[] = classSpecs.map((c) => ({
  id: c.id,
  classCode: c.id.toUpperCase(),
  subjectId: c.subjectId,
  subjectName: subjectName(c.subjectId),
  grade: c.grade,
  teacherId: c.teacherId,
  teacherName: teacherName(c.teacherId),
  schedules: [{ weekday: c.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6, startTime: c.start, endTime: c.end }],
  hall: c.hall,
  monthlyFee: c.fee,
  capacity: c.capacity,
  enrolledCount: enrollments.filter((e) => e.classId === c.id && e.status === 'active').length,
  isActive: true,
}))

/* --- Sessions (dated occurrences) --------------------------------------- */

export const sessions: ClassSession[] = []
export const attendance: AttendanceRecord[] = []

const studentName = (id: string) => students.find((s) => s.id === id)!.fullName
const studentCode = (id: string) => students.find((s) => s.id === id)!.studentCode
const userName = (id: string) => users.find((u) => u.id === id)!.fullName

// Generate the last ~6 weeks of sessions for each class, plus today's.
for (const c of classSpecs) {
  const cls = classes.find((x) => x.id === c.id)!
  for (let w = 6; w >= 0; w--) {
    const base = addDays(DEMO_TODAY, -w * 7)
    // find the class weekday within that week
    const delta = (c.weekday - base.getDay() + 7) % 7 - 7 + (base.getDay() === c.weekday ? 7 : 0)
    const sessionDate = addDays(base, ((c.weekday - base.getDay() + 7) % 7) - (w === 0 ? 0 : 0))
    void delta
    // Only keep sessions in the past or exactly today.
    if (sessionDate > DEMO_TODAY && !(w === 0 && isoDate(sessionDate) === isoDate(DEMO_TODAY))) continue

    const isToday = isoDate(sessionDate) === isoDate(DEMO_TODAY)
    const isPast = sessionDate < DEMO_TODAY && !isToday
    const [sh, sm] = c.start.split(':').map(Number)
    const startAt = new Date(sessionDate)
    startAt.setHours(sh, sm, 0, 0)
    const lateAfter = new Date(startAt.getTime() + 20 * 60000)

    const sessionId = `se-${c.id}-w${w}`
    const roster = enrollments.filter((e) => e.classId === c.id && e.status === 'active')

    let present = 0
    let late = 0
    if (isPast || (isToday && startAt < DEMO_TODAY)) {
      for (const e of roster) {
        if (!rng.chance(0.86)) continue // ~14% absent
        const isLate = rng.chance(0.12)
        const markedAt = new Date(startAt.getTime() + (isLate ? rng.int(21, 55) : rng.int(-8, 18)) * 60000)
        const method = rng.chance(0.92) ? 'scan' : 'manual'
        const assistant = rng.pick(assistantIds)
        attendance.push({
          id: `at-${sessionId}-${e.studentId}`,
          sessionId,
          studentId: e.studentId,
          studentName: studentName(e.studentId),
          studentCode: studentCode(e.studentId),
          status: isLate ? 'late' : 'present',
          method,
          markedAt: iso(markedAt),
          capturedAt: null,
          markedByUserId: assistant,
          markedByName: userName(assistant),
          deviceId: `device-${assistant.slice(-4)}`,
          reason: method === 'manual' ? rng.pick(['Forgot card', 'Damaged QR', 'New card pending']) : null,
          isGuest: false,
          voidedAt: null,
          voidedReason: null,
        })
        if (isLate) late++
        else present++
      }
    }

    sessions.push({
      id: sessionId,
      classId: c.id,
      date: isoDate(sessionDate),
      startTime: c.start,
      endTime: c.end,
      status: isPast ? 'closed' : isToday ? (startAt < DEMO_TODAY ? 'open' : 'scheduled') : 'scheduled',
      isAdHoc: false,
      lateAfter: iso(lateAfter),
      closedAt: isPast ? iso(new Date(startAt.getTime() + 3 * 3600000)) : null,
      presentCount: present,
      lateCount: late,
      absentCount: isPast ? Math.max(0, roster.length - present - late) : 0,
    })
    void cls
  }
}

/* --- Dues & payments (FR-071..075) -------------------------------------- */

export const dues: Due[] = []
export const payments: Payment[] = []

const MONTHS = [
  addDays(DEMO_TODAY, -62),
  addDays(DEMO_TODAY, -31),
  DEMO_TODAY,
].map(monthKey)

let receiptSeq = 8800
const className = (id: string) => {
  const c = classes.find((x) => x.id === id)!
  return `${c.grade} ${c.subjectName}`
}

for (const e of enrollments) {
  const cls = classes.find((c) => c.id === e.classId)!
  for (const m of MONTHS) {
    const gross = cls.monthlyFee
    // A few sibling/scholarship discounts.
    const hasDiscount = rng.chance(0.08)
    const discount = hasDiscount ? Math.round(gross * 0.5) : 0
    const net = gross - discount
    const dueId = `due-${e.studentId}-${e.classId}-${m}`

    // Payment likelihood: older months mostly paid, current month mixed.
    const isCurrent = m === MONTHS[MONTHS.length - 1]
    const roll = rng.next()
    let paid = 0
    if (!isCurrent) {
      paid = roll < 0.85 ? net : roll < 0.93 ? Math.round(net * 0.5) : 0
    } else {
      paid = roll < 0.55 ? net : roll < 0.62 ? Math.round(net * 0.5) : 0
    }

    const status: Due['status'] =
      discount === net ? 'waived' : paid >= net ? 'paid' : paid > 0 ? 'partial' : 'unpaid'

    dues.push({
      id: dueId,
      studentId: e.studentId,
      studentName: studentName(e.studentId),
      studentCode: studentCode(e.studentId),
      classId: e.classId,
      className: className(e.classId),
      month: m,
      kind: 'monthly_fee',
      grossAmount: gross,
      discountAmount: discount,
      netAmount: net,
      paidAmount: paid,
      outstanding: Math.max(0, net - paid),
      status,
      dueDate: `${m}-05`,
    })

    if (paid > 0) {
      const assistant = rng.pick(assistantIds)
      const payDate = addDays(new Date(`${m}-05`), rng.int(0, 10))
      receiptSeq++
      payments.push({
        id: `pay-${dueId}`,
        receiptNumber: `RCP-2026-${String(receiptSeq).padStart(5, '0')}`,
        studentId: e.studentId,
        studentName: studentName(e.studentId),
        studentCode: studentCode(e.studentId),
        allocations: [
          { dueId, classId: e.classId, className: className(e.classId), month: m, amount: paid },
        ],
        amount: paid,
        method: rng.chance(0.9) ? 'cash' : 'bank_transfer',
        bankReference: null,
        paidAt: iso(payDate),
        collectedByUserId: assistant,
        collectedByName: userName(assistant),
        deviceId: `device-${assistant.slice(-4)}`,
        status: 'valid',
        voidedAt: null,
        voidedReason: null,
        voidedByUserId: null,
        reprintCount: 0,
      })
    }
  }
}

// A couple of today's payments so the daily collection screen has data.
for (let i = 0; i < 6; i++) {
  const d = dues.find((x) => x.month === MONTHS[MONTHS.length - 1] && x.status === 'unpaid')
  if (!d) break
  const assistant = rng.pick(assistantIds)
  receiptSeq++
  const amt = d.netAmount
  payments.push({
    id: `pay-today-${i}`,
    receiptNumber: `RCP-2026-${String(receiptSeq).padStart(5, '0')}`,
    studentId: d.studentId,
    studentName: d.studentName,
    studentCode: d.studentCode,
    allocations: [{ dueId: d.id, classId: d.classId, className: d.className, month: d.month, amount: amt }],
    amount: amt,
    method: rng.chance(0.85) ? 'cash' : 'bank_transfer',
    bankReference: null,
    paidAt: iso(new Date(DEMO_TODAY.getTime() - i * 900000)),
    collectedByUserId: assistant,
    collectedByName: userName(assistant),
    deviceId: `device-${assistant.slice(-4)}`,
    status: 'valid',
    voidedAt: null,
    voidedReason: null,
    voidedByUserId: null,
    reprintCount: 0,
  })
  d.paidAmount = amt
  d.outstanding = 0
  d.status = 'paid'
}

/* --- Discounts (FR-076) ------------------------------------------------- */

export const discounts: Discount[] = []
for (let i = 0; i < 5; i++) {
  const s = rng.pick(students.filter((x) => x.status === 'active'))
  const c = rng.pick(classes)
  const pending = i < 2
  discounts.push({
    id: `disc-${i}`,
    studentId: s.id,
    studentName: s.fullName,
    classId: c.id,
    className: `${c.grade} ${c.subjectName}`,
    kind: rng.chance(0.6) ? 'percentage' : 'fixed',
    value: rng.chance(0.6) ? 50 : 1_000_00,
    reason: rng.pick(['Sibling discount', 'Scholarship', 'Staff child', 'Financial hardship']),
    effectiveFrom: MONTHS[0],
    effectiveTo: null,
    approvedByUserId: pending ? null : 'u-owner',
    approvedByName: pending ? null : 'Chamika Denuwan',
    approvedAt: pending ? null : iso(addDays(DEMO_TODAY, -20)),
    status: pending ? 'pending' : 'approved',
  })
}

/* --- Correction requests (§6.4) ----------------------------------------- */

export const corrections: CorrectionRequest[] = [
  {
    id: 'corr-1',
    targetType: 'payment',
    targetId: payments[0]?.id ?? 'pay-x',
    requestedByUserId: 'u-asha',
    requestedByName: 'Ashen Fernando',
    requestedAt: iso(addDays(DEMO_TODAY, -1)),
    reason: 'Recorded against the wrong student — should be STU-2026-0009, not 0008.',
    proposedChange: 'Void and re-enter against STU-2026-0009.',
    status: 'pending',
    reviewedByUserId: null,
    reviewedByName: null,
    reviewedAt: null,
    reviewNote: null,
  },
  {
    id: 'corr-2',
    targetType: 'attendance',
    targetId: attendance[0]?.id ?? 'at-x',
    requestedByUserId: 'u-dilani',
    requestedByName: 'Dilani Silva',
    requestedAt: iso(addDays(DEMO_TODAY, -2)),
    reason: 'Marked present but the student left after 5 minutes; should be voided.',
    proposedChange: 'Void the attendance record.',
    status: 'pending',
    reviewedByUserId: null,
    reviewedByName: null,
    reviewedAt: null,
    reviewNote: null,
  },
]

/* --- Audit log (FR-090) ------------------------------------------------- */

export const audit: AuditLogEntry[] = []
const auditActions = [
  { action: 'login' as const, entity: 'Session', label: null },
  { action: 'scan' as const, entity: 'AttendanceRecord', label: 'Grade 10 Mathematics' },
  { action: 'payment' as const, entity: 'Payment', label: 'RCP-2026-08841' },
  { action: 'create' as const, entity: 'Student', label: 'STU-2026-0044' },
  { action: 'card_reissue' as const, entity: 'QRToken', label: 'STU-2026-0012' },
  { action: 'update' as const, entity: 'Student', label: 'STU-2026-0031' },
  { action: 'void' as const, entity: 'Payment', label: 'RCP-2026-08790' },
  { action: 'deactivate' as const, entity: 'User', label: 'roshan.p' },
]
for (let i = 0; i < 60; i++) {
  const a = rng.pick(auditActions)
  const actor = rng.pick(users)
  audit.push({
    id: `aud-${i}`,
    actorUserId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    action: a.action,
    entityType: a.entity,
    entityId: `${a.entity}-${rng.int(1, 99)}`,
    entityLabel: a.label,
    before: a.action === 'update' ? { grade: 'Grade 9' } : null,
    after: a.action === 'update' ? { grade: 'Grade 10' } : null,
    occurredAt: iso(addDays(DEMO_TODAY, -rng.int(0, 30))),
    ipAddress: `192.168.1.${rng.int(2, 250)}`,
    deviceId: `device-${actor.id.slice(-4)}`,
    userAgent: rng.pick(['Android 14 / Chrome', 'Windows / Edge', 'iPhone / Safari']),
  })
}
audit.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))

export const institute = {
  name: 'Bright Future Institute',
  proration: false,
  lateGraceMinutes: 20,
  absenceAlertSessions: 3,
  idleTimeoutMinutes: 30,
  currency: 'LKR',
}
