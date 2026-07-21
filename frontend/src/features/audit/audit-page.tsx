import { ScaffoldPage } from '@/components/common/scaffold-page'

export function AuditPage() {
  return (
    <ScaffoldPage
      title="Audit log"
      description="Append-only record of who did what, when, and from which device. Filterable by user, date, action and record."
      covers={["FR-090","FR-091","FR-093","NFR-10"]}
    />
  )
}
