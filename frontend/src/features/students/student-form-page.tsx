import { ScaffoldPage } from '@/components/common/scaffold-page'

export function StudentFormPage() {
  return (
    <ScaffoldPage
      title="Register student"
      description="Student and guardian details with class selection, creating enrollments in a single step."
      covers={["FR-010","FR-011","FR-012","FR-013","FR-014"]}
    />
  )
}
