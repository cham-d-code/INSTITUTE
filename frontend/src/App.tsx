import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { useAuthStore } from '@/lib/auth/auth-store'
import { setUnauthenticatedHandler } from '@/lib/api/client'

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialising = useAuthStore((s) => s.setInitialising)

  useEffect(() => {
    // When the API reports the session is gone — idle timeout (FR-003) or the
    // account was deactivated (FR-005) — drop the user and let the route
    // guards bounce to /login.
    setUnauthenticatedHandler(() => {
      setUser(null)
      setInitialising(false)
    })

    // ---------------------------------------------------------------------
    // SCAFFOLD ONLY. Replace with a probe of GET /api/auth/me, which restores
    // the session from the refresh cookie on reload.
    //
    // This stub signs everyone in as a Super Admin so the shell is reviewable
    // before the backend exists. It MUST be deleted before any deployment —
    // it is an authentication bypass, not a convenience.
    // ---------------------------------------------------------------------
    setUser({
      id: 'dev-user',
      fullName: 'Institute Owner',
      username: 'owner',
      email: null,
      phone: null,
      photoUrl: null,
      role: 'super_admin',
      isActive: true,
      mustChangePassword: false,
      twoFactorEnabled: false,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    })
    setInitialising(false)

    return () => setUnauthenticatedHandler(null)
  }, [setUser, setInitialising])

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
