import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Lock, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { AttendanceRecord } from '@/types/domain'
import { attendanceApi, qk, sessionApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDate, formatTime, formatTimeRange } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { BackLink, Section } from '@/components/common/section'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { StatTile } from '@/components/data/stat-tile'
import { FullPageSpinner } from '@/components/common/full-page-spinner'
import { QueryBoundary } from '@/components/common/states'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'

export function SessionDetailPage() {
  const { sessionId = '' } = useParams()
  const queryClient = useQueryClient()
  const { can, isSuperAdmin } = useAuth()
  const query = useQuery({ queryKey: qk.session(sessionId), queryFn: () => sessionApi.get(sessionId) })

  const [voidTarget, setVoidTarget] = useState<AttendanceRecord | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.session(sessionId) })

  if (query.isLoading) return <FullPageSpinner label="Loading session" />

  return (
    <QueryBoundary query={query}>
      {(data) => {
        const { session, class: cls, records, absentees, rosterCount } = data
        const activeRecords = records.filter((r) => r.status !== 'void')

        async function markPresent(studentId: string, reason: string) {
          try {
            await attendanceApi.markManual(sessionId, studentId, reason)
            await invalidate()
            toast.success('Marked present.')
          } catch (err) {
            toast.error(apiErrorMessage(err))
          }
        }

        return (
          <div>
            <BackLink to="/attendance">Back to attendance</BackLink>
            <PageHeader
              title={`${cls.grade} ${cls.subjectName}`}
              description={`${formatDate(session.date)} · ${formatTimeRange(session.startTime, session.endTime)} · ${cls.teacherName}`}
              actions={
                <div className="flex items-center gap-2">
                  <PresetStatusPill
                    preset={session.status === 'closed' ? 'approved' : session.status === 'open' ? 'active' : 'pending'}
                    labelOverride={session.status === 'closed' ? 'Closed' : session.status === 'open' ? 'In progress' : 'Scheduled'}
                    size="lg"
                  />
                  {isSuperAdmin && session.status !== 'closed' && (
                    <Button variant="outline" className="rounded-2xl" onClick={() => setCloseOpen(true)}>
                      <Lock className="size-4" /> Close session
                    </Button>
                  )}
                </div>
              }
            />

            <div className="mb-4 grid gap-4 sm:grid-cols-4">
              <StatTile label="Present" value={String(session.presentCount)} />
              <StatTile label="Late" value={String(session.lateCount)} />
              <StatTile label="Absent" value={String(session.status === 'closed' ? session.absentCount : absentees.length)} />
              <StatTile label="Enrolled" value={String(rosterCount)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Section title={`Marked present (${activeRecords.length})`} bodyClassName="p-0">
                {activeRecords.length === 0 ? (
                  <p className="text-muted-foreground p-5 text-sm">No one scanned yet.</p>
                ) : (
                  <ul className="divide-border divide-y">
                    {records.map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <EntityAvatar name={r.studentName} code={r.studentCode} size="sm" muted={r.status === 'void'} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="tabular text-xs font-medium">{formatTime(r.markedAt)}</p>
                            <p className="text-muted-foreground text-xs">{r.markedByName}</p>
                          </div>
                          {r.status === 'void' ? (
                            <PresetStatusPill preset="voided" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <PresetStatusPill preset={r.status === 'late' ? 'late' : 'present'} />
                              {r.method === 'manual' && <PresetStatusPill preset="manual" size="sm" />}
                              {can('attendance.void') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive size-8"
                                  onClick={() => setVoidTarget(r)}
                                  aria-label="Void record"
                                >
                                  <Ban className="size-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title={`Not yet marked (${absentees.length})`} bodyClassName="p-0">
                {absentees.length === 0 ? (
                  <p className="text-muted-foreground p-5 text-sm">Everyone enrolled has been marked.</p>
                ) : (
                  <ul className="divide-border divide-y">
                    {absentees.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <EntityAvatar name={s.fullName} code={s.studentCode} size="sm" muted />
                        </div>
                        {session.status === 'closed' ? (
                          <PresetStatusPill preset="absent" />
                        ) : (
                          can('attendance.markManual') && (
                            <ManualMarkButton onConfirm={(reason) => markPresent(s.id, reason)} />
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* Void confirmation */}
            <ConfirmDialog
              open={voidTarget !== null}
              onOpenChange={(o) => !o && setVoidTarget(null)}
              title="Void this attendance record?"
              description={
                <>
                  The record for <strong>{voidTarget?.studentName}</strong> stays in the register marked
                  VOID with your reason. It is never deleted.
                </>
              }
              confirmLabel="Void record"
              destructive
              requireReason
              onConfirm={async (reason) => {
                if (!voidTarget) return
                try {
                  await attendanceApi.voidRecord(voidTarget.id, reason)
                  await invalidate()
                  toast.success('Record voided.')
                } catch (err) {
                  toast.error(apiErrorMessage(err))
                }
              }}
            />

            {/* Close session */}
            <ConfirmDialog
              open={closeOpen}
              onOpenChange={setCloseOpen}
              title="Close this session?"
              description="Once closed, absentees are finalised from the enrolled students who were not marked. You can still void individual records afterwards."
              confirmLabel="Close session"
              onConfirm={async () => {
                try {
                  await sessionApi.close(sessionId)
                  await invalidate()
                  toast.success('Session closed.')
                } catch (err) {
                  toast.error(apiErrorMessage(err))
                }
              }}
            />
          </div>
        )
      }}
    </QueryBoundary>
  )
}

/** Manual mark needs a reason (FR-056); reuse the confirm dialog inline. */
function ManualMarkButton({ onConfirm }: { onConfirm: (reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Mark
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Mark present manually"
        description="Use this for a forgotten or damaged card. Manual marks are flagged separately from scans in reports."
        confirmLabel="Mark present"
        requireReason
        reasonLabel="Reason"
        reasonPlaceholder="e.g. forgot card, damaged QR"
        onConfirm={onConfirm}
      />
    </>
  )
}
