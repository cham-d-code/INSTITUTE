import { ScaffoldPage } from '@/components/common/scaffold-page'

export function TeachersPage() {
  return (
    <ScaffoldPage
      title="Teachers"
      description="Teaching staff, the subjects and grades they cover, and their class load."
      covers={["FR-020","FR-021","FR-022"]}
    />
  )
}
