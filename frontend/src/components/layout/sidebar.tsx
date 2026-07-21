import { NavLink } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_SECTIONS, type NavItem } from '@/app/navigation'
import { useAuth } from '@/lib/auth/auth-store'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapsed: () => void
  badges?: Partial<Record<NonNullable<NavItem['badgeKey']>, number>>
  onNavigate?: () => void
  onSignOut?: () => void
}

/**
 * The floating black rail. Collapses to icons for the dense screens (roster,
 * arrears, audit log) where horizontal space is worth more than labels.
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  badges,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  const { canAny, user } = useAuth()

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAny(item.requires)),
  })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground flex h-full flex-col rounded-3xl transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-[248px]',
      )}
    >
      {/* Wordmark */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 pt-6 pb-5',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="bg-sidebar-primary text-sidebar-primary-foreground grid size-9 shrink-0 place-items-center rounded-xl text-lg font-black">
          T
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">TIMS</p>
            <p className="text-sidebar-foreground/50 truncate text-xs">Institute manager</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        {sections.map((section, index) => (
          <div key={section.title ?? `group-${index}`} className="mb-1">
            {section.title && !collapsed && (
              <p className="text-sidebar-foreground/40 px-3 pt-4 pb-2 text-[11px] font-medium tracking-wide uppercase">
                {section.title}
              </p>
            )}
            {section.title && collapsed && (
              <div className="bg-sidebar-border mx-auto my-3 h-px w-8" />
            )}

            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink
                    item={item}
                    collapsed={collapsed}
                    badge={item.badgeKey ? badges?.[item.badgeKey] : undefined}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border space-y-1 border-t p-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className={cn(
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && user && (
          <p className="text-sidebar-foreground/40 truncate px-3 pt-1 text-xs">
            Signed in as {user.fullName}
          </p>
        )}
      </div>
    </aside>
  )
}

function SidebarLink({
  item,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  badge?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )
      }
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            'bg-status-warn text-status-warn-foreground grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold tabular',
            collapsed && 'absolute top-1 right-1 h-4 min-w-4 px-1',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )

  // Collapsed icons are meaningless without a name — never rely on the glyph
  // alone to communicate the destination.
  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
        {badge != null && badge > 0 && ` · ${badge} pending`}
      </TooltipContent>
    </Tooltip>
  )
}
