import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="bg-secondary text-muted-foreground grid size-12 place-items-center rounded-2xl">
        <Icon className="size-6" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      {description && <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="bg-status-stop-soft text-status-stop-soft-foreground grid size-12 place-items-center rounded-2xl">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-semibold">Couldn't load this</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{apiErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5 rounded-xl" onClick={onRetry}>
          <RefreshCw className="size-4" /> Try again
        </Button>
      )}
    </div>
  )
}

/**
 * Standard loading / error / empty handling for a query-backed section, so
 * every screen behaves the same way instead of each reinventing it.
 */
export function QueryBoundary<T>({
  query,
  children,
  loading,
  empty,
  isEmpty,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; data: T | undefined; refetch: () => void }
  children: (data: T) => ReactNode
  loading?: ReactNode
  empty?: ReactNode
  isEmpty?: (data: T) => boolean
}) {
  if (query.isLoading) return <>{loading ?? <DefaultLoading />}</>
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />
  if (query.data === undefined) return <ErrorState error={new Error('No data')} onRetry={query.refetch} />
  if (empty && isEmpty && isEmpty(query.data)) return <>{empty}</>
  return <>{children(query.data)}</>
}

function DefaultLoading() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-14 text-sm">
      <RefreshCw className="size-4 animate-spin" /> Loading…
    </div>
  )
}
