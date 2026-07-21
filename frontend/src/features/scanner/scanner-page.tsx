import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ScannerPage() {
  return (
    <ScaffoldPage
      title="Scan attendance"
      description="Camera scanner for the classroom door: session selector, scan result with paid/unpaid, duplicate and enrolment checks, offline queue."
      covers={[
        'FR-050',
        'FR-051',
        'FR-052',
        'FR-053',
        'FR-054',
        'FR-055',
        'FR-058',
        'FR-080',
        'MA-002',
        'MA-003',
        'MA-004',
      ]}
    />
  )
}
