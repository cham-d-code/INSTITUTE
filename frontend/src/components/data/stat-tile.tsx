import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: string
  icon?: LucideIcon
  /** Signed percentage vs the comparison period; null when not comparable. */
  change?: number | null
  changeLabel?: string
  /** Set when a rise is bad news — arrears going up is not an improvement. */
  invertChangeColour?: boolean
  hint?: string
  className?: string
}

/**
 * The compact figure tiles from the reference dashboard: a big numeral, a
 * quiet label, an optional trend.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  invertChangeColour = false,
  hint,
  className,
}: StatTileProps) {
  const isUp = change != null && change > 0
  const isFlat = change != null && Math.abs(change) < 0.05
  const isGood = invertChangeColour ? !isUp : isUp

  return (
    <div className={cn('card-surface p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon && (
          <div className="bg-secondary text-secondary-foreground grid size-8 shrink-0 place-items-center rounded-xl">
            <Icon className="size-4" aria-hidden />
          </div>
        )}
      </div>

      <p className="tabular mt-3 text-3xl font-bold tracking-tight">{value}</p>

      {change != null && !isFlat && (
        <p
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-semibold',
            isGood ? 'text-status-ok-soft-foreground' : 'text-status-stop-soft-foreground',
          )}
        >
          {isUp ? (
            <ArrowUpRight className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden />
          )}
          <span className="tabular">
            {isUp ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          {changeLabel && <span className="text-muted-foreground font-normal">{changeLabel}</span>}
        </p>
      )}

      {change == null && hint && <p className="text-muted-foreground mt-2 text-xs">{hint}</p>}
    </div>
  )
}
