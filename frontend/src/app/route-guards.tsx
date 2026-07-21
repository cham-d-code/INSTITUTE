import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth/auth-store'
import type { Permission } from '@/lib/auth/permissions'
import { FullPageSpinner } from '@/components/common/full-page-spinner'

/**
 * Route-level gates.
 *
 * As with the permission matrix, these are navigational conveniences. A user
 * who types a URL they lack rights for is redirected here, but the API is what
 * actually refuses the data (NFR-04).
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitialising, user } = useAuth()
  const location = useLocation()

  // Hold rendering until the session probe finishes, otherwise a reload
  // flashes the login screen at an already-signed-in user.
  if (isInitialising) return <FullPageSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // FR-004: a first login (or an admin-forced reset) cannot proceed anywhere
  // else until the password is changed.
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <>{children}</>
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission | Permission[]
  children: ReactNode
}) {
  const { canAny } = useAuth()
  const permissions = Array.isArray(permission) ? permission : [permission]

  if (!canAny(permissions)) {
    return <Navigate to="/not-authorised" replace />
  }

  return <>{children}</>
}

/** Sends a signed-in user to the landing page their role actually uses:
 *  assistants live on the scanner, the owner lives on the dashboard. */
export function RoleLandingRedirect() {
  const { user, isInitialising } = useAuth()

  if (isInitialising) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={user.role === 'assistant' ? '/scanner' : '/dashboard'} replace />
}
