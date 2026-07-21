import { ScaffoldPage } from '@/components/common/scaffold-page'

export function StudentDetailPage() {
  return (
    <ScaffoldPage
      title="Student profile"
      description="Guardians, enrollments, attendance history, payment history and outstanding balance for one student."
      covers={["FR-011","FR-015","FR-019","FR-059","FR-075"]}
    />
  )
}
