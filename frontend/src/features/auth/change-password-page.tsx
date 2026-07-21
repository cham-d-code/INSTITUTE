import { ScaffoldPage } from '@/components/common/scaffold-page'

export function ChangePasswordPage() {
  return (
    <ScaffoldPage
      title="Change your password"
      description="Required on first sign-in and after an owner-initiated reset, before any other screen is reachable."
      covers={['FR-004']}
    />
  )
}
