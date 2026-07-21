import { ScaffoldPage } from '@/components/common/scaffold-page'

export function UsersPage() {
  return (
    <ScaffoldPage
      title="Users"
      description="Assistant and Super Admin accounts. Deactivating revokes web and app access without deleting history."
      covers={["FR-001","FR-002","FR-004","FR-005","FR-006","MA-006"]}
    />
  )
}
