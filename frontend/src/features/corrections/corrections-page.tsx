import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { CorrectionRequest } from '@/types/domain'
import { correctionApi, qk } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { PresetStatusPill } from '@/components/data/status-pill'
import { EmptyState } from '@/components/common/states'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Correction requests — FR-057, §6.4.
 *
 * Assistants cannot rewrite a past attendance or payment record; they raise a
 * request here. A Super Admin approving it voids the original (retained, marked
 * VOID with the reason) and the corrected entry is made. Both the request and
 * the decision are in the audit trail.
 */
export function CorrectionsPage() {
  const queryClient = useQueryClient()
  const { isSuperAdmin } = useAuth()
  const query = useQuery({ queryKey: qk.corrections, queryFn: correctionApi.list })
  const [decision, setDecision] = useState<{ req: CorrectionRequest; approve: boolean } | null>(null)

  const pending = (query.data ?? []).filter((c) => c.status === 'pending')
  const decided = (query.data ?? []).filter((c) => c.status !== 'pending')

  return (
    <div>
      <PageHeader
        title="Corrections"
        description={
          isSuperAdmin
            ? 'Review requests from assistants. Approving voids the original record and applies the fix.'
            : 'Requests you have raised to correct a past record. A Super Admin reviews each one.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title={`Pending (${pending.length})`} bodyClassName="p-0">
            {query.isLoading ? (
              <div className="p-5">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : pending.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Nothing pending" description="No correction requests to review." />
            ) : (
              <ul className="divide-border divide-y">
                {pending.map((c) => (
                  <li key={c.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <PresetStatusPill
                            preset="pending"
                            labelOverride={c.targetType === 'payment' ? 'Payment' : 'Attendance'}
                          />
                          <span className="text-muted-foreground text-xs">by {c.requestedByName}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium">{c.reason}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Proposed: {c.proposedChange} · {formatDateTime(c.requestedAt)}
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => setDecision({ req: c, approve: true })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive rounded-lg"
                            onClick={() => setDecision({ req: c, approve: false })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {decided.length > 0 && (
            <Section title="Reviewed" bodyClassName="p-0">
              <ul className="divide-border divide-y">
                {decided.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.reason}</p>
                      <p className="text-muted-foreground text-xs">
                        {c.requestedByName} → {c.reviewedByName} · {c.reviewNote || 'no note'}
                      </p>
                    </div>
                    <PresetStatusPill preset={c.status === 'approved' ? 'approved' : 'rejected'} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div>
          <Section title="How corrections work">
            <ol className="text-muted-foreground space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="bg-secondary text-secondary-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">1</span>
                An assistant spots a mistake — a payment on the wrong student, a bad attendance mark.
              </li>
              <li className="flex gap-2">
                <span className="bg-secondary text-secondary-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">2</span>
                They raise a request with a reason. They cannot edit the record themselves.
              </li>
              <li className="flex gap-2">
                <span className="bg-secondary text-secondary-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">3</span>
                A Super Admin approves — the original is voided (kept, marked VOID) and re-entered correctly.
              </li>
              <li className="flex gap-2">
                <span className="bg-secondary text-secondary-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">4</span>
                Both actions, both users and the timestamps land in the audit log.
              </li>
            </ol>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(o) => !o && setDecision(null)}
        title={decision?.approve ? 'Approve correction?' : 'Reject correction?'}
        description={
          decision?.approve
            ? 'This voids the original record (kept and marked VOID) and applies the correction. Add a note for the audit trail.'
            : 'The original record is left unchanged. Add a note explaining why.'
        }
        confirmLabel={decision?.approve ? 'Approve' : 'Reject'}
        destructive={!decision?.approve}
        requireReason
        reasonLabel="Review note"
        onConfirm={async (note) => {
          if (!decision) return
          try {
            await correctionApi.decide(decision.req.id, decision.approve, note)
            await queryClient.invalidateQueries({ queryKey: qk.corrections })
            await queryClient.invalidateQueries({ queryKey: qk.payments })
            await queryClient.invalidateQueries({ queryKey: qk.dashboard })
            toast.success(decision.approve ? 'Correction approved.' : 'Correction rejected.')
          } catch (err) {
            toast.error(apiErrorMessage(err))
          }
        }}
      />
    </div>
  )
}
