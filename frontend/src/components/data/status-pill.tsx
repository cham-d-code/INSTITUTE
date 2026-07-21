import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  HelpCircle,
  MinusCircle,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The single vocabulary for operational state across the app.
 *
 * Every pill pairs a colour with an icon and a word. That redundancy is
 * deliberate and non-negotiable: these pills tell an assistant whether to let
 * a student into a class, and roughly one man in twelve cannot reliably tell
 * the green from the amber. Never add a variant that communicates by colour
 * alone.
 */

const pill = cva(
  'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        ok: 'bg-status-ok-soft text-status-ok-soft-foreground',
        warn: 'bg-status-warn-soft text-status-warn-soft-foreground',
        stop: 'bg-status-stop-soft text-status-stop-soft-foreground',
        info: 'bg-status-info-soft text-status-info-soft-foreground',
        void: 'bg-status-void-soft text-status-void-soft-foreground',
        neutral: 'bg-secondary text-secondary-foreground',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[11px]',
        md: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
)

export type StatusTone = NonNullable<VariantProps<typeof pill>['tone']>

interface StatusPillProps extends VariantProps<typeof pill> {
  label: string
  icon?: LucideIcon
  className?: string
}

export function StatusPill({ label, icon: Icon, tone, size, className }: StatusPillProps) {
  return (
    <span className={cn(pill({ tone, size }), className)}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {label}
    </span>
  )
}

/* --- Preset pills for the domain's recurring states ---------------------- */

const PRESETS = {
  paid: { label: 'Paid', tone: 'ok', icon: CheckCircle2 },
  unpaid: { label: 'Unpaid', tone: 'warn', icon: AlertTriangle },
  partial: { label: 'Partial', tone: 'warn', icon: MinusCircle },
  waived: { label: 'Waived', tone: 'info', icon: CheckCircle2 },

  present: { label: 'Present', tone: 'ok', icon: CheckCircle2 },
  late: { label: 'Late', tone: 'warn', icon: Clock },
  absent: { label: 'Absent', tone: 'stop', icon: XCircle },
  guest: { label: 'Guest / trial', tone: 'info', icon: HelpCircle },
  manual: { label: 'Manual', tone: 'info', icon: HelpCircle },

  active: { label: 'Active', tone: 'ok', icon: CheckCircle2 },
  inactive: { label: 'Inactive', tone: 'void', icon: MinusCircle },
  left: { label: 'Left', tone: 'void', icon: Ban },

  voided: { label: 'Void', tone: 'void', icon: Ban },
  pending: { label: 'Pending', tone: 'warn', icon: Clock },
  approved: { label: 'Approved', tone: 'ok', icon: CheckCircle2 },
  rejected: { label: 'Rejected', tone: 'stop', icon: XCircle },

  notEnrolled: { label: 'Not enrolled', tone: 'stop', icon: XCircle },
  cardRevoked: { label: 'Card revoked', tone: 'stop', icon: Ban },
} as const satisfies Record<string, { label: string; tone: StatusTone; icon: LucideIcon }>

export type StatusPreset = keyof typeof PRESETS

export function PresetStatusPill({
  preset,
  size,
  labelOverride,
  className,
}: {
  preset: StatusPreset
  size?: VariantProps<typeof pill>['size']
  /** For adding detail, e.g. "Unpaid · Rs 2,500". */
  labelOverride?: string
  className?: string
}) {
  const config = PRESETS[preset]
  return (
    <StatusPill
      label={labelOverride ?? config.label}
      icon={config.icon}
      tone={config.tone}
      size={size}
      className={className}
    />
  )
}
