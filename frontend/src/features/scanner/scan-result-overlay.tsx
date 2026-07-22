import { useEffect } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  QrCode,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ScanResult } from '@/types/domain'
import { formatMoney, formatTime, initials } from '@/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

/**
 * The full-bleed scan result (FR-052, §6.2).
 *
 * Read at arm's length in bright doorway light, so it is loud and unambiguous:
 * a full-colour ground, a big icon, the outcome word, the student's photo and
 * name, and the paid/unpaid state. Colour never stands alone — the icon and
 * the word carry the same meaning for an assistant who can't separate the hues.
 *
 * Auto-dismisses so the assistant can keep scanning a queue without tapping.
 */

interface OutcomeStyle {
  ground: string
  ink: string
  icon: LucideIcon
  title: string
  instruction: string
}

const STYLES: Record<ScanResult['outcome'], OutcomeStyle> = {
  ok: {
    ground: 'bg-status-ok',
    ink: 'text-status-ok-foreground',
    icon: CheckCircle2,
    title: 'Paid — let them in',
    instruction: 'Enrolled and paid for this month.',
  },
  unpaid: {
    ground: 'bg-status-warn',
    ink: 'text-status-warn-foreground',
    icon: AlertTriangle,
    title: 'Fee unpaid',
    instruction: 'Marked present. Send to the payment desk.',
  },
  not_enrolled: {
    ground: 'bg-status-stop',
    ink: 'text-status-stop-foreground',
    icon: XCircle,
    title: 'Not enrolled',
    instruction: 'This student is not in this class.',
  },
  duplicate: {
    ground: 'bg-status-info',
    ink: 'text-status-info-foreground',
    icon: HelpCircle,
    title: 'Already scanned',
    instruction: 'This card was already marked for this session.',
  },
  card_revoked: {
    ground: 'bg-status-stop',
    ink: 'text-status-stop-foreground',
    icon: Ban,
    title: 'Card revoked',
    instruction: 'This card was reissued. Use the new card.',
  },
  unknown_card: {
    ground: 'bg-status-stop',
    ink: 'text-status-stop-foreground',
    icon: QrCode,
    title: 'Card not recognised',
    instruction: 'This QR is not a valid student card.',
  },
}

export function ScanResultOverlay({
  result,
  onDismiss,
  autoDismissMs = 2600,
}: {
  result: ScanResult
  onDismiss: () => void
  autoDismissMs?: number
}) {
  const style = STYLES[result.outcome]
  const Icon = style.icon
  const student = result.student

  useEffect(() => {
    const t = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [onDismiss, autoDismissMs])

  return (
    <button
      type="button"
      onClick={onDismiss}
      className={cn(
        'animate-in fade-in zoom-in-95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 duration-150',
        style.ground,
        style.ink,
      )}
      aria-live="assertive"
    >
      <Icon className="size-24" strokeWidth={2.5} aria-hidden />

      <div className="text-center">
        <p className="text-3xl font-black tracking-tight">{style.title}</p>
        {result.isLate && result.outcome !== 'ok' && (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-lg font-bold">
            <Clock className="size-5" /> Late arrival
          </p>
        )}
      </div>

      {student && (
        <div className="flex flex-col items-center gap-3">
          <Avatar className="size-24 rounded-3xl ring-4 ring-white/30">
            <AvatarImage src={student.photoUrl ?? undefined} alt="" />
            <AvatarFallback className="rounded-3xl bg-white/20 text-2xl font-black">
              {initials(student.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-2xl font-bold">{student.displayName ?? student.fullName}</p>
            <p className="tabular text-sm opacity-80">
              {student.studentCode} · {student.grade}
            </p>
          </div>
        </div>
      )}

      {result.className && <p className="text-lg font-semibold opacity-90">{result.className}</p>}

      {result.outcome === 'ok' && result.isLate && (
        <span className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">
          <Clock className="mr-1 inline size-4" /> Marked late
        </span>
      )}

      {result.feeStatus && !result.feeStatus.isPaid && (
        <span className="rounded-full bg-white/25 px-5 py-2 text-lg font-black">
          Owes {formatMoney(result.feeStatus.outstanding)}
        </span>
      )}

      {result.alreadyMarkedAt && (
        <p className="text-sm font-semibold opacity-90">
          Marked at {formatTime(result.alreadyMarkedAt)}
        </p>
      )}

      <p className="absolute bottom-10 text-center text-sm font-medium opacity-75">
        {style.instruction}
        <br />
        Tap to dismiss
      </p>
    </button>
  )
}
