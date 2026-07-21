import { ScaffoldPage } from '@/components/common/scaffold-page'

export function AttendancePage() {
  return (
    <ScaffoldPage
      title="Attendance"
      description="Per-session, per-class and per-student views with present, late and absent breakdowns."
      covers={["FR-059","FR-060","FR-061","FR-092"]}
    />
  )
}
