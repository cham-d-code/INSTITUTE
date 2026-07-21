import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ArrearsPage() {
  return (
    <ScaffoldPage
      title="Arrears"
      description="Unpaid and partially paid months, filterable by class, teacher, month and amount."
      covers={["FR-075","FR-079","FR-114"]}
    />
  )
}
