import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, Printer } from 'lucide-react'
import type { Student } from '@/types/domain'
import { qk, studentApi } from '@/lib/api/endpoints'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EmptyState } from '@/components/common/states'
import { IdCard } from './id-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * ID card generation and batch printing — FR-040, FR-042.
 *
 * Select students, then print. The print stylesheet lays the selected cards
 * out on an A4 sheet at CR80 size; individual cards can also be printed one at
 * a time. Reissue (which revokes the old token) lives on the student profile.
 */
export function CardsPage() {
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const studentsQuery = useQuery({ queryKey: qk.students, queryFn: studentApi.list })

  const grades = useMemo(
    () => [...new Set((studentsQuery.data ?? []).map((s) => s.grade))].sort(),
    [studentsQuery.data],
  )

  const students = useMemo(() => {
    let rows = (studentsQuery.data ?? []).filter((s) => s.status !== 'left')
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q))
    if (grade !== 'all') rows = rows.filter((s) => s.grade === grade)
    return rows
  }, [studentsQuery.data, search, grade])

  const selectedStudents = (studentsQuery.data ?? []).filter((s) => selected.has(s.id))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = students.length > 0 && students.every((s) => selected.has(s.id))
  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) students.forEach((s) => next.delete(s.id))
      else students.forEach((s) => next.add(s.id))
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="ID cards"
        description="Generate and batch-print QR student cards. Reissue a lost card from the student's profile."
        actions={
          <Button className="rounded-2xl" disabled={selected.size === 0} onClick={() => window.print()}>
            <Printer className="size-4" /> Print {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search student…" className="sm:max-w-xs" />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button variant="outline" className="rounded-xl" onClick={toggleAllVisible} disabled={students.length === 0}>
            {allVisibleSelected ? 'Clear' : 'Select all shown'}
          </Button>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="h-10 w-[140px] rounded-xl">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All grades</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      {/* Selection grid — hidden from print */}
      <div className="print:hidden">
        {studentsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[1.585] rounded-xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="card-surface">
            <EmptyState icon={CreditCard} title="No students match" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  'relative rounded-2xl p-1 text-left transition-all',
                  selected.has(s.id) ? 'ring-primary ring-2' : 'ring-transparent hover:ring-border ring-1',
                )}
              >
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox checked={selected.has(s.id)} className="bg-card size-5" />
                </div>
                <IdCard student={s} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Print sheet — only these render on paper */}
      <PrintSheet students={selectedStudents} />
    </div>
  )
}

/** Only visible when printing. A4 grid of CR80 cards. */
function PrintSheet({ students }: { students: Student[] }) {
  if (students.length === 0) return null
  return (
    <div className="print-sheet hidden print:block">
      <div className="grid grid-cols-2 gap-3">
        {students.map((s) => (
          <IdCard key={s.id} student={s} />
        ))}
      </div>
    </div>
  )
}
