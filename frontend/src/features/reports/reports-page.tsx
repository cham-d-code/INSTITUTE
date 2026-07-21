import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ReportsPage() {
  return (
    <ScaffoldPage
      title="Reports"
      description="Attendance, financial and enrollment reporting, exportable to Excel and PDF."
      covers={["FR-111","FR-112","FR-113","FR-114","FR-115","FR-082"]}
    />
  )
}
