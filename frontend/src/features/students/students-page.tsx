import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Users } from 'lucide-react'
import { qk, studentApi } from '@/lib/api/endpoints'
import type { Student } from '@/types/domain'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { DataTable } from '@/components/data/data-table'
import { EmptyState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_PRESET = { active: 'active', inactive: 'inactive', left: 'left' } as const

export function StudentsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [grade, setGrade] = useState('all')

  const studentsQuery = useQuery({ queryKey: qk.students, queryFn: studentApi.list })

  const grades = useMemo(
    () => [...new Set((studentsQuery.data ?? []).map((s) => s.grade))].sort(),
    [studentsQuery.data],
  )

  const filtered = useMemo(() => {
    let rows = studentsQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (q)
      rows = rows.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.guardians.some((g) => g.phonePrimary.replace(/\s/g, '').includes(q.replace(/\s/g, ''))),
      )
    if (status !== 'all') rows = rows.filter((s) => s.status === status)
    if (grade !== 'all') rows = rows.filter((s) => s.grade === grade)
    return rows
  }, [studentsQuery.data, search, status, grade])

  const columns = useMemo<ColumnDef<Student, unknown>[]>(
    () => [
      {
        id: 'student',
        header: 'Student',
        accessorFn: (s) => s.fullName,
        cell: ({ row }) => (
          <EntityAvatar
            name={row.original.fullName}
            code={row.original.studentCode}
            photoUrl={row.original.photoUrl}
          />
        ),
      },
      {
        accessorKey: 'grade',
        header: 'Grade',
        cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
      },
      {
        id: 'guardian',
        header: 'Guardian',
        enableSorting: false,
        cell: ({ row }) => {
          const g = row.original.guardians.find((x) => x.isPrimary) ?? row.original.guardians[0]
          return g ? (
            <div className="min-w-0">
              <p className="truncate text-sm">{g.fullName}</p>
              <p className="text-muted-foreground tabular text-xs">{g.phonePrimary}</p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        accessorKey: 'registrationDate',
        header: 'Registered',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <PresetStatusPill preset={STATUS_PRESET[getValue<Student['status']>()]} />,
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Students"
        description="Registered students across all grades and classes."
        actions={
          can('students.create') && (
            <Button className="rounded-2xl" onClick={() => navigate('/students/new')}>
              <Plus className="size-4" /> Register student
            </Button>
          )
        }
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, ID or guardian phone…"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="h-10 w-[130px] rounded-xl">
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-[130px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="left">Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <div className="text-muted-foreground mb-3 text-xs">
        {filtered.length} {filtered.length === 1 ? 'student' : 'students'}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={studentsQuery.isLoading}
        onRowClick={(s) => navigate(`/students/${s.id}`)}
        empty={
          <EmptyState
            icon={Users}
            title="No students match"
            description="Try clearing the filters, or register a new student."
          />
        }
      />
    </div>
  )
}
