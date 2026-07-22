import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { discountApi, qk, refApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatBillingMonth, formatMoney } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { PresetStatusPill } from '@/components/data/status-pill'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Fee policy and discount approvals — FR-070, FR-071, FR-076.
 *
 * Discounts and free cards require Super Admin approval and always carry a
 * recorded reason; that is the control that keeps fee waivers from being a
 * quiet way to lose revenue.
 */
export function FeeSettingsPage() {
  const queryClient = useQueryClient()
  const instituteQuery = useQuery({ queryKey: qk.institute, queryFn: refApi.institute })
  const discountsQuery = useQuery({ queryKey: qk.discounts, queryFn: discountApi.list })

  const pending = (discountsQuery.data ?? []).filter((d) => d.status === 'pending')
  const decided = (discountsQuery.data ?? []).filter((d) => d.status !== 'pending')

  async function setProration(value: boolean) {
    try {
      await refApi.updateInstitute({ proration: value })
      await queryClient.invalidateQueries({ queryKey: qk.institute })
      toast.success('Fee policy updated.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function decide(id: string, approve: boolean) {
    try {
      await discountApi.decide(id, approve)
      await queryClient.invalidateQueries({ queryKey: qk.discounts })
      toast.success(approve ? 'Discount approved.' : 'Discount rejected.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader title="Fees & discounts" description="Fee policy and approval of discounts and free cards." />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Discount approvals" description="Discounts apply per student per class and require your sign-off." bodyClassName="p-0">
            {discountsQuery.isLoading ? (
              <div className="p-5">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <>
                {pending.length === 0 && (
                  <p className="text-muted-foreground p-5 text-sm">No discounts awaiting approval.</p>
                )}
                <ul className="divide-border divide-y">
                  {pending.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <EntityAvatar name={d.studentName} code={d.className ?? undefined} size="sm" muted />
                      </div>
                      <div className="text-right">
                        <p className="tabular text-sm font-bold">
                          {d.kind === 'percentage' ? `${d.value}%` : formatMoney(d.value)}
                        </p>
                        <p className="text-muted-foreground text-xs">{d.reason}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-status-ok-soft-foreground rounded-lg"
                          onClick={() => decide(d.id, true)}
                        >
                          <Check className="size-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={() => decide(d.id, false)}
                        >
                          <X className="size-4" /> Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                {decided.length > 0 && (
                  <div className="border-t">
                    <p className="text-muted-foreground px-5 pt-4 pb-2 text-xs font-semibold tracking-wide uppercase">
                      Decided
                    </p>
                    <ul className="divide-border divide-y">
                      {decided.map((d) => (
                        <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{d.studentName}</p>
                            <p className="text-muted-foreground text-xs">
                              {d.reason} · {formatBillingMonth(d.effectiveFrom)}
                            </p>
                          </div>
                          <span className="tabular text-sm font-semibold">
                            {d.kind === 'percentage' ? `${d.value}%` : formatMoney(d.value)}
                          </span>
                          <PresetStatusPill preset={d.status === 'approved' ? 'approved' : 'rejected'} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Fee policy">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="proration" className="text-sm font-medium">
                  Prorate mid-month joins
                </Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  When on, a student joining mid-month is billed a partial fee based on the enrolment date.
                  When off, the full monthly fee applies.
                </p>
              </div>
              <Switch
                id="proration"
                checked={instituteQuery.data?.proration ?? false}
                onCheckedChange={setProration}
              />
            </div>
          </Section>

          <Section title="One-time charges" description="Applied on top of monthly fees.">
            <ul className="space-y-2 text-sm">
              {['Admission fee', 'Paper / material fee', 'Exam fee', 'Card reissue fee'].map((c) => (
                <li key={c} className="border-border flex items-center justify-between rounded-xl border px-3 py-2">
                  <span>{c}</span>
                  <span className="text-muted-foreground text-xs">Configurable</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}
