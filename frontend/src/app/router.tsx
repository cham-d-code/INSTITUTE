/* eslint-disable react-refresh/only-export-components --
   This module is the route table, not a component module. The `lazy(...)`
   bindings below are route definitions; fast refresh does not apply. */
import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { FullPageSpinner } from '@/components/common/full-page-spinner'
import { RequireAuth, RequirePermission, RoleLandingRedirect } from './route-guards'

/**
 * Route table.
 *
 * Two things are load-bearing here:
 *
 * 1. Every screen is lazily imported. NFR-01 gives the portal a 3-second
 *    budget on a typical connection, and an assistant opening the scanner on
 *    mobile data should not be made to download the reports and audit
 *    modules first. Keep new routes lazy.
 *
 * 2. The `permission` on each route mirrors §2. It keeps staff out of screens
 *    they cannot use — it does NOT keep them out of the data. The API enforces
 *    the same matrix on every request (NFR-04).
 */

const LoginPage = lazy(() =>
  import('@/features/auth/login-page').then((m) => ({ default: m.LoginPage })),
)
const ChangePasswordPage = lazy(() =>
  import('@/features/auth/change-password-page').then((m) => ({ default: m.ChangePasswordPage })),
)
const NotAuthorisedPage = lazy(() =>
  import('@/features/auth/error-pages').then((m) => ({ default: m.NotAuthorisedPage })),
)
const NotFoundPage = lazy(() =>
  import('@/features/auth/error-pages').then((m) => ({ default: m.NotFoundPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage })),
)
const ScannerPage = lazy(() =>
  import('@/features/scanner/scanner-page').then((m) => ({ default: m.ScannerPage })),
)
const StudentsPage = lazy(() =>
  import('@/features/students/students-page').then((m) => ({ default: m.StudentsPage })),
)
const StudentDetailPage = lazy(() =>
  import('@/features/students/student-detail-page').then((m) => ({ default: m.StudentDetailPage })),
)
const StudentFormPage = lazy(() =>
  import('@/features/students/student-form-page').then((m) => ({ default: m.StudentFormPage })),
)
const TeachersPage = lazy(() =>
  import('@/features/teachers/teachers-page').then((m) => ({ default: m.TeachersPage })),
)
const TeacherDetailPage = lazy(() =>
  import('@/features/teachers/teacher-detail-page').then((m) => ({ default: m.TeacherDetailPage })),
)
const ClassesPage = lazy(() =>
  import('@/features/classes/classes-page').then((m) => ({ default: m.ClassesPage })),
)
const ClassDetailPage = lazy(() =>
  import('@/features/classes/class-detail-page').then((m) => ({ default: m.ClassDetailPage })),
)
const CardsPage = lazy(() =>
  import('@/features/cards/cards-page').then((m) => ({ default: m.CardsPage })),
)
const AttendancePage = lazy(() =>
  import('@/features/attendance/attendance-page').then((m) => ({ default: m.AttendancePage })),
)
const SessionDetailPage = lazy(() =>
  import('@/features/attendance/session-detail-page').then((m) => ({
    default: m.SessionDetailPage,
  })),
)
const PaymentsPage = lazy(() =>
  import('@/features/payments/payments-page').then((m) => ({ default: m.PaymentsPage })),
)
const CollectionPage = lazy(() =>
  import('@/features/payments/collection-page').then((m) => ({ default: m.CollectionPage })),
)
const ArrearsPage = lazy(() =>
  import('@/features/fees/arrears-page').then((m) => ({ default: m.ArrearsPage })),
)
const FeeSettingsPage = lazy(() =>
  import('@/features/fees/fee-settings-page').then((m) => ({ default: m.FeeSettingsPage })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/reports-page').then((m) => ({ default: m.ReportsPage })),
)
const AuditPage = lazy(() =>
  import('@/features/audit/audit-page').then((m) => ({ default: m.AuditPage })),
)
const UsersPage = lazy(() =>
  import('@/features/users/users-page').then((m) => ({ default: m.UsersPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const CorrectionsPage = lazy(() =>
  import('@/features/corrections/corrections-page').then((m) => ({ default: m.CorrectionsPage })),
)

/** Wraps a lazily loaded screen with its guards and a loading fallback. */
function route(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>
}

/** Signed-in screen inside the admin shell, gated on a permission. */
function guarded(permission: Parameters<typeof RequirePermission>[0]['permission'], element: ReactNode) {
  return route(<RequirePermission permission={permission}>{element}</RequirePermission>)
}

export const router = createBrowserRouter([
  { path: '/login', element: route(<LoginPage />) },
  { path: '/not-authorised', element: route(<NotAuthorisedPage />) },

  {
    path: '/change-password',
    element: <RequireAuth>{route(<ChangePasswordPage />)}</RequireAuth>,
  },

  /* The scanner sits OUTSIDE the admin shell on purpose: at the classroom
     door the camera needs the whole viewport, with no sidebar or header. */
  {
    path: '/scanner',
    element: (
      <RequireAuth>{guarded('attendance.scan', <ScannerPage />)}</RequireAuth>
    ),
  },

  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleLandingRedirect /> },

      { path: 'dashboard', element: guarded('reports.operational', <DashboardPage />) },

      /* Students */
      { path: 'students', element: guarded('students.view', <StudentsPage />) },
      { path: 'students/new', element: guarded('students.create', <StudentFormPage />) },
      { path: 'students/:studentId', element: guarded('students.view', <StudentDetailPage />) },
      { path: 'students/:studentId/edit', element: guarded('students.edit', <StudentFormPage />) },

      /* Teachers */
      { path: 'teachers', element: guarded('teachers.view', <TeachersPage />) },
      { path: 'teachers/:teacherId', element: guarded('teachers.view', <TeacherDetailPage />) },

      /* Classes */
      { path: 'classes', element: guarded('classes.view', <ClassesPage />) },
      { path: 'classes/:classId', element: guarded('classes.view', <ClassDetailPage />) },

      /* ID cards */
      { path: 'cards', element: guarded('cards.print', <CardsPage />) },

      /* Attendance */
      { path: 'attendance', element: guarded('attendance.view', <AttendancePage />) },
      {
        path: 'attendance/sessions/:sessionId',
        element: guarded('attendance.view', <SessionDetailPage />),
      },

      /* Money */
      { path: 'payments', element: guarded('payments.view', <PaymentsPage />) },
      {
        path: 'payments/collection',
        element: guarded(['collection.viewOwn', 'collection.viewAll'], <CollectionPage />),
      },
      { path: 'arrears', element: guarded('arrears.view', <ArrearsPage />) },
      { path: 'fees/settings', element: guarded('fees.configure', <FeeSettingsPage />) },

      /* Oversight */
      {
        path: 'corrections',
        element: guarded(
          ['attendance.approveCorrection', 'attendance.requestCorrection'],
          <CorrectionsPage />,
        ),
      },
      { path: 'reports', element: guarded('reports.operational', <ReportsPage />) },
      { path: 'audit', element: guarded('audit.view', <AuditPage />) },

      /* Administration */
      { path: 'users', element: guarded('users.view', <UsersPage />) },
      { path: 'settings', element: guarded('settings.manage', <SettingsPage />) },

      { path: '*', element: route(<NotFoundPage />) },
    ],
  },
])
