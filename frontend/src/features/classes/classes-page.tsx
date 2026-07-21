import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ClassesPage() {
  return (
    <ScaffoldPage
      title="Classes"
      description="Subject, grade, teacher, schedule, hall and monthly fee for every class."
      covers={["FR-030","FR-031","FR-035","FR-036"]}
    />
  )
}
