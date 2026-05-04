import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { STATUS_DOT } from './constants'
import type { MemberStatusKind } from '@/lib/types'

export interface MemberAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  status?: MemberStatusKind
  size?: 'sm' | 'md'
  showDot?: boolean
}

export function MemberAvatar({ name, avatarUrl, status, size = 'md', showDot = false }: MemberAvatarProps) {
  const initials = (name ?? '??').slice(0, 2).toUpperCase()
  const sizeClass = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'

  return (
    <div className="relative shrink-0">
      <Avatar className={sizeClass}>
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
      </Avatar>
      {showDot && status && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
            size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            STATUS_DOT[status]
          )}
        />
      )}
    </div>
  )
}
