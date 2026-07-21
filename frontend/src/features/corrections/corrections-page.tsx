import { ScaffoldPage } from '@/components/common/scaffold-page'

export function CorrectionsPage() {
  return (
    <ScaffoldPage
      title="Corrections"
      description="Correction requests raised by assistants, and the Super Admin review that voids and re-enters the original record."
      covers={["FR-057","FR-077","FR-110"]}
    />
  )
}
