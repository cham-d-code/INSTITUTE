import { ScaffoldPage } from '@/components/common/scaffold-page'

export function PaymentsPage() {
  return (
    <ScaffoldPage
      title="Payments"
      description="Recorded payments with receipt number, method, billing month and the assistant who collected them."
      covers={["FR-072","FR-073","FR-074","FR-077","FR-092"]}
    />
  )
}
