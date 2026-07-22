import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, Users } from 'lucide-react'
import { classApi, qk } from '@/lib/api/endpoints'
import { formatMoney, formatTimeRange, formatWeekday } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EmptyState } from '@/components/common/states'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function ClassesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const classesQuery = useQuery({ queryKey: qk.classes, queryFn: classApi.list })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = classesQuery.data ?? []
    if (!q) return rows
    return rows.filter(
      (c) =>
        `${c.grade} ${c.subjectName}`.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q),
    )
  }, [classesQuery.data, search])

  return (
    <div>
      <PageHeader title="Classes" description="Subject, grade, teacher, schedule and monthly fee." />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search class or teacher…" className="sm:max-w-xs" />
      </Toolbar>

      {classesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyState icon={CalendarClock} title="No classes match" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const full = c.capacity != null && c.enrolledCount >= c.capacity
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/classes/${c.id}`)}
                className="card-surface hover:border-primary/30 flex flex-col p-5 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold tracking-tight">
                      {c.grade} {c.subjectName}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">{c.teacherName}</p>
                  </div>
                  <span className="bg-secondary shrink-0 rounded-lg px-2 py-1 text-xs font-semibold">
                    {formatMoney(c.monthlyFee)}
                  </span>
                </div>

                <div className="text-muted-foreground mt-4 space-y-1.5 text-xs">
                  {c.schedules.map((s, i) => (
                    <p key={i} className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      {formatWeekday(s.weekday)} · {formatTimeRange(s.startTime, s.endTime)}
                      {c.hall && ` · ${c.hall}`}
                    </p>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t pt-3">
                  <Users className="text-muted-foreground size-4" />
                  <span className={cn('text-sm font-semibold', full && 'text-status-warn-soft-foreground')}>
                    {c.enrolledCount}
                    {c.capacity != null && ` / ${c.capacity}`}
                  </span>
                  <span className="text-muted-foreground text-xs">enrolled{full && ' · full'}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
