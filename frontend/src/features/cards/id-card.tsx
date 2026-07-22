import { useQuery } from '@tanstack/react-query'
import type { Student } from '@/types/domain'
import { cardApi, qk, refApi } from '@/lib/api/endpoints'
import { initials } from '@/lib/format'
import { QrCode } from '@/components/data/qr-code'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * A single CR80-proportion student ID card (FR-040).
 *
 * The QR encodes only the opaque server token (FR-041) — never the name or ID —
 * so a photographed card leaks nothing. The visible human details are for the
 * assistant reading the physical card, not for the scanner.
 */
export function IdCard({ student, className }: { student: Student; className?: string }) {
  const instituteQuery = useQuery({ queryKey: qk.institute, queryFn: refApi.institute })
  const tokenQuery = useQuery({ queryKey: qk.card(student.id), queryFn: () => cardApi.activeToken(student.id) })

  return (
    <div
      className={cn(
        // CR80 is 85.6 × 54 mm ≈ 1.585 aspect ratio.
        'id-card bg-card text-card-foreground border-border flex aspect-[1.585] w-full overflow-hidden rounded-xl border shadow-sm',
        className,
      )}
    >
      <div className="bg-sidebar text-sidebar-foreground flex w-[38%] flex-col justify-between p-3">
        <div className="flex items-center gap-1.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-black">
            T
          </div>
          <p className="truncate text-[10px] font-bold leading-tight">
            {instituteQuery.data?.name ?? 'Institute'}
          </p>
        </div>
        <Avatar className="size-14 rounded-lg">
          <AvatarImage src={student.photoUrl ?? undefined} alt="" />
          <AvatarFallback className="rounded-lg bg-white/15 text-lg font-black">
            {initials(student.fullName)}
          </AvatarFallback>
        </Avatar>
        <p className="text-[8px] opacity-60 leading-tight">Student ID Card · {student.academicYear}</p>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black leading-tight">{student.fullName}</p>
          <p className="text-muted-foreground tabular text-[10px] font-semibold">{student.studentCode}</p>
          <p className="text-muted-foreground text-[10px]">{student.grade}</p>
        </div>
        <div className="flex justify-end">
          {tokenQuery.isLoading ? (
            <Skeleton className="size-16 rounded-lg" />
          ) : tokenQuery.data ? (
            <QrCode value={tokenQuery.data.token} size={72} />
          ) : (
            <div className="text-muted-foreground grid size-16 place-items-center text-[9px]">No token</div>
          )}
        </div>
      </div>
    </div>
  )
}
