import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Name + optional code with an avatar — the recurring "who is this" cell in
 *  every list (students, teachers, payments). */
export function EntityAvatar({
  name,
  code,
  photoUrl,
  size = 'md',
  muted,
  className,
}: {
  name: string
  code?: string | null
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  muted?: boolean
  className?: string
}) {
  const dim = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9'
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <Avatar className={cn(dim, 'shrink-0 rounded-xl')}>
        <AvatarImage src={photoUrl ?? undefined} alt="" />
        <AvatarFallback
          className={cn(
            'rounded-xl text-xs font-bold',
            muted ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground',
          )}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {code && <p className="text-muted-foreground tabular truncate text-xs">{code}</p>}
      </div>
    </div>
  )
}
