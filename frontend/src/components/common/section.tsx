import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** A titled white card — the standard container for a block of content. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('card-surface', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold tracking-tight">{title}</h2>}
            {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

/** Read-only label/value pair for detail pages. */
export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

export function DetailGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3', className)}>{children}</dl>
}

/** Back link for detail pages. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm font-medium"
    >
      <ChevronLeft className="size-4" /> {children}
    </Link>
  )
}

/** Toolbar row above a list: search on the left, filters/actions on the right. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-center', className)}>{children}</div>
  )
}
