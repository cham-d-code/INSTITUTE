import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { GraduationCap } from 'lucide-react'
import { qk, refApi, teacherApi } from '@/lib/api/endpoints'
import type { Teacher } from '@/types/domain'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { DataTable } from '@/components/data/data-table'
import { EmptyState } from '@/components/common/states'

type TeacherRow = Teacher & { classCount: number }

export function TeachersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const teachersQuery = useQuery({ queryKey: qk.teachers, queryFn: teacherApi.list })
  const subjectsQuery = useQuery({ queryKey: qk.subjects, queryFn: refApi.subjects })

  const subjectName = (id: string) => subjectsQuery.data?.find((s) => s.id === id)?.name ?? id

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teachersQuery.data ?? []
    return (teachersQuery.data ?? []).filter(
      (t) => t.fullName.toLowerCase().includes(q) || t.teacherCode.toLowerCase().includes(q),
    )
  }, [teachersQuery.data, search])

  const columns = useMemo<ColumnDef<TeacherRow, unknown>[]>(
    () => [
      {
        id: 'teacher',
        header: 'Teacher',
        accessorFn: (t) => t.fullName,
        cell: ({ row }) => (
          <EntityAvatar name={row.original.fullName} code={row.original.teacherCode} photoUrl={row.original.photoUrl} />
        ),
      },
      {
        id: 'subjects',
        header: 'Subjects',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.subjectIds.map((id) => (
              <span key={id} className="bg-secondary rounded-md px-2 py-0.5 text-xs font-medium">
                {subjectName(id)}
              </span>
            ))}
          </div>
        ),
      },
      {
        id: 'grades',
        header: 'Grades',
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.grades.join(', ')}</span>,
      },
      {
        accessorKey: 'classCount',
        header: 'Classes',
        cell: ({ getValue }) => <span className="tabular text-sm">{getValue<number>()}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => <span className="tabular text-muted-foreground text-sm">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => <PresetStatusPill preset={getValue<boolean>() ? 'active' : 'inactive'} />,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subjectsQuery.data],
  )

  return (
    <div>
      <PageHeader title="Teachers" description="Teaching staff, their subjects, and their class load." />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search teacher…" className="sm:max-w-xs" />
      </Toolbar>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={teachersQuery.isLoading}
        onRowClick={(t) => navigate(`/teachers/${t.id}`)}
        empty={<EmptyState icon={GraduationCap} title="No teachers found" />}
      />
    </div>
  )
}
