import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Landmark, Wallet } from 'lucide-react'
import { paymentApi, qk, serverNow } from '@/lib/api/endpoints'
import { formatDate, formatMoney, formatTime } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { StatTile } from '@/components/data/stat-tile'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Daily collection reconciliation — FR-078.
 *
 * The owner compares each assistant's system-recorded total against the cash
 * they physically hand over at day end. Cash and transfers are split because
 * only the cash figure has to match the notes in the drawer.
 *
 * An assistant sees only their own collection (collection.viewOwn); the owner
 * sees everyone (collection.viewAll).
 */
export function CollectionPage() {
  const { user, can } = useAuth()
  const [date, setDate] = useState(() => serverNow().toISOString().slice(0, 10))

  const query = useQuery({
    queryKey: qk.collection(date),
    queryFn: () => paymentApi.collection(date),
  })

  const viewAll = can('collection.viewAll')
  const rows = (query.data?.byAssistant ?? []).filter((r) => viewAll || r.userId === user?.id)
  const payments = (query.data?.payments ?? []).filter((p) => viewAll || p.collectedByUserId === user?.id)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const cash = rows.reduce((s, r) => s + r.cash, 0)
  const transfer = rows.reduce((s, r) => s + r.transfer, 0)

  return (
    <div>
      <PageHeader
        title="Daily collection"
        description={
          viewAll
            ? 'Cash-in-hand reconciliation per assistant. Compare each total against the cash handed over.'
            : 'Your collection for the selected day.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-muted-foreground text-sm">
              Day
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-[160px] rounded-xl"
            />
          </div>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total collected" value={formatMoney(total)} icon={Wallet} hint={formatDate(date)} />
        <StatTile label="Cash" value={formatMoney(cash)} icon={Banknote} hint="must match the drawer" />
        <StatTile label="Bank transfers" value={formatMoney(transfer)} icon={Landmark} />
      </div>

      {viewAll && (
        <Section title="By assistant" className="mb-4" bodyClassName="p-0">
          {query.isLoading ? (
            <div className="p-5">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground p-5 text-sm">No collections on this day.</p>
          ) : (
            <ul className="divide-border divide-y">
              {rows.map((r) => (
                <li key={r.userId} className="flex items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <EntityAvatar name={r.name} code={`${r.count} payments`} size="sm" muted />
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-muted-foreground text-xs">Cash</p>
                    <p className="tabular text-sm font-semibold">{formatMoney(r.cash)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-muted-foreground text-xs">Transfer</p>
                    <p className="tabular text-sm font-semibold">{formatMoney(r.transfer)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="tabular text-base font-bold">{formatMoney(r.amount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title={`Payments (${payments.length})`} bodyClassName="p-0">
        {payments.length === 0 ? (
          <p className="text-muted-foreground p-5 text-sm">No payments recorded on this day.</p>
        ) : (
          <ul className="divide-border divide-y">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="tabular text-muted-foreground w-28 shrink-0 text-xs font-medium">
                  {p.receiptNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.studentName}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatTime(p.paidAt)} · {p.collectedByName}
                  </p>
                </div>
                <PresetStatusPill preset={p.method === 'cash' ? 'active' : 'approved'} labelOverride={p.method === 'cash' ? 'Cash' : 'Transfer'} size="sm" />
                <span className="tabular w-24 shrink-0 text-right text-sm font-semibold">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
