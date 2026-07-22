import { useQuery } from '@tanstack/react-query'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { qk, reportApi } from '@/lib/api/endpoints'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { exportToCsv, exportToPdf } from '@/lib/export/export'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { StatTile } from '@/components/data/stat-tile'
import { BarList } from '@/components/charts/bar-list'
import { TrendChart } from '@/components/charts/trend-chart'
import { PresetStatusPill } from '@/components/data/status-pill'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

export function ReportsPage() {
  const { can } = useAuth()
  const canFinancial = can('reports.financial')

  return (
    <div>
      <PageHeader title="Reports" description="Attendance, financial and enrollment reporting." />

      <Tabs defaultValue={canFinancial ? 'financial' : 'attendance'}>
        <TabsList className="mb-4 rounded-xl">
          {canFinancial && (
            <TabsTrigger value="financial" className="rounded-lg">
              Financial
            </TabsTrigger>
          )}
          <TabsTrigger value="attendance" className="rounded-lg">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="rounded-lg">
            Enrollment
          </TabsTrigger>
          {canFinancial && (
            <TabsTrigger value="teachers" className="rounded-lg">
              Teacher payments
            </TabsTrigger>
          )}
        </TabsList>

        {canFinancial && (
          <TabsContent value="financial">
            <FinancialReport />
          </TabsContent>
        )}
        <TabsContent value="attendance">
          <AttendanceReport />
        </TabsContent>
        <TabsContent value="enrollment">
          <EnrollmentReport />
        </TabsContent>
        {canFinancial && (
          <TabsContent value="teachers">
            <TeacherPaymentReport />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function ExportMenu({ onCsv, onPdf }: { onCsv: () => void; onPdf: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <FileDown className="size-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCsv}>
          <FileSpreadsheet className="size-4" /> Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPdf}>
          <FileDown className="size-4" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FinancialReport() {
  const query = useQuery({ queryKey: qk.financialSummary, queryFn: reportApi.financialSummary })
  const trendQuery = useQuery({ queryKey: qk.revenueTrend(6), queryFn: () => reportApi.revenueTrend(6) })

  if (query.isLoading || !query.data) return <Skeleton className="h-96 w-full rounded-2xl" />
  const d = query.data

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Total collected" value={formatMoney(d.totalCollected)} />
        <StatTile label="Arrears" value={formatMoney(d.arrears)} invertChangeColour />
        <StatTile label="Voided" value={formatMoney(d.voidedAmount)} hint={`${d.voidedCount} transactions`} />
        <StatTile label="Net" value={formatMoney(d.totalCollected - d.voidedAmount)} />
      </div>

      <TrendChart
        title="Collections by month"
        formatValue={(v) => formatMoney(v)}
        series={[{ key: 'rev', label: 'Collected', colour: 'var(--chart-primary)', data: trendQuery.data ?? [] }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="By class"
          actions={
            <ExportMenu
              onCsv={() => exportToCsv('collections-by-class.csv', ['Class', 'Collected'], d.byClass.map((r) => [r.label, (r.value / 100).toFixed(2)]))}
              onPdf={() => exportToPdf('Collections by class', ['Class', 'Collected'], d.byClass.map((r) => [r.label, formatMoney(r.value)]))}
            />
          }
        >
          <BarList items={d.byClass} formatValue={formatMoney} />
        </Section>
        <Section
          title="By assistant"
          actions={
            <ExportMenu
              onCsv={() => exportToCsv('collections-by-assistant.csv', ['Assistant', 'Collected'], d.byAssistant.map((r) => [r.label, (r.value / 100).toFixed(2)]))}
              onPdf={() => exportToPdf('Collections by assistant', ['Assistant', 'Collected'], d.byAssistant.map((r) => [r.label, formatMoney(r.value)]))}
            />
          }
        >
          <BarList items={d.byAssistant} formatValue={formatMoney} />
        </Section>
      </div>
    </div>
  )
}

function AttendanceReport() {
  const query = useQuery({ queryKey: qk.attendanceSummary, queryFn: reportApi.attendanceSummary })
  if (query.isLoading || !query.data) return <Skeleton className="h-96 w-full rounded-2xl" />
  const d = query.data

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Sessions held" value={String(d.sessionsHeld)} />
        <StatTile label="Average attendance" value={`${d.avgAttendance}%`} />
      </div>
      <Section
        title="Attendance rate by class"
        actions={
          <ExportMenu
            onCsv={() => exportToCsv('attendance-by-class.csv', ['Class', 'Rate %'], d.byClass.map((r) => [r.label, r.value]))}
            onPdf={() => exportToPdf('Attendance by class', ['Class', 'Rate %'], d.byClass.map((r) => [r.label, `${r.value}%`]))}
          />
        }
      >
        <BarList items={d.byClass} formatValue={(v) => `${v}%`} />
      </Section>
    </div>
  )
}

function EnrollmentReport() {
  const query = useQuery({ queryKey: qk.enrollmentSummary, queryFn: reportApi.enrollmentSummary })
  if (query.isLoading || !query.data) return <Skeleton className="h-96 w-full rounded-2xl" />
  const d = query.data

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Active" value={String(d.activeStudents)} />
        <StatTile label="Inactive" value={String(d.inactive)} />
        <StatTile label="Left" value={String(d.left)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Students by grade"
          actions={
            <ExportMenu
              onCsv={() => exportToCsv('students-by-grade.csv', ['Grade', 'Students'], d.byGrade.map((r) => [r.label, r.value]))}
              onPdf={() => exportToPdf('Students by grade', ['Grade', 'Students'], d.byGrade.map((r) => [r.label, r.value]))}
            />
          }
        >
          <BarList items={d.byGrade} />
        </Section>
        <Section title="Class sizes">
          <BarList items={d.byClass} />
        </Section>
      </div>
    </div>
  )
}

function TeacherPaymentReport() {
  const query = useQuery({ queryKey: qk.teacherPayments, queryFn: reportApi.teacherPayments })
  if (query.isLoading || !query.data) return <Skeleton className="h-96 w-full rounded-2xl" />
  const rows = query.data

  const ARR = { per_session: 'Per session', fixed_monthly: 'Fixed monthly', revenue_share: 'Revenue share' } as const

  return (
    <Section
      title="Teacher payments this month"
      description="Computed from each teacher's arrangement. This is a report only — no salary is disbursed."
      bodyClassName="p-0"
      actions={
        <ExportMenu
          onCsv={() =>
            exportToCsv(
              'teacher-payments.csv',
              ['Teacher', 'Arrangement', 'Collected', 'Sessions', 'Owed'],
              rows.map((r) => [r.teacherName, r.arrangement ? ARR[r.arrangement.type] : '—', (r.collected / 100).toFixed(2), r.sessionsThisMonth, (r.owed / 100).toFixed(2)]),
            )
          }
          onPdf={() =>
            exportToPdf(
              'Teacher payments',
              ['Teacher', 'Arrangement', 'Collected', 'Sessions', 'Owed'],
              rows.map((r) => [r.teacherName, r.arrangement ? ARR[r.arrangement.type] : '—', formatMoney(r.collected), String(r.sessionsThisMonth), formatMoney(r.owed)]),
            )
          }
        />
      }
    >
      <ul className="divide-border divide-y">
        {rows.map((r) => (
          <li key={r.teacherId} className="flex items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{r.teacherName}</p>
              <p className="text-muted-foreground text-xs">
                {r.arrangement ? ARR[r.arrangement.type] : 'No arrangement'} · {r.sessionsThisMonth} sessions ·{' '}
                {formatMoney(r.collected)} collected
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Owed</p>
              <p className="tabular text-base font-bold">{formatMoney(r.owed)}</p>
            </div>
            {r.arrangement && (
              <PresetStatusPill preset="approved" labelOverride={ARR[r.arrangement.type]} size="sm" />
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
