import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { BadgeDollarSign, FileDown, FileSpreadsheet } from 'lucide-react'
import type { Due } from '@/types/domain'
import { classApi, feeApi, qk } from '@/lib/api/endpoints'
import { formatBillingMonth, formatMoney } from '@/lib/format'
import { exportToCsv, exportToPdf } from '@/lib/export/export'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { StatTile } from '@/components/data/stat-tile'
import { DataTable } from '@/components/data/data-table'
import { EmptyState } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ArrearsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('all')
  const [month, setMonth] = useState('all')

  const arrearsQuery = useQuery({ queryKey: qk.arrears, queryFn: feeApi.arrears })
  const classesQuery = useQuery({ queryKey: qk.classes, queryFn: classApi.list })

  const months = useMemo(
    () => [...new Set((arrearsQuery.data ?? []).map((d) => d.month))].sort().reverse(),
    [arrearsQuery.data],
  )

  const filtered = useMemo(() => {
    let rows = arrearsQuery.data ?? []
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((d) => d.studentName.toLowerCase().includes(q) || d.studentCode.toLowerCase().includes(q))
    if (classId !== 'all') rows = rows.filter((d) => d.classId === classId)
    if (month !== 'all') rows = rows.filter((d) => d.month === month)
    return rows
  }, [arrearsQuery.data, search, classId, month])

  const total = filtered.reduce((s, d) => s + d.outstanding, 0)
  const studentsAffected = new Set(filtered.map((d) => d.studentId)).size

  function exportRows() {
    return filtered.map((d) => [
      d.studentCode,
      d.studentName,
      d.className,
      formatBillingMonth(d.month),
      (d.netAmount / 100).toFixed(2),
      (d.paidAmount / 100).toFixed(2),
      (d.outstanding / 100).toFixed(2),
      d.status,
    ])
  }
  const headers = ['Student ID', 'Name', 'Class', 'Month', 'Net', 'Paid', 'Outstanding', 'Status']

  const columns = useMemo<ColumnDef<Due, unknown>[]>(
    () => [
      {
        id: 'student',
        header: 'Student',
        accessorFn: (d) => d.studentName,
        cell: ({ row }) => <EntityAvatar name={row.original.studentName} code={row.original.studentCode} size="sm" />,
      },
      { accessorKey: 'className', header: 'Class', cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span> },
      {
        accessorKey: 'month',
        header: 'Month',
        cell: ({ getValue }) => <span className="text-sm">{formatBillingMonth(getValue<string>())}</span>,
      },
      {
        accessorKey: 'outstanding',
        header: 'Outstanding',
        cell: ({ getValue }) => <span className="tabular text-sm font-semibold">{formatMoney(getValue<number>())}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <PresetStatusPill preset={row.original.status === 'partial' ? 'partial' : 'unpaid'} />
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Arrears"
        description="Students with unpaid or partially paid months."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-2xl" disabled={filtered.length === 0}>
                <FileDown className="size-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToCsv('arrears.csv', headers, exportRows())}>
                <FileSpreadsheet className="size-4" /> Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportToPdf('Arrears', headers, exportRows(), `${studentsAffected} students · ${formatMoney(total)} outstanding`)}
              >
                <FileDown className="size-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total outstanding" value={formatMoney(total)} icon={BadgeDollarSign} invertChangeColour />
        <StatTile label="Students affected" value={String(studentsAffected)} />
        <StatTile label="Overdue lines" value={String(filtered.length)} />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search student…" className="sm:max-w-xs" />
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {(classesQuery.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.grade} {c.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-10 w-[150px] rounded-xl">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatBillingMonth(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={arrearsQuery.isLoading}
        onRowClick={(d) => navigate(`/students/${d.studentId}`)}
        empty={<EmptyState icon={BadgeDollarSign} title="No arrears" description="Everyone is paid up for this filter." />}
      />
    </div>
  )
}
