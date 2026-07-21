import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  ChevronRight,
  ScanLine,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { StatTile } from '@/components/data/stat-tile'
import { PresetStatusPill, StatusPill } from '@/components/data/status-pill'
import { TrendChart } from '@/components/charts/trend-chart'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth/auth-store'
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatTimeRange,
  percentChange,
} from '@/lib/format'

/**
 * Owner dashboard — FR-110.
 *
 * NOTE: the figures below are placeholder data so the layout can be reviewed
 * before the API exists. Every one of them is replaced by a `useQuery` against
 * `/api/dashboard/summary` when the backend module lands. Nothing here should
 * survive to production — search for MOCK_ to find it all.
 */

const MOCK_SUMMARY = {
  todayScans: 148,
  todayCollection: 8_750_00,
  monthToDateRevenue: 412_500_00,
  previousMonthRevenue: 386_200_00,
  arrearsTotal: 96_400_00,
  activeStudents: 512,
  alerts: { longAbsentees: 7, unpaidStudents: 34, pendingCorrections: 2, pendingDiscounts: 1 },
}

const MOCK_SESSIONS = [
  {
    id: 's1',
    className: 'Grade 10 Mathematics',
    teacher: 'Mr. Perera',
    hall: 'Hall A',
    start: '08:00',
    end: '10:00',
    enrolled: 42,
    present: 38,
    state: 'open' as const,
  },
  {
    id: 's2',
    className: 'Grade 11 Science',
    teacher: 'Mrs. Silva',
    hall: 'Hall B',
    start: '10:15',
    end: '12:15',
    enrolled: 35,
    present: 0,
    state: 'upcoming' as const,
  },
  {
    id: 's3',
    className: 'Grade 9 English',
    teacher: 'Ms. Fernando',
    hall: 'Hall A',
    start: '13:00',
    end: '14:30',
    enrolled: 28,
    present: 0,
    state: 'upcoming' as const,
  },
  {
    id: 's4',
    className: 'Grade 13 Chemistry',
    teacher: 'Mr. Bandara',
    hall: 'Lab 1',
    start: '06:00',
    end: '08:00',
    enrolled: 22,
    present: 21,
    state: 'closed' as const,
  },
]

const MOCK_REVENUE_TREND = [
  { label: 'Feb', value: 352_000_00 },
  { label: 'Mar', value: 368_500_00 },
  { label: 'Apr', value: 341_000_00 },
  { label: 'May', value: 379_800_00 },
  { label: 'Jun', value: 386_200_00 },
  { label: 'Jul', value: 412_500_00 },
]

type SessionFilter = 'all' | 'open' | 'upcoming' | 'closed'

export function DashboardPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<SessionFilter>('all')

  const sessions =
    filter === 'all' ? MOCK_SESSIONS : MOCK_SESSIONS.filter((s) => s.state === filter)

  const revenueChange = percentChange(
    MOCK_SUMMARY.monthToDateRevenue,
    MOCK_SUMMARY.previousMonthRevenue,
  )

  const totalAlerts =
    MOCK_SUMMARY.alerts.longAbsentees +
    MOCK_SUMMARY.alerts.unpaidStudents +
    MOCK_SUMMARY.alerts.pendingCorrections +
    MOCK_SUMMARY.alerts.pendingDiscounts

  const firstName = user?.fullName.split(' ')[0] ?? 'there'

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={`${formatDate(new Date())} · ${MOCK_SESSIONS.length} sessions scheduled today`}
        actions={
          <>
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link to="/reports">View reports</Link>
            </Button>
            <Button className="rounded-2xl" asChild>
              <Link to="/students/new">
                Register student <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Today's figures — FR-110 */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Scanned today"
              value={String(MOCK_SUMMARY.todayScans)}
              icon={ScanLine}
              hint={`across ${MOCK_SESSIONS.length} sessions`}
            />
            <StatTile
              label="Collected today"
              value={formatMoney(MOCK_SUMMARY.todayCollection)}
              icon={Wallet}
              hint="cash + transfers"
            />
            <StatTile
              label="Active students"
              value={String(MOCK_SUMMARY.activeStudents)}
              icon={Users}
              hint="excludes inactive and left"
            />
          </div>

          {/* Today's sessions */}
          <div className="card-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold tracking-tight">Today's sessions</h2>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as SessionFilter)}>
                <TabsList className="rounded-xl">
                  <TabsTrigger value="all" className="rounded-lg text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="open" className="rounded-lg text-xs">
                    In progress
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="rounded-lg text-xs">
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="rounded-lg text-xs">
                    Closed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    to={`/attendance/sessions/${session.id}`}
                    className="hover:bg-secondary/60 flex items-center gap-4 rounded-2xl p-3 transition-colors"
                  >
                    <div className="bg-secondary text-secondary-foreground grid size-11 shrink-0 place-items-center rounded-xl">
                      <CalendarDays className="size-5" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{session.className}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {session.teacher} · {session.hall}
                      </p>
                    </div>

                    <div className="hidden shrink-0 sm:block">
                      <StatusPill
                        label={formatTimeRange(session.start, session.end)}
                        tone="neutral"
                      />
                    </div>

                    <div className="hidden w-24 shrink-0 text-right md:block">
                      <p className="tabular text-sm font-semibold">
                        {session.present}/{session.enrolled}
                      </p>
                      <p className="text-muted-foreground text-xs">present</p>
                    </div>

                    <div className="shrink-0">
                      {session.state === 'open' && (
                        <StatusPill label="In progress" tone="ok" icon={ScanLine} />
                      )}
                      {session.state === 'upcoming' && (
                        <StatusPill label="Upcoming" tone="neutral" />
                      )}
                      {session.state === 'closed' && <PresetStatusPill preset="approved" labelOverride="Closed" />}
                    </div>

                    <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>

            {sessions.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No sessions match this filter.
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <StatTile
            label="Revenue this month"
            value={formatMoney(MOCK_SUMMARY.monthToDateRevenue)}
            icon={BadgeDollarSign}
            change={revenueChange}
            changeLabel="vs last month"
          />

          <StatTile
            label="Total arrears"
            value={formatMoney(MOCK_SUMMARY.arrearsTotal)}
            icon={TriangleAlert}
            hint={`${MOCK_SUMMARY.alerts.unpaidStudents} students owing`}
          />

          <TrendChart
            title="Revenue trend"
            formatValue={formatMoneyCompact}
            series={[
              {
                key: 'revenue',
                label: 'Collected revenue',
                colour: 'var(--chart-primary)',
                data: MOCK_REVENUE_TREND,
              },
            ]}
            controls={
              <Select defaultValue="6m">
                <SelectTrigger size="sm" className="w-[112px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 months</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                  <SelectItem value="12m">12 months</SelectItem>
                </SelectContent>
              </Select>
            }
          />

          {/* Alerts — the dark promo-style card from the reference, repurposed
              for the things an owner must actually act on. */}
          <div className="bg-sidebar text-sidebar-foreground rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4" aria-hidden />
              <h2 className="text-base font-bold tracking-tight">Needs attention</h2>
              <span className="bg-sidebar-primary text-sidebar-primary-foreground tabular ml-auto rounded-lg px-2 py-0.5 text-xs font-bold">
                {totalAlerts}
              </span>
            </div>

            <ul className="mt-4 space-y-2.5 text-sm">
              <AlertRow
                label="Correction requests"
                count={MOCK_SUMMARY.alerts.pendingCorrections}
                to="/corrections"
              />
              <AlertRow
                label="Discounts awaiting approval"
                count={MOCK_SUMMARY.alerts.pendingDiscounts}
                to="/fees/settings"
              />
              <AlertRow
                label="Students unpaid this month"
                count={MOCK_SUMMARY.alerts.unpaidStudents}
                to="/arrears"
              />
              <AlertRow
                label="Absent 3+ sessions running"
                count={MOCK_SUMMARY.alerts.longAbsentees}
                to="/attendance?filter=long-absent"
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertRow({ label, count, to }: { label: string; count: number; to: string }) {
  return (
    <li>
      <Link
        to={to}
        className="hover:bg-sidebar-accent -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors"
      >
        <span className="text-sidebar-foreground/70 min-w-0 flex-1 truncate">{label}</span>
        <span className="tabular font-bold">{count}</span>
        <ChevronRight className="text-sidebar-foreground/40 size-4 shrink-0" aria-hidden />
      </Link>
    </li>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
