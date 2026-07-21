import { ScaffoldPage } from '@/components/common/scaffold-page'

export function FeeSettingsPage() {
  return (
    <ScaffoldPage
      title="Fees & discounts"
      description="Monthly fees, one-time charges, proration policy, and discount or free-card approvals."
      covers={["FR-070","FR-071","FR-076","FR-081"]}
    />
  )
}
