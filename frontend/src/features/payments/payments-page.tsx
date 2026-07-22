import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Ban, Plus, Printer, Receipt, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import type { Payment } from '@/types/domain'
import { paymentApi, qk } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatBillingMonth, formatDateTime, formatMoney } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { DataTable } from '@/components/data/data-table'
import { EmptyState } from '@/components/common/states'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { RecordPaymentDialog } from './record-payment-dialog'
import { ReceiptDialog } from './receipt-dialog'

export function PaymentsPage() {
  const { can } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [receipt, setReceipt] = useState<Payment | null>(null)
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null)

  const paymentsQuery = useQuery({ queryKey: qk.payments, queryFn: paymentApi.list })

  // Deep link from a student profile: /payments?student=<id> opens the recorder.
  const presetStudent = searchParams.get('student')
  useEffect(() => {
    if (presetStudent) setRecordOpen(true)
  }, [presetStudent])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = paymentsQuery.data ?? []
    if (!q) return rows
    return rows.filter(
      (p) =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentCode.toLowerCase().includes(q),
    )
  }, [paymentsQuery.data, search])

  const columns = useMemo<ColumnDef<Payment, unknown>[]>(
    () => [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt',
        cell: ({ getValue }) => <span className="tabular text-sm font-semibold">{getValue<string>()}</span>,
      },
      {
        id: 'student',
        header: 'Student',
        accessorFn: (p) => p.studentName,
        cell: ({ row }) => <EntityAvatar name={row.original.studentName} code={row.original.studentCode} size="sm" />,
      },
      {
        id: 'for',
        header: 'For',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.allocations.map((a) => `${a.className.split(' ').slice(0, 2).join(' ')} ${formatBillingMonth(a.month).split(' ')[0]}`).join(', ')}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => <span className="tabular text-sm font-semibold">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ getValue }) => (
          <span className="text-sm capitalize">{getValue<string>().replace('_', ' ')}</span>
        ),
      },
      {
        id: 'collectedBy',
        header: 'By',
        accessorFn: (p) => p.collectedByName,
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.collectedByName}</span>,
      },
      {
        accessorKey: 'paidAt',
        header: 'Date',
        cell: ({ getValue }) => <span className="text-muted-foreground text-xs">{formatDateTime(getValue<string>())}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue<string>() === 'void' ? <PresetStatusPill preset="voided" /> : <PresetStatusPill preset="approved" labelOverride="Valid" />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.stopPropagation()
                setReceipt(row.original)
              }}
              aria-label="View receipt"
            >
              <Printer className="size-4" />
            </Button>
            {can('payments.void') && row.original.status === 'valid' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setVoidTarget(row.original)
                }}
                aria-label="Void payment"
              >
                <Ban className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [can],
  )

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Recorded payments with receipt number, method and the assistant who collected them."
        actions={
          can('payments.record') && (
            <Button className="rounded-2xl" onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" /> Record payment
            </Button>
          )
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search receipt, student…" className="sm:max-w-xs" />
      </Toolbar>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={paymentsQuery.isLoading}
        onRowClick={(p) => setReceipt(p)}
        empty={
          <EmptyState
            icon={Wallet}
            title="No payments yet"
            description="Recorded payments will appear here."
            action={
              can('payments.record') && (
                <Button className="rounded-xl" onClick={() => setRecordOpen(true)}>
                  <Receipt className="size-4" /> Record the first payment
                </Button>
              )
            }
          />
        }
      />

      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={(o) => {
          setRecordOpen(o)
          if (!o && presetStudent) {
            searchParams.delete('student')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        presetStudentId={presetStudent}
        onRecorded={(payment) => setReceipt(payment)}
      />

      <ReceiptDialog payment={receipt} open={receipt !== null} onOpenChange={(o) => !o && setReceipt(null)} />

      <ConfirmDialog
        open={voidTarget !== null}
        onOpenChange={(o) => !o && setVoidTarget(null)}
        title="Void this payment?"
        description={
          <>
            Receipt <strong>{voidTarget?.receiptNumber}</strong> ({formatMoney(voidTarget?.amount ?? 0)}) will be
            reversed and its dues re-opened. The original stays visible, marked VOID with your reason.
          </>
        }
        confirmLabel="Void payment"
        destructive
        requireReason
        onConfirm={async (reason) => {
          if (!voidTarget) return
          try {
            await paymentApi.voidPayment(voidTarget.id, reason)
            await queryClient.invalidateQueries({ queryKey: qk.payments })
            await queryClient.invalidateQueries({ queryKey: qk.arrears })
            toast.success('Payment voided and dues re-opened.')
          } catch (err) {
            toast.error(apiErrorMessage(err))
          }
        }}
      />
    </div>
  )
}
