import { ScaffoldPage } from '@/components/common/scaffold-page'

export function SessionDetailPage() {
  return (
    <ScaffoldPage
      title="Session"
      description="Who was scanned, who was marked manually and why, who was absent, and who marked each record."
      covers={["FR-053","FR-055","FR-056","FR-057","FR-060"]}
    />
  )
}
