import { ScaffoldPage } from '@/components/common/scaffold-page'

export function StudentsPage() {
  return (
    <ScaffoldPage
      title="Students"
      description="Every registered student, searchable by name, ID, grade, class, teacher, status and payment standing."
      covers={["FR-010","FR-014","FR-016","FR-017","FR-018"]}
    />
  )
}
