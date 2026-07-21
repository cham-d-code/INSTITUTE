import { create } from 'zustand'
import type { User } from '@/types/domain'
import { roleHas, roleHasAny, type Permission } from './permissions'

interface AuthState {
  user: User | null
  /** True until the initial session probe resolves, so the router can hold
   *  rendering instead of flashing the login screen at a signed-in user. */
  isInitialising: boolean
  setUser: (user: User | null) => void
  setInitialising: (value: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialising: true,
  setUser: (user) => set({ user }),
  setInitialising: (isInitialising) => set({ isInitialising }),
  clear: () => set({ user: null }),
}))

/**
 * Permission helpers bound to the signed-in user.
 *
 * Reminder: hiding a control here is a courtesy, not a defence. The server
 * re-checks every one of these (NFR-04).
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const isInitialising = useAuthStore((s) => s.isInitialising)

  return {
    user,
    isInitialising,
    isAuthenticated: user !== null,
    isSuperAdmin: user?.role === 'super_admin',
    can: (permission: Permission) => (user ? roleHas(user.role, permission) : false),
    canAny: (permissions: Permission[]) => (user ? roleHasAny(user.role, permissions) : false),
  }
}
