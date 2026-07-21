import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLocalStorage } from '@/hooks/use-local-storage'

/**
 * Desktop/tablet layout for the administration portal: a floating black rail
 * on a soft grey page, content in white cards.
 *
 * The scanner deliberately does NOT live inside this shell — at the classroom
 * door the camera needs the full viewport and no chrome. See `scanner-shell`.
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorage('tims.sidebarCollapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto flex max-w-[1600px] gap-4 p-3 lg:p-4">
        {/* Rail — hidden below lg, where it becomes a sheet. */}
        <div className="sticky top-4 hidden h-[calc(100svh-2rem)] shrink-0 lg:block">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsed)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-none bg-transparent p-2">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Sidebar
                  collapsed={false}
                  onToggleCollapsed={() => {}}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Topbar />
          </div>

          <main className="pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
