import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock } from 'lucide-react'
import { qk, teacherApi } from '@/lib/api/endpoints'
import { formatMoney, formatTimeRange, formatWeekday } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { BackLink, DetailField, DetailGrid, Section } from '@/components/common/section'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { QueryBoundary } from '@/components/common/states'
import { FullPageSpinner } from '@/components/common/full-page-spinner'

const ARRANGEMENT_LABEL = {
  per_session: 'Per session',
  fixed_monthly: 'Fixed monthly',
  revenue_share: 'Revenue share',
} as const

export function TeacherDetailPage() {
  const { teacherId = '' } = useParams()
  const query = useQuery({ queryKey: qk.teacher(teacherId), queryFn: () => teacherApi.get(teacherId) })

  if (query.isLoading) return <FullPageSpinner label="Loading teacher" />

  return (
    <QueryBoundary query={query}>
      {(teacher) => {
        // Build a simple weekly timetable and flag overlaps (FR-024).
        const slots = teacher.classes.flatMap((c) =>
          c.schedules.map((s) => ({
            classId: c.id,
            className: `${c.grade} ${c.subjectName}`,
            hall: c.hall,
            ...s,
          })),
        )
        const conflicts = findConflicts(slots)

        return (
          <div>
            <BackLink to="/teachers">Back to teachers</BackLink>
            <PageHeader
              title={teacher.fullName}
              description={`${teacher.teacherCode} · ${teacher.classes.length} classes`}
              actions={<PresetStatusPill preset={teacher.isActive ? 'active' : 'inactive'} size="lg" />}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Section title="Details">
                  <div className="mb-5">
                    <EntityAvatar name={teacher.fullName} code={teacher.teacherCode} photoUrl={teacher.photoUrl} size="lg" />
                  </div>
                  <DetailGrid>
                    <DetailField label="Phone">{teacher.phone}</DetailField>
                    <DetailField label="Email">{teacher.email}</DetailField>
                    <DetailField label="NIC / ID">{teacher.nicNumber}</DetailField>
                    <DetailField label="Grades">{teacher.grades.join(', ')}</DetailField>
                    <DetailField label="Address">{teacher.address}</DetailField>
                  </DetailGrid>
                </Section>

                <Section title="Timetable" description="Weekly schedule across all assigned classes.">
                  {slots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Not assigned to any class.</p>
                  ) : (
                    <ul className="space-y-2">
                      {slots
                        .slice()
                        .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
                        .map((s, i) => {
                          const inConflict = conflicts.has(`${s.classId}-${s.weekday}-${s.startTime}`)
                          return (
                            <li
                              key={i}
                              className="border-border flex items-center gap-4 rounded-xl border px-4 py-3"
                            >
                              <div className="bg-secondary grid size-10 shrink-0 place-items-center rounded-xl">
                                <CalendarClock className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{s.className}</p>
                                <p className="text-muted-foreground text-xs">
                                  {formatWeekday(s.weekday)} · {formatTimeRange(s.startTime, s.endTime)}
                                  {s.hall && ` · ${s.hall}`}
                                </p>
                              </div>
                              {inConflict && <PresetStatusPill preset="rejected" labelOverride="Overlap" size="sm" />}
                            </li>
                          )
                        })}
                    </ul>
                  )}
                </Section>
              </div>

              <div className="space-y-4">
                <Section title="Payment arrangement" description="Used for the teacher payment report.">
                  {teacher.arrangement ? (
                    <>
                      <p className="text-lg font-bold">{ARRANGEMENT_LABEL[teacher.arrangement.type]}</p>
                      <p className="tabular mt-1 text-2xl font-bold">
                        {teacher.arrangement.type === 'revenue_share'
                          ? `${teacher.arrangement.percentage}%`
                          : formatMoney(teacher.arrangement.amount ?? 0)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {teacher.arrangement.type === 'revenue_share'
                          ? 'of collected class fees'
                          : teacher.arrangement.type === 'per_session'
                            ? 'per session held'
                            : 'per month'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">No arrangement recorded.</p>
                  )}
                </Section>

                <Section title="Classes">
                  <ul className="space-y-2">
                    {teacher.classes.map((c) => (
                      <li key={c.id} className="border-border rounded-xl border px-3 py-2.5">
                        <p className="text-sm font-semibold">
                          {c.grade} {c.subjectName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {c.enrolledCount} students · {formatMoney(c.monthlyFee)}/mo
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            </div>
          </div>
        )
      }}
    </QueryBoundary>
  )
}

/** Marks slots that overlap another slot on the same weekday. */
function findConflicts(
  slots: Array<{ classId: string; weekday: number; startTime: string; endTime: string }>,
): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]
      if (a.weekday !== b.weekday) continue
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        out.add(`${a.classId}-${a.weekday}-${a.startTime}`)
        out.add(`${b.classId}-${b.weekday}-${b.startTime}`)
      }
    }
  }
  return out
}
