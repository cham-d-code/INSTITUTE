import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { Payment } from '@/types/domain'
import { paymentApi, refApi, qk } from '@/lib/api/endpoints'
import { formatBillingMonth, formatDateTime, formatMoney } from '@/lib/format'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PresetStatusPill } from '@/components/data/status-pill'

/**
 * Printable receipt (FR-074). The `.receipt-print` block is the only thing that
 * survives the print stylesheet — sized for a narrow thermal roll. Reprints are
 * logged server-side (the reprint button calls the API), because a reprinted
 * receipt is a way cash can be double-counted if it goes unrecorded.
 */
export function ReceiptDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const instituteQuery = useQuery({ queryKey: qk.institute, queryFn: refApi.institute })

  if (!payment) return null

  async function handlePrint(isReprint: boolean) {
    if (isReprint && payment) {
      try {
        await paymentApi.reprint(payment.id)
      } catch {
        toast.error('Could not log the reprint.')
        return
      }
    }
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Receipt
            {payment.status === 'void' && <PresetStatusPill preset="voided" />}
          </DialogTitle>
        </DialogHeader>

        <div className="receipt-print bg-card border-border rounded-xl border p-5">
          <div className="text-center">
            <p className="text-base font-black tracking-tight">{instituteQuery.data?.name ?? 'Institute'}</p>
            <p className="text-muted-foreground text-xs">Payment Receipt</p>
          </div>

          <div className="my-4 border-y py-3 text-sm">
            <Row label="Receipt no." value={<span className="tabular font-bold">{payment.receiptNumber}</span>} />
            <Row label="Date" value={formatDateTime(payment.paidAt)} />
            <Row label="Student" value={`${payment.studentName} (${payment.studentCode})`} />
            <Row label="Collected by" value={payment.collectedByName} />
            <Row label="Method" value={payment.method === 'cash' ? 'Cash' : `Bank transfer${payment.bankReference ? ` · ${payment.bankReference}` : ''}`} />
          </div>

          <table className="w-full text-sm">
            <tbody>
              {payment.allocations.map((a, i) => (
                <tr key={i}>
                  <td className="py-1">
                    {a.className}
                    <span className="text-muted-foreground"> · {formatBillingMonth(a.month)}</span>
                  </td>
                  <td className="tabular py-1 text-right font-medium">{formatMoney(a.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td className="pt-2 font-bold">Total</td>
                <td className="tabular pt-2 text-right text-base font-black">{formatMoney(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>

          {payment.status === 'void' && (
            <p className="text-status-stop-soft-foreground mt-3 text-center text-xs font-bold">
              VOIDED — {payment.voidedReason}
            </p>
          )}

          {payment.reprintCount > 0 && (
            <p className="text-muted-foreground mt-3 text-center text-[10px]">
              Reprint #{payment.reprintCount}
            </p>
          )}
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handlePrint(payment.reprintCount > 0 || false)}>
            <Printer className="size-4" /> Print
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handlePrint(true)}>
            <Printer className="size-4" /> Reprint (logged)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
