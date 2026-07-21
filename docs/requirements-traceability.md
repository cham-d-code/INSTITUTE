# Requirements traceability

Maps every requirement in TIMS Requirements v1.0 to where it is handled.
Update the Status column as modules land — this is the checklist for "does the
build actually satisfy the spec".

**Status key:** ✅ built · 🟡 scaffolded (stub exists, tagged) · ⬜ not started

## 3.1 User & access management

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-001 | Must | 🟡 | `features/users/users-page.tsx`; backend `modules/users` |
| FR-002 | Must | 🟡 | `features/users/users-page.tsx` |
| FR-003 | Must | 🟡 | `lib/api/client.ts` (401 → refresh → sign-out); server sets the idle TTL |
| FR-004 | Must | 🟡 | `app/route-guards.tsx` forces `/change-password`; `features/auth/change-password-page.tsx` |
| FR-005 | Must | 🟡 | `lib/api/client.ts` handles `ACCOUNT_DISABLED`; server revokes |
| FR-006 | Should | ⬜ | backend `modules/auth` + OTP step in login |

## 3.2 Students

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-010 | Must | 🟡 | `features/students/student-form-page.tsx` |
| FR-011 | Must | 🟡 | same — guardian sub-form; `Guardian` in `types/domain.ts` |
| FR-012 | Must | 🟡 | server-generated `studentCode`; immutable |
| FR-013 | Must | 🟡 | class multi-select on the registration form |
| FR-014 | Must | 🟡 | duplicate warning on name + guardian phone |
| FR-015 | Must | 🟡 | every edit writes an audit entry with before/after |
| FR-016 | Must | ✅ | `StudentStatus` in `types/domain.ts`; drives roster and fee generation |
| FR-017 | Must | 🟡 | `features/students/students-page.tsx` filters |
| FR-018 | Should | ⬜ | bulk grade promotion |
| FR-019 | Should | 🟡 | `Student.notes`, visibility per role |

## 3.3 Teachers

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-020 | Must | 🟡 | `features/teachers/teachers-page.tsx` |
| FR-021 | Must | ✅ | `Teacher.teacherCode`, `isActive` |
| FR-022 | Must | 🟡 | `features/teachers/teacher-detail-page.tsx` |
| FR-023 | Should | ✅ | `TeacherPaymentArrangement` in `types/domain.ts` |
| FR-024 | Should | ⬜ | timetable view + conflict detection |

## 3.4 Classes, subjects & schedule

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-030 | Must | 🟡 | `features/settings/settings-page.tsx` (subject/grade masters) |
| FR-031 | Must | ✅ | `ClassRecord` + `ClassSchedule` in `types/domain.ts` |
| FR-032 | Must | ✅ | `Enrollment` start/end dates drive fee generation |
| FR-033 | Must | 🟡 | `features/classes/class-detail-page.tsx` |
| FR-034 | Should | ✅ | `ClassSession.isAdHoc`, `SessionStatus` |
| FR-035 | Could | ⬜ | hall double-booking detection |
| FR-036 | Could | ✅ | `ClassRecord.capacity` |

## 3.5 QR student ID card

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-040 | Must | 🟡 | `features/cards/cards-page.tsx`; `lib/export` for the PDF |
| FR-041 | Must | ✅ | `QRToken` — opaque token, never personal data |
| FR-042 | Must | 🟡 | CR80 + A4 batch layouts |
| FR-043 | Must | ✅ | `QRToken.revokedAt`, one active token per student |
| FR-044 | Could | ⬜ | digital card, Phase 2 portal |

## 3.6 Attendance

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-050 | Must | 🟡 | `features/scanner/`; `AttendanceRecord` carries user + device |
| FR-051 | Must | 🟡 | session auto-suggest by day and time |
| FR-052 | Must | ✅ | `ScanResult` + `components/data/status-pill.tsx` (colour + icon + word) |
| FR-053 | Must | ✅ | `ScanOutcome: 'duplicate'` with `alreadyMarkedAt` |
| FR-054 | Must | ✅ | `ScanOutcome: 'not_enrolled'`; `AttendanceRecord.isGuest` |
| FR-055 | Should | ✅ | `ClassSession.lateAfter`; `AttendanceStatus: 'late'` |
| FR-056 | Must | ✅ | `AttendanceMethod: 'manual'` with mandatory `reason` |
| FR-057 | Must | ✅ | no `attendance.void` for assistants; `CorrectionRequest` flow |
| FR-058 | Should | 🟡 | `lib/offline/` queue; `capturedAt` preserved separately from `markedAt` |
| FR-059 | Must | 🟡 | `features/attendance/attendance-page.tsx` |
| FR-060 | Must | ✅ | absentees derived once `closedAt` is set |
| FR-061 | Should | 🟡 | dashboard alert row (built, wired to mock data) |

## 3.7 Fees & payments

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-070 | Must | ✅ | `ChargeKind` covers monthly + one-time charges |
| FR-071 | Must | 🟡 | `Due` generation; proration is a Super Admin setting |
| FR-072 | Must | 🟡 | payment by scan or search; `PaymentAllocation` |
| FR-073 | Must | ✅ | `Payment` records receipt no., method, collector, device |
| FR-074 | Must | 🟡 | receipt print; `Payment.reprintCount` |
| FR-075 | Must | ✅ | `Due.paidAmount` / `outstanding`; `DueStatus: 'partial'` |
| FR-076 | Must | ✅ | `Discount` with reason + approval status |
| FR-077 | Must | ✅ | no `payments.void` / `payments.refund` for assistants |
| FR-078 | Must | 🟡 | `features/payments/collection-page.tsx`; `collection.viewOwn` vs `viewAll` |
| FR-079 | Must | 🟡 | `features/fees/arrears-page.tsx` |
| FR-080 | Must | ✅ | `ScanResult.feeStatus`; service worker never caches `/api` |
| FR-081 | Should | ✅ | allocation model supports advance months |
| FR-082 | Should | 🟡 | `features/reports/` teacher payment report |
| FR-083 | Won't (P2) | — | out of scope this phase |

## 3.8 Accountability & audit

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-090 | Must | ✅ | `AuditAction` + `AuditLogEntry` with before/after and device |
| FR-091 | Must | 🟡 | `features/audit/audit-page.tsx`, gated on `audit.view` |
| FR-092 | Must | ✅ | `markedByName` / `collectedByName` on every record |
| FR-093 | Must | ⬜ | **database grants** — see NFR-10; not an application concern |

## 3.9 Notifications

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-100 | Should | 🟡 | templates in `features/settings/` |
| FR-101 | Should (P2) | ⬜ | Phase 2 |
| FR-102 | Should (P2) | ⬜ | Phase 2 |

## 3.10 Reports & dashboard

| ID | Priority | Status | Where |
|---|---|---|---|
| FR-110 | Must | ✅ | `features/dashboard/dashboard-page.tsx` (layout built, mock data) |
| FR-111 | Must | 🟡 | `features/reports/` |
| FR-112 | Must | 🟡 | `features/reports/`, gated on `reports.financial` |
| FR-113 | Must | 🟡 | `features/reports/` |
| FR-114 | Must | ⬜ | **server-side generation** — the API holds the RBAC-filtered data and logs the export (FR-090) |
| FR-115 | Should | ✅ | `components/charts/trend-chart.tsx` |

## 4. Assistant mobile app

| ID | Priority | Status | Where |
|---|---|---|---|
| MA-001 | Must | ✅ | PWA, installable on Android; `vite.config.ts` manifest |
| MA-002 | Must | 🟡 | `features/scanner/` core screens |
| MA-003 | Must | ⬜ | scanner performance — verify on real hardware, not a desktop webcam |
| MA-004 | Should | 🟡 | service worker precaches the shell; unsynced count in the rail badge |
| MA-005 | Must | ✅ | `getDeviceId()` on every request; no user switching without logout |
| MA-006 | Must | ✅ | `ACCOUNT_DISABLED` handling in `lib/api/client.ts` |

## 5. Non-functional

| ID | Priority | Status | Notes |
|---|---|---|---|
| NFR-01 | Must | 🟡 | Route-level code splitting done — login 5.6 kB, scanner route avoids the 116 kB chart bundle. Scan round-trip depends on the API. |
| NFR-02 | Must | ⬜ | 10 concurrent scanners — backend load test |
| NFR-03 | Should | 🟡 | offline scanning mitigates short outages |
| NFR-04 | Must | 🟡 | HTTPS + server-side RBAC are backend work. Frontend: token in memory, not `localStorage`. |
| NFR-05 | Must | 🟡 | `.gitignore` excludes uploads and dumps; retention/erasure is backend |
| NFR-06 | Must | ⬜ | daily backups, 30-day retention, **tested restore** — untested backups are not backups |
| NFR-07 | Should | ⬜ | 5-year retention |
| NFR-08 | Should | 🟡 | status = colour + icon + word; reduced-motion respected; Sinhala/Tamil labels deferred |
| NFR-09 | Should | ⬜ | 2,000 students / 50 classes / 3 years — schema and indexing |
| NFR-10 | Must | ⬜ | **append-only audit at the grant level.** The application role gets `INSERT` only on audit tables. This is what makes FR-093 real rather than merely intended. |

## Open questions for the owner

1. **Proration (FR-071).** Does a student joining mid-month pay the full
   monthly fee or a pro-rated amount? The setting exists; the default doesn't.
2. **Late threshold (FR-055).** §6.2 implies 20 minutes past the start. Is that
   institute-wide, or per class?
3. **Absence alert threshold (FR-061).** "N consecutive sessions" — what is N?
4. **Guest/trial attendance (FR-054).** Does a trial attendee get charged, and
   does the trial convert automatically to an enrollment?
5. **Card reissue fee (§6.5).** Fixed amount, and is it always charged or at
   the assistant's discretion?
6. **Teacher revenue share (FR-023).** Is the percentage taken on fees
   *collected* or fees *billed*? These diverge exactly when arrears exist,
   which is the case that matters.
