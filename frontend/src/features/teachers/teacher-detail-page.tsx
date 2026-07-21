import { ScaffoldPage } from '@/components/common/scaffold-page'

export function TeacherDetailPage() {
  return (
    <ScaffoldPage
      title="Teacher profile"
      description="Timetable, assigned classes, payment arrangement and scheduling conflict warnings."
      covers={["FR-022","FR-023","FR-024"]}
    />
  )
}
