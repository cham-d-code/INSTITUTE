import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { classApi, qk, reportApi, sessionApi } from '@/lib/api/endpoints'
import { formatDate, formatTimeRange } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { Section, Toolbar } from '@/components/common/section'
import { PresetStatusPill } from '@/components/data/status-pill'
import { EmptyState } from '@/components/common/states'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AttendancePage() {
  const navigate = useNavigate()
  const [classId, setClassId] = useState('all')

  const todayQuery = useQuery({ queryKey: qk.todaySessions, queryFn: sessionApi.today })
  const classesQuery = useQuery({ queryKey: qk.classes, queryFn: classApi.list })
  const summaryQuery = useQuery({ queryKey: qk.attendanceSummary, queryFn: reportApi.attendanceSummary })

  const sessions = useMemo(() => {
    const rows = todayQuery.data ?? []
    return classId === 'all' ? rows : rows.filter((s) => s.classId === classId)
  }, [todayQuery.data, classId])

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Today's sessions and class-level attendance trends. Open a session for the full register."
      />

      <Tabs defaultValue="today">
        <TabsList className="mb-4 rounded-xl">
          <TabsTrigger value="today" className="rounded-lg">
            Today's sessions
          </TabsTrigger>
          <TabsTrigger value="byclass" className="rounded-lg">
            By class
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Toolbar>
            <div className="sm:ml-auto">
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="h-10 w-[200px] rounded-xl">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {(classesQuery.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.grade} {c.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Toolbar>

          {todayQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="card-surface">
              <EmptyState icon={CalendarClock} title="No sessions" description="Nothing scheduled for this filter today." />
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const scanned = s.presentCount + s.lateCount
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => navigate(`/attendance/sessions/${s.id}`)}
                      className="card-surface hover:border-primary/30 flex w-full items-center gap-4 p-4 text-left transition-colors"
                    >
                      <div className="bg-secondary grid size-11 shrink-0 place-items-center rounded-xl">
                        <CalendarClock className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.className}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {s.teacherName} · {formatTimeRange(s.startTime, s.endTime)} · {formatDate(s.date)}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="tabular text-sm font-semibold">{scanned}</p>
                        <p className="text-muted-foreground text-xs">scanned</p>
                      </div>
                      <PresetStatusPill
                        preset={s.status === 'closed' ? 'approved' : s.status === 'open' ? 'active' : 'pending'}
                        labelOverride={s.status === 'closed' ? 'Closed' : s.status === 'open' ? 'In progress' : 'Scheduled'}
                      />
                      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="byclass">
          <Section title="Attendance rate by class" description={`Across ${summaryQuery.data?.sessionsHeld ?? 0} closed sessions.`}>
            {summaryQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <ul className="space-y-3">
                {(summaryQuery.data?.byClass ?? []).map((row) => (
                  <li key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <span className="tabular font-semibold">{row.value}%</span>
                    </div>
                    <div className="bg-secondary h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-chart-primary h-full rounded-full"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
