import { ScaffoldPage } from '@/components/common/scaffold-page'

export function CollectionPage() {
  return (
    <ScaffoldPage
      title="Daily collection"
      description="Cash-in-hand reconciliation per assistant, to compare against the money handed over at day end."
      covers={["FR-078"]}
    />
  )
}
