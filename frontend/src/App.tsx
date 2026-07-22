import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { useAuthStore } from '@/lib/auth/auth-store'
import { setUnauthenticatedHandler } from '@/lib/api/client'
import { authApi } from '@/lib/api/endpoints'

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setInitialising = useAuthStore((s) => s.setInitialising)

  useEffect(() => {
    // When the session dies — idle timeout (FR-003) or the account was
    // deactivated (FR-005) — drop the user and let the guards bounce to /login.
    setUnauthenticatedHandler(() => {
      setUser(null)
      setInitialising(false)
    })

    // Restore the session on load. This goes through the same API seam as
    // everything else (`authApi.me`), so when the real backend arrives it
    // becomes a genuine `GET /api/auth/me` against the refresh cookie with no
    // change here.
    //
    // NOTE: the mock currently starts with a signed-in demo owner so the app
    // is reviewable without a login round-trip. That convenience lives in the
    // mock (`sessionUserId` in lib/mock/api.ts) and disappears the moment the
    // mock is swapped out — this component already handles a null user by
    // routing to /login.
    let cancelled = false
    authApi
      .me()
      .then((user) => {
        if (!cancelled) setUser(user)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setInitialising(false)
      })

    return () => {
      cancelled = true
      setUnauthenticatedHandler(null)
    }
  }, [setUser, setInitialising])

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
