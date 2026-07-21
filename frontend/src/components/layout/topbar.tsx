import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-store'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import { initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

/**
 * Slim header: global search, alerts, identity.
 *
 * The signed-in name is always visible rather than tucked behind an avatar
 * menu. Shared logins are forbidden (§2), and a permanently visible name is
 * the cheapest way to make an assistant notice they are on a colleague's
 * session before they record a payment under it.
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
        <Button
          variant="outline"
          size="icon"
          className="relative size-11 rounded-2xl"
          aria-label="Alerts"
        >
          <Bell className="size-5" />
        </Button>

        {user && (
          <div className="bg-card border-border flex items-center gap-3 rounded-2xl border py-1.5 pr-4 pl-1.5">
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
          </div>
        )}
      </div>
    </header>
  )
}
