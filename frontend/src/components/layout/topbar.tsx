import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, ChevronDown, Search, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { authApi, qk, userApi } from '@/lib/api/endpoints'
import { useAuth, useAuthStore } from '@/lib/auth/auth-store'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import { initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Slim header: global search, alerts, identity.
 *
 * The signed-in name is always visible rather than tucked behind a menu.
 * Shared logins are forbidden (§2), and a permanently visible name is the
 * cheapest way to make an assistant notice they are on a colleague's session
 * before they record a payment under it.
 */
export function Topbar() {
  const { user } = useAuth()

  return (
    <header className="flex flex-1 items-center gap-2">
      <Button
        variant="outline"
        className="text-muted-foreground h-11 flex-1 justify-start gap-2 rounded-2xl px-4 font-normal sm:max-w-sm"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search students, receipts, classes…</span>
        <kbd className="bg-muted text-muted-foreground ml-auto hidden rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          Ctrl K
        </kbd>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="icon" className="relative size-11 rounded-2xl" aria-label="Alerts">
          <Bell className="size-5" />
        </Button>

        {user && <IdentityMenu />}
      </div>
    </header>
  )
}

/**
 * Identity chip. In this mock build it doubles as a demo role switcher so a
 * reviewer can see the assistant-limited views without a second account —
 * switching re-runs the whole app under that user's permissions. This whole
 * "View as" section disappears with the mock; a real build shows only the
 * signed-in user here.
 */
function IdentityMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const usersQuery = useQuery({ queryKey: qk.users, queryFn: userApi.list })

  if (!user) return null

  async function viewAs(userId: string) {
    try {
      const next = await authApi.loginAs(userId)
      setUser(next)
      queryClient.clear()
      toast.success(`Now viewing as ${next.fullName} (${ROLE_LABELS[next.role]}).`)
      navigate(next.role === 'assistant' ? '/scanner' : '/dashboard')
    } catch {
      toast.error('Could not switch user.')
    }
  }

  const activeUsers = (usersQuery.data ?? []).filter((u) => u.isActive)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="bg-card border-border hover:bg-secondary/50 flex items-center gap-3 rounded-2xl border py-1.5 pr-3 pl-1.5 transition-colors">
          <Avatar className="size-8 rounded-xl">
            <AvatarImage src={user.photoUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-primary text-primary-foreground rounded-xl text-xs font-bold">
              {initials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="text-muted-foreground truncate text-xs">{ROLE_LABELS[user.role]}</p>
          </div>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <UserCog className="size-3.5" /> View as (demo)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeUsers.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => viewAs(u.id)}
            className="flex items-center justify-between gap-2"
            disabled={u.id === user.id}
          >
            <span className="truncate">{u.fullName}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{ROLE_LABELS[u.role]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
