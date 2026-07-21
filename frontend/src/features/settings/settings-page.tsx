import { ScaffoldPage } from '@/components/common/scaffold-page'

export function SettingsPage() {
  return (
    <ScaffoldPage
      title="Settings"
      description="Institute details, subjects and grades, session timeout, late grace period, absence alert threshold and notification templates."
      covers={["FR-030","FR-003","FR-055","FR-061","FR-100"]}
    />
  )
}
