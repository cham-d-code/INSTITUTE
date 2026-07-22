import { cn } from '@/lib/utils'

/**
 * A horizontal bar list — the workhorse for the categorical breakdowns in
 * reports (collections by class, students by grade).
 *
 * Every bar is directly labelled with its value, so identity and magnitude
 * never rest on colour. That is also what discharges the palette validator's
 * contrast warning: with the number printed on every row, a low-contrast fill
 * is legible. A single graphite fill is used, not the categorical hues — these
 * are one measure split by category, not multiple series.
 */
export function BarList({
  items,
  formatValue = (v) => String(v),
  className,
  emptyLabel = 'No data.',
}: {
  items: Array<{ label: string; value: number }>
  formatValue?: (value: number) => string
  className?: string
  emptyLabel?: string
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>
  }
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="tabular shrink-0 font-semibold">{formatValue(item.value)}</span>
          </div>
          <div className="bg-secondary h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-chart-primary h-full rounded-full transition-[width]"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
