import {
  BadgeDollarSign,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Permission } from '@/lib/auth/permissions'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Hidden unless the signed-in role holds at least one of these. */
  requires: Permission[]
  /** Shown as a small count bubble on the rail, e.g. pending corrections. */
  badgeKey?: 'pendingCorrections' | 'unsyncedScans'
}

export interface NavSection {
  /** Null renders the group with no heading (the top-level items). */
  title: string | null
  items: NavItem[]
}

/**
 * The navigation model. Ordered by how often an owner actually reaches for
 * each area during a working day: the door and the desk first, configuration
 * last.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        requires: ['reports.operational'],
      },
    ],
  },
  {
    title: 'Daily operations',
    items: [
      {
        label: 'Scan attendance',
        to: '/scanner',
        icon: ScanLine,
        requires: ['attendance.scan'],
        badgeKey: 'unsyncedScans',
      },
      {
        label: 'Attendance',
        to: '/attendance',
        icon: ClipboardCheck,
        requires: ['attendance.view'],
      },
      {
        label: 'Payments',
        to: '/payments',
        icon: Wallet,
        requires: ['payments.view'],
      },
      {
        label: 'Arrears',
        to: '/arrears',
        icon: BadgeDollarSign,
        requires: ['arrears.view'],
      },
    ],
  },
  {
    title: 'Records',
    items: [
      { label: 'Students', to: '/students', icon: Users, requires: ['students.view'] },
      { label: 'Teachers', to: '/teachers', icon: GraduationCap, requires: ['teachers.view'] },
      { label: 'Classes', to: '/classes', icon: CalendarClock, requires: ['classes.view'] },
      { label: 'ID cards', to: '/cards', icon: CreditCard, requires: ['cards.print'] },
    ],
  },
  {
    title: 'Oversight',
    items: [
      {
        label: 'Corrections',
        to: '/corrections',
        icon: ShieldCheck,
        requires: ['attendance.approveCorrection', 'attendance.requestCorrection'],
        badgeKey: 'pendingCorrections',
      },
      { label: 'Reports', to: '/reports', icon: FileBarChart, requires: ['reports.operational'] },
      { label: 'Audit log', to: '/audit', icon: ScrollText, requires: ['audit.view'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: UserCog, requires: ['users.view'] },
      { label: 'Settings', to: '/settings', icon: Settings, requires: ['settings.manage'] },
    ],
  },
]
