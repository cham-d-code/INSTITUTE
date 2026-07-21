import type { BillingMonth, Cents, ISODate, ISODateTime } from '@/types/domain'

/**
 * Display-boundary formatting. Money lives as integer cents everywhere else in
 * the app (see `types/domain.ts`); this module is the only place it becomes a
 * human-readable string.
 */

const CURRENCY = import.meta.env.VITE_CURRENCY ?? 'LKR'
const LOCALE = import.meta.env.VITE_LOCALE ?? 'en-LK'

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
})

const moneyCompact = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 250000 -> "Rs 2,500.00" */
export function formatMoney(cents: Cents): string {
  return money.format(cents / 100)
}

/** 250000 -> "Rs 2.5K". For dashboard tiles where space is tight. */
export function formatMoneyCompact(cents: Cents): string {
  return moneyCompact.format(cents / 100)
}

/** Parses user input ("2,500" or "2500.50") into cents. Returns null if the
 *  input isn't a clean number, so callers can surface a validation error
 *  rather than silently recording a wrong amount. */
export function parseMoneyToCents(input: string): Cents | null {
  const cleaned = input.replace(/[,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100)
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFmt = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

/** "21 Jul 2026" */
export function formatDate(value: ISODate | ISODateTime | Date): string {
  return dateFmt.format(new Date(value))
}

/** "08:03 AM" — the granularity that matters on an attendance record. */
export function formatTime(value: ISODateTime | Date): string {
  return timeFmt.format(new Date(value))
}

/** "21 Jul 2026, 08:03 AM" */
export function formatDateTime(value: ISODateTime | Date): string {
  const d = new Date(value)
  return `${dateFmt.format(d)}, ${timeFmt.format(d)}`
}

/** "2026-07" -> "July 2026" */
export function formatBillingMonth(month: BillingMonth): string {
  const [year, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(
    new Date(year, m - 1, 1),
  )
}

/** The billing month a date falls in. */
export function toBillingMonth(value: Date | ISODate = new Date()): BillingMonth {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Initials for the avatar fallback: "Nimal Perera" -> "NP". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Signed percentage change, for the month-on-month revenue tile (FR-110).
 *  Returns null when the previous period was zero — "+∞%" is not a useful
 *  thing to show an owner. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatWeekday(day: number, short = false): string {
  const name = WEEKDAYS[day] ?? ''
  return short ? name.slice(0, 3) : name
}

/** "08:00" + "10:00" -> "8:00 – 10:00 AM" */
export function formatTimeRange(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 === 0 ? 12 : h % 12
    return { text: `${hour}:${String(m).padStart(2, '0')}`, period }
  }
  const a = fmt(start)
  const b = fmt(end)
  return a.period === b.period
    ? `${a.text} – ${b.text} ${b.period}`
    : `${a.text} ${a.period} – ${b.text} ${b.period}`
}
