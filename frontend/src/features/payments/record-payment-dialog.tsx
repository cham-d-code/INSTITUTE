import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { Due, Payment, Student } from '@/types/domain'
import { feeApi, paymentApi, qk, studentApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatBillingMonth, formatMoney } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MoneyInput } from '@/components/form/money-input'
import { EntityAvatar } from '@/components/data/entity-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Record a cash (or transfer) payment — FR-072..075.
 *
 * The assistant scans or searches the student, ticks the month(s) being paid,
 * and confirms the amount. Partial payments are supported by editing the
 * per-due amount. On success the parent gets the receipt back to print.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  presetStudentId,
  onRecorded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetStudentId?: string | null
  onRecorded: (payment: Payment) => void
}) {
  const queryClient = useQueryClient()
  const [studentId, setStudentId] = useState<string | null>(presetStudentId ?? null)

  useEffect(() => {
    if (open) setStudentId(presetStudentId ?? null)
  }, [open, presetStudentId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Select the student and the months being paid. A receipt is issued on save.
          </DialogDescription>
        </DialogHeader>

        {studentId ? (
          <PaymentForm
            studentId={studentId}
            onBack={() => !presetStudentId && setStudentId(null)}
            allowBack={!presetStudentId}
            onDone={(payment) => {
              void queryClient.invalidateQueries({ queryKey: qk.payments })
              void queryClient.invalidateQueries({ queryKey: qk.arrears })
              void queryClient.invalidateQueries({ queryKey: qk.studentDues(studentId) })
              onRecorded(payment)
              onOpenChange(false)
            }}
          />
        ) : (
          <StudentPicker onPick={setStudentId} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StudentPicker({ onPick }: { onPick: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const studentsQuery = useQuery({ queryKey: qk.students, queryFn: studentApi.list })

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = (studentsQuery.data ?? []).filter((s) => s.status === 'active')
    if (!q) return rows.slice(0, 8)
    return rows
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.guardians.some((g) => g.phonePrimary.replace(/\s/g, '').includes(q.replace(/\s/g, ''))),
      )
      .slice(0, 12)
  }, [studentsQuery.data, search])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, ID or guardian phone…"
          className="h-11 rounded-xl pl-9"
        />
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {results.map((s: Student) => (
          <li key={s.id}>
            <button
              onClick={() => onPick(s.id)}
              className="hover:bg-secondary flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors"
            >
              <EntityAvatar name={s.fullName} code={`${s.studentCode} · ${s.grade}`} photoUrl={s.photoUrl} size="sm" />
            </button>
          </li>
        ))}
        {results.length === 0 && <li className="text-muted-foreground p-3 text-sm">No matching students.</li>}
      </ul>
    </div>
  )
}

function PaymentForm({
  studentId,
  onBack,
  allowBack,
  onDone,
}: {
  studentId: string
  onBack: () => void
  allowBack: boolean
  onDone: (payment: Payment) => void
}) {
  const studentQuery = useQuery({ queryKey: qk.student(studentId), queryFn: () => studentApi.get(studentId) })
  const duesQuery = useQuery({ queryKey: qk.studentOpenDues(studentId), queryFn: () => feeApi.openDues(studentId) })

  const [selected, setSelected] = useState<Record<string, number>>({})
  const [method, setMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const dues = duesQuery.data ?? []
  const total = Object.values(selected).reduce((s, v) => s + v, 0)

  function toggle(due: Due, on: boolean) {
    setSelected((prev) => {
      const next = { ...prev }
      if (on) next[due.id] = due.outstanding
      else delete next[due.id]
      return next
    })
  }

  async function submit() {
    const allocations = Object.entries(selected)
      .filter(([, amount]) => amount > 0)
      .map(([dueId, amount]) => ({ dueId, amount }))
    if (!allocations.length) {
      toast.warning('Select at least one month to pay.')
      return
    }
    setSubmitting(true)
    try {
      const payment = await paymentApi.record({ studentId, allocations, method, bankReference: reference || null })
      toast.success(`Receipt ${payment.receiptNumber} issued.`)
      onDone(payment)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {studentQuery.data && (
        <div className="bg-secondary/50 flex items-center justify-between rounded-xl p-3">
          <EntityAvatar
            name={studentQuery.data.fullName}
            code={`${studentQuery.data.studentCode} · ${studentQuery.data.grade}`}
            photoUrl={studentQuery.data.photoUrl}
            size="sm"
          />
          {allowBack && (
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={onBack}>
              Change
            </Button>
          )}
        </div>
      )}

      <div>
        <Label className="mb-2 block text-xs">Outstanding dues</Label>
        {duesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading dues…</p>
        ) : dues.length === 0 ? (
          <p className="text-muted-foreground bg-secondary/50 rounded-xl p-3 text-sm">
            Nothing outstanding for this student.
          </p>
        ) : (
          <ul className="space-y-2">
            {dues.map((due) => {
              const on = due.id in selected
              return (
                <li
                  key={due.id}
                  className={cn(
                    'rounded-xl border p-3 transition-colors',
                    on ? 'border-primary bg-secondary/40' : 'border-border',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={on} onCheckedChange={(v) => toggle(due, Boolean(v))} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{due.className}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatBillingMonth(due.month)} · {formatMoney(due.outstanding)} outstanding
                      </p>
                    </div>
                    {on && (
                      <div className="w-32">
                        <MoneyInput
                          valueCents={selected[due.id]}
                          max={due.outstanding}
                          onValueChange={(cents) =>
                            setSelected((prev) => ({ ...prev, [due.id]: cents ?? 0 }))
                          }
                        />
                      </div>
                    )}
                  </div>
                  {on && selected[due.id] < due.outstanding && (
                    <p className="text-status-warn-soft-foreground mt-2 pl-7 text-xs">
                      Partial — {formatMoney(due.outstanding - selected[due.id])} will remain.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {method === 'bank_transfer' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} className="h-10 rounded-xl" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="tabular text-2xl font-bold">{formatMoney(total)}</p>
        </div>
        <Button className="rounded-xl" disabled={submitting || total === 0} onClick={submit}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Record & issue receipt
        </Button>
      </div>
    </div>
  )
}
