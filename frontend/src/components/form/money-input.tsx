import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { parseMoneyToCents } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Money entry that reports value in integer cents, never a float — matching
 * how money is represented everywhere else. The visible string stays under the
 * user's control (so "2,500" and "2500" both work) while `onValueChange` fires
 * only when the input parses cleanly.
 */
export const MoneyInput = forwardRef<
  HTMLInputElement,
  {
    valueCents: number | null
    onValueChange: (cents: number | null) => void
    currencyPrefix?: string
    placeholder?: string
    max?: number
    className?: string
    id?: string
    disabled?: boolean
  }
>(function MoneyInput(
  { valueCents, onValueChange, currencyPrefix = 'Rs', placeholder = '0.00', max, className, id, disabled },
  ref,
) {
  const [text, setText] = useState(() => (valueCents != null ? (valueCents / 100).toFixed(2) : ''))
  const invalid = text.trim() !== '' && parseMoneyToCents(text) === null

  return (
    <div className={cn('relative', className)}>
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
        {currencyPrefix}
      </span>
      <Input
        id={id}
        ref={ref}
        inputMode="decimal"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          const cents = parseMoneyToCents(next)
          if (next.trim() === '') onValueChange(null)
          else if (cents != null && (max == null || cents <= max)) onValueChange(cents)
        }}
        className={cn(
          'tabular h-10 rounded-xl pl-9 text-right',
          invalid && 'border-destructive focus-visible:ring-destructive',
        )}
        aria-invalid={invalid}
      />
    </div>
  )
})
