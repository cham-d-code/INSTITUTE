import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /**
   * When set, the dialog collects a mandatory reason before confirming — used
   * for voids, reissues and status changes that the audit trail must explain
   * (FR-043, FR-056, FR-077). The reason is passed to onConfirm.
   */
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  onConfirm: (reason: string) => Promise<void> | void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'This is recorded in the audit log.',
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const canConfirm = !requireReason || reason.trim().length >= 3

  async function handleConfirm() {
    if (!canConfirm) return
    setBusy(true)
    try {
      await onConfirm(reason.trim())
      setReason('')
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground text-sm">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireReason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">
              {reasonLabel} <span className="text-status-stop-soft-foreground">*</span>
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="rounded-xl"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="rounded-xl">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleConfirm()
            }}
            disabled={!canConfirm || busy}
            className={cn(
              'rounded-xl',
              destructive && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
