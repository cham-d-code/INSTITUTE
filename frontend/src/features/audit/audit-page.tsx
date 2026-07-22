import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { ScrollText } from 'lucide-react'
import type { AuditAction, AuditLogEntry } from '@/types/domain'
import { auditApi, qk } from '@/lib/api/endpoints'
import { formatDateTime } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { Toolbar } from '@/components/common/section'
import { SearchInput } from '@/components/data/search-input'
import { DataTable } from '@/components/data/data-table'
import { EmptyState } from '@/components/common/states'
import { StatusPill, type StatusTone } from '@/components/data/status-pill'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

/** Colour by broad action category — informational, always paired with the
 *  action word so it never signals by colour alone. */
const ACTION_TONE: Partial<Record<AuditAction, StatusTone>> = {
  create: 'ok',
  update: 'info',
  payment: 'ok',
  scan: 'info',
  void: 'stop',
  reject: 'stop',
  deactivate: 'stop',
  approve: 'ok',
  reactivate: 'ok',
  card_reissue: 'warn',
  login: 'neutral',
  login_failed: 'stop',
}

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')
  const query = useQuery({ queryKey: qk.audit, queryFn: auditApi.list })

  const actions = useMemo(
    () => [...new Set((query.data ?? []).map((a) => a.action))].sort(),
    [query.data],
  )

  const filtered = useMemo(() => {
    let rows = query.data ?? []
    const q = search.trim().toLowerCase()
    if (q)
      rows = rows.filter(
        (a) =>
          a.actorName.toLowerCase().includes(q) ||
          a.entityType.toLowerCase().includes(q) ||
          (a.entityLabel?.toLowerCase().includes(q) ?? false),
      )
    if (action !== 'all') rows = rows.filter((a) => a.action === action)
    return rows
  }, [query.data, search, action])

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'occurredAt',
        header: 'When',
        cell: ({ getValue }) => <span className="tabular text-muted-foreground text-xs">{formatDateTime(getValue<string>())}</span>,
      },
      {
        id: 'actor',
        header: 'User',
        accessorFn: (a) => a.actorName,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.original.actorName}</p>
            <p className="text-muted-foreground text-xs capitalize">{row.original.actorRole.replace('_', ' ')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ getValue }) => {
          const a = getValue<AuditAction>()
          return <StatusPill label={a.replace('_', ' ')} tone={ACTION_TONE[a] ?? 'neutral'} size="sm" />
        },
      },
      {
        id: 'entity',
        header: 'Record',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.entityType}</p>
            {row.original.entityLabel && (
              <p className="text-muted-foreground tabular truncate text-xs">{row.original.entityLabel}</p>
            )}
          </div>
        ),
      },
      {
        id: 'device',
        header: 'Device',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular text-xs">
            {row.original.ipAddress}
            {row.original.userAgent && ` · ${row.original.userAgent}`}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every create, update, void, approval, login, scan and payment — who, what, when, and from which device."
      />

      <Alert className="mb-4 rounded-2xl">
        <ScrollText className="size-4" />
        <AlertDescription>
          This log is append-only. Records here cannot be edited or deleted by anyone, including a Super
          Admin — that immutability is enforced at the database level.
        </AlertDescription>
      </Alert>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search user, record…" className="sm:max-w-xs" />
        <div className="sm:ml-auto">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-10 w-[170px] rounded-xl">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a} className="capitalize">
                  {a.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={query.isLoading}
        empty={<EmptyState icon={ScrollText} title="No matching entries" />}
      />
    </div>
  )
}
