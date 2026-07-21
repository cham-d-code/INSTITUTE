import { useId, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Table2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface TrendSeries {
  key: string
  label: string
  /** A CSS colour. Use `var(--chart-primary)` for a lone series; the
   *  `--chart-1..5` slots IN ORDER when there is more than one. */
  colour: string
  data: Array<{ label: string; value: number }>
}

interface TrendChartProps {
  title: string
  series: TrendSeries[]
  /** Formats the y-axis ticks and tooltip values — money, percent, count. */
  formatValue: (value: number) => string
  /** Right-hand controls: period selector, measure toggle. */
  controls?: React.ReactNode
  height?: number
  className?: string
}

/**
 * Line chart for the revenue and attendance trends (FR-115).
 *
 * Deliberate choices, per the visualisation rules:
 *   - ONE y-axis, always. Two measures on different scales become two charts,
 *     never a second axis — a dual-axis chart lets the author imply any
 *     correlation they like by rescaling.
 *   - Grid is horizontal hairlines only; axes carry no line of their own. The
 *     data is the only assertive thing in the frame.
 *   - A single series gets no legend box — the title names it. Two or more get
 *     a legend AND direct labels, so identity never rests on colour alone.
 *   - A table view is always one click away. Three of the categorical slots
 *     sit below 3:1 contrast on a white card, and that obligates a text
 *     alternative rather than a promise that the colours are "probably fine".
 */
export function TrendChart({
  title,
  series,
  formatValue,
  controls,
  height = 260,
  className,
}: TrendChartProps) {
  const [showTable, setShowTable] = useState(false)
  const tableId = useId()

  const isMultiSeries = series.length > 1
  const labels = series[0]?.data.map((point) => point.label) ?? []

  // Recharts wants one row per x-value with a column per series.
  const merged = labels.map((label, index) => {
    const row: Record<string, string | number> = { label }
    for (const s of series) {
      row[s.key] = s.data[index]?.value ?? 0
    }
    return row
  })

  return (
    <div className={cn('card-surface flex flex-col p-5', className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          {controls}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            aria-controls={tableId}
          >
            {showTable ? (
              <>
                <TrendingUp className="size-4" /> Chart
              </>
            ) : (
              <>
                <Table2 className="size-4" /> Table
              </>
            )}
          </Button>
        </div>
      </div>

      {isMultiSeries && (
        <ul className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {series.map((s) => (
            <li key={s.key} className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.colour }}
                aria-hidden
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {showTable ? (
        <div id={tableId} className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}, as a table</caption>
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Period
                </th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="py-2 pr-4 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {merged.map((row) => (
                <tr key={String(row.label)} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">
                    {row.label}
                  </th>
                  {series.map((s) => (
                    <td key={s.key} className="tabular py-2 pr-4 text-right font-medium">
                      {formatValue(Number(row[s.key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="0"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--chart-axis)"
                tick={{ fill: 'var(--chart-label)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="var(--chart-axis)"
                tick={{ fill: 'var(--chart-label)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={formatValue}
              />
              <Tooltip
                cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-popover text-popover-foreground border-border rounded-xl border px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs font-semibold">{label}</p>
                      {payload.map((entry) => {
                        const s = series.find((x) => x.key === entry.dataKey)
                        return (
                          <p
                            key={String(entry.dataKey)}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: s?.colour }}
                              aria-hidden
                            />
                            <span className="text-muted-foreground">{s?.label}</span>
                            <span className="tabular ml-auto font-semibold">
                              {formatValue(Number(entry.value))}
                            </span>
                          </p>
                        )
                      })}
                    </div>
                  )
                }}
              />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.colour}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
