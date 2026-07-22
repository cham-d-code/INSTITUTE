import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Pencil, Phone, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { cardApi, feeApi, qk, studentApi } from '@/lib/api/endpoints'
import type { Student } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api/client'
import { formatBillingMonth, formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { BackLink, DetailField, DetailGrid, Section } from '@/components/common/section'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { QueryBoundary } from '@/components/common/states'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FullPageSpinner } from '@/components/common/full-page-spinner'

const STATUS_PRESET = { active: 'active', inactive: 'inactive', left: 'left' } as const

export function StudentDetailPage() {
  const { studentId = '' } = useParams()
  const query = useQuery({ queryKey: qk.student(studentId), queryFn: () => studentApi.get(studentId) })

  if (query.isLoading) return <FullPageSpinner label="Loading student" />

  return (
    <QueryBoundary query={query}>
      {(student) => <StudentDetail student={student} />}
    </QueryBoundary>
  )
}

function StudentDetail({ student }: { student: Student }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useAuth()
  const [reissueOpen, setReissueOpen] = useState(false)

  const enrollmentsQuery = useQuery({
    queryKey: qk.studentEnrollments(student.id),
    queryFn: () => studentApi.enrollments(student.id),
  })
  const attendanceQuery = useQuery({
    queryKey: qk.studentAttendance(student.id),
    queryFn: () => studentApi.attendanceHistory(student.id),
  })
  const duesQuery = useQuery({
    queryKey: qk.studentDues(student.id),
    queryFn: () => feeApi.duesForStudent(student.id),
  })

  const outstanding = (duesQuery.data ?? []).reduce((s, d) => s + d.outstanding, 0)

  async function changeStatus(status: Student['status']) {
    try {
      await studentApi.setStatus(student.id, status)
      await queryClient.invalidateQueries({ queryKey: qk.student(student.id) })
      await queryClient.invalidateQueries({ queryKey: qk.students })
      toast.success(`Status changed to ${status}.`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <BackLink to="/students">Back to students</BackLink>

      <PageHeader
        title={student.fullName}
        description={`${student.studentCode} · ${student.grade} · registered ${formatDate(student.registrationDate)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {can('students.edit') && (
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/students/${student.id}/edit`)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            {can('cards.reissue') && (
              <Button variant="outline" className="rounded-2xl" onClick={() => setReissueOpen(true)}>
                <CreditCard className="size-4" /> Reissue card
              </Button>
            )}
            {can('payments.record') && outstanding > 0 && (
              <Button className="rounded-2xl" asChild>
                <Link to={`/payments?student=${student.id}`}>
                  <Wallet className="size-4" /> Record payment
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Details">
            <div className="mb-5 flex items-center justify-between">
              <EntityAvatar name={student.fullName} code={student.studentCode} photoUrl={student.photoUrl} size="lg" />
              <div className="flex items-center gap-2">
                <PresetStatusPill preset={STATUS_PRESET[student.status]} size="lg" />
                {can('students.edit') && (
                  <Select value={student.status} onValueChange={(v) => changeStatus(v as Student['status'])}>
                    <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DetailGrid>
              <DetailField label="Display name">{student.displayName}</DetailField>
              <DetailField label="Academic year">{student.academicYear}</DetailField>
              <DetailField label="Date of birth">
                {student.dateOfBirth ? formatDate(student.dateOfBirth) : null}
              </DetailField>
              <DetailField label="Gender">{student.gender}</DetailField>
              <DetailField label="Student phone">{student.phone}</DetailField>
              <DetailField label="Address">{student.address}</DetailField>
            </DetailGrid>
            {student.notes && (
              <div className="bg-secondary/50 mt-4 rounded-xl p-3">
                <p className="text-muted-foreground text-xs font-medium">Notes</p>
                <p className="mt-1 text-sm">{student.notes}</p>
              </div>
            )}
          </Section>

          <Section title="History" bodyClassName="p-0">
            <Tabs defaultValue="enrollments">
              <div className="px-5 pt-4">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="enrollments" className="rounded-lg text-xs">
                    Classes ({enrollmentsQuery.data?.filter((e) => e.status === 'active').length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="rounded-lg text-xs">
                    Attendance
                  </TabsTrigger>
                  <TabsTrigger value="fees" className="rounded-lg text-xs">
                    Fees
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="enrollments" className="p-5 pt-4">
                {(enrollmentsQuery.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">Not enrolled in any class.</p>
                ) : (
                  <ul className="space-y-2">
                    {(enrollmentsQuery.data ?? []).map((e) => (
                      <li
                        key={e.id}
                        className="border-border flex items-center justify-between rounded-xl border px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{e.classId}</p>
                          <p className="text-muted-foreground text-xs">
                            Since {formatDate(e.startDate)}
                            {e.endDate && ` · ended ${formatDate(e.endDate)}`}
                          </p>
                        </div>
                        <PresetStatusPill preset={e.status === 'active' ? 'active' : 'inactive'} labelOverride={e.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="attendance" className="p-5 pt-4">
                {(attendanceQuery.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No attendance recorded yet.</p>
                ) : (
                  <ul className="divide-border divide-y">
                    {(attendanceQuery.data ?? []).slice(0, 20).map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium">{formatDateTime(a.markedAt)}</p>
                          <p className="text-muted-foreground text-xs">
                            by {a.markedByName} · {a.method}
                            {a.reason && ` · ${a.reason}`}
                          </p>
                        </div>
                        <PresetStatusPill
                          preset={a.status === 'void' ? 'voided' : a.status === 'late' ? 'late' : 'present'}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="fees" className="p-5 pt-4">
                {(duesQuery.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No dues generated yet.</p>
                ) : (
                  <ul className="divide-border divide-y">
                    {(duesQuery.data ?? []).map((d) => (
                      <li key={d.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm font-medium">{d.className}</p>
                          <p className="text-muted-foreground text-xs">{formatBillingMonth(d.month)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular text-sm font-semibold">{formatMoney(d.netAmount)}</span>
                          <PresetStatusPill
                            preset={d.status}
                            labelOverride={
                              d.status === 'partial' ? `Partial · ${formatMoney(d.outstanding)} left` : undefined
                            }
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Outstanding">
            <p className="tabular text-3xl font-bold">{formatMoney(outstanding)}</p>
            <p className="text-muted-foreground mt-1 text-sm">across all classes and months</p>
          </Section>

          <Section title="Guardians">
            <ul className="space-y-3">
              {student.guardians.map((g) => (
                <li key={g.id} className="border-border rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{g.fullName}</p>
                    {g.isPrimary && <PresetStatusPill preset="active" labelOverride="Primary" size="sm" />}
                  </div>
                  <p className="text-muted-foreground text-xs">{g.relationship}</p>
                  <a
                    href={`tel:${g.phonePrimary}`}
                    className="text-foreground mt-2 flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Phone className="size-3.5" /> {g.phonePrimary}
                  </a>
                  {g.email && <p className="text-muted-foreground mt-0.5 text-xs">{g.email}</p>}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={reissueOpen}
        onOpenChange={setReissueOpen}
        title="Reissue ID card?"
        description="This generates a new QR token and immediately revokes the current card. A scan of the old card will show 'CARD REVOKED'. An optional reissue fee may apply."
        confirmLabel="Reissue card"
        requireReason
        reasonLabel="Reason for reissue"
        reasonPlaceholder="e.g. card lost, card damaged"
        onConfirm={async (reason) => {
          try {
            await cardApi.reissue(student.id, reason)
            await queryClient.invalidateQueries({ queryKey: qk.card(student.id) })
            toast.success('New card issued. Old token revoked.')
          } catch (err) {
            toast.error(apiErrorMessage(err))
          }
        }}
      />
    </div>
  )
}
