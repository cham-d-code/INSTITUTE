import { ScaffoldPage } from '@/components/common/scaffold-page'

export function CardsPage() {
  return (
    <ScaffoldPage
      title="ID cards"
      description="Generate, batch-print and reissue QR student cards. Reissuing revokes the previous token immediately."
      covers={["FR-040","FR-041","FR-042","FR-043","FR-044"]}
    />
  )
}
