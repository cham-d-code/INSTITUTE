import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { classApi, qk } from '@/lib/api/endpoints'
import { formatBillingMonth, formatDate, formatMoney, formatTimeRange, formatWeekday } from '@/lib/format'
import { currentMonth } from '@/lib/api/endpoints'
import { PageHeader } from '@/components/common/page-header'
import { BackLink, DetailField, DetailGrid, Section } from '@/components/common/section'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { FullPageSpinner } from '@/components/common/full-page-spinner'
import { QueryBoundary } from '@/components/common/states'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ClassDetailPage() {
  const { classId = '' } = useParams()
  const navigate = useNavigate()

  const classQuery = useQuery({ queryKey: qk.class(classId), queryFn: () => classApi.get(classId) })
  const rosterQuery = useQuery({ queryKey: qk.classRoster(classId), queryFn: () => classApi.roster(classId) })
  const sessionsQuery = useQuery({ queryKey: qk.classSessions(classId), queryFn: () => classApi.sessions(classId) })

  if (classQuery.isLoading) return <FullPageSpinner label="Loading class" />

  return (
    <QueryBoundary query={classQuery}>
      {(cls) => (
        <div>
          <BackLink to="/classes">Back to classes</BackLink>
          <PageHeader
            title={`${cls.grade} ${cls.subjectName}`}
            description={`${cls.teacherName} · ${cls.classCode}`}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Section title="Roster" description={`${formatBillingMonth(currentMonth())} payment status shown per student.`} bodyClassName="p-0">
                <Tabs defaultValue="roster">
                  <div className="px-5 pt-4">
                    <TabsList className="rounded-xl">
                      <TabsTrigger value="roster" className="rounded-lg text-xs">
                        Students ({cls.enrolledCount})
                      </TabsTrigger>
                      <TabsTrigger value="sessions" className="rounded-lg text-xs">
                        Sessions
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="roster" className="p-3">
                    {rosterQuery.isLoading ? (
                      <p className="text-muted-foreground p-3 text-sm">Loading roster…</p>
                    ) : (rosterQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground p-3 text-sm">No students enrolled.</p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {(rosterQuery.data ?? []).map((row) => (
                          <li key={row.student.id}>
                            <Link
                              to={`/students/${row.student.id}`}
                              className="hover:bg-secondary/50 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <EntityAvatar
                                  name={row.student.fullName}
                                  code={row.student.studentCode}
                                  photoUrl={row.student.photoUrl}
                                  size="sm"
                                />
                              </div>
                              {row.feeStatus ? (
                                <PresetStatusPill
                                  preset={row.feeStatus.status}
                                  labelOverride={
                                    row.feeStatus.status === 'partial'
                                      ? `Partial · ${formatMoney(row.feeStatus.outstanding)}`
                                      : row.feeStatus.status === 'unpaid'
                                        ? `Unpaid · ${formatMoney(row.feeStatus.outstanding)}`
                                        : undefined
                                  }
                                />
                              ) : (
                                <span className="text-muted-foreground text-xs">No due</span>
                              )}
                              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  <TabsContent value="sessions" className="p-3">
                    {(sessionsQuery.data ?? []).length === 0 ? (
                      <p className="text-muted-foreground p-3 text-sm">No sessions yet.</p>
                    ) : (
                      <ul className="divide-border divide-y">
                        {(sessionsQuery.data ?? []).map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => navigate(`/attendance/sessions/${s.id}`)}
                              className="hover:bg-secondary/50 flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors"
                            >
                              <div className="bg-secondary grid size-9 shrink-0 place-items-center rounded-xl">
                                <CalendarClock className="size-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{formatDate(s.date)}</p>
                                <p className="text-muted-foreground text-xs">
                                  {s.presentCount} present · {s.lateCount} late · {s.absentCount} absent
                                </p>
                              </div>
                              <PresetStatusPill
                                preset={s.status === 'closed' ? 'approved' : s.status === 'open' ? 'active' : 'pending'}
                                labelOverride={s.status === 'closed' ? 'Closed' : s.status === 'open' ? 'Open' : 'Scheduled'}
                                size="sm"
                              />
                              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>
                </Tabs>
              </Section>
            </div>

            <div className="space-y-4">
              <Section title="Class details">
                <DetailGrid className="grid-cols-1 sm:grid-cols-2">
                  <DetailField label="Monthly fee">{formatMoney(cls.monthlyFee)}</DetailField>
                  <DetailField label="Hall">{cls.hall}</DetailField>
                  <DetailField label="Capacity">{cls.capacity ?? 'No limit'}</DetailField>
                  <DetailField label="Enrolled">{cls.enrolledCount}</DetailField>
                </DetailGrid>
                <div className="mt-4 space-y-1.5">
                  {cls.schedules.map((s, i) => (
                    <p key={i} className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <CalendarClock className="size-4" />
                      {formatWeekday(s.weekday)} · {formatTimeRange(s.startTime, s.endTime)}
                    </p>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
