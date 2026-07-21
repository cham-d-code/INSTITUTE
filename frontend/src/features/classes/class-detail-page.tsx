import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ClassDetailPage() {
  return (
    <ScaffoldPage
      title="Class roster"
      description="Enrolled students with each one’s payment status for this class, plus session history."
      covers={["FR-032","FR-033","FR-034"]}
    />
  )
}
