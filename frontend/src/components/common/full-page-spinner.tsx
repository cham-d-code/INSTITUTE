import { Loader2 } from 'lucide-react'

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="bg-background grid min-h-svh place-items-center" role="status" aria-live="polite">
      <div className="text-muted-foreground flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">{label}…</span>
      </div>
    </div>
  )
}
