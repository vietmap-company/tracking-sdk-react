import * as React from 'react'
import { Search } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useFleetwork } from '@/provider/FleetworkProvider'
import type { MemberStatus } from '@/lib/types'

export interface MemberListProps {
  members: MemberStatus[]
  isLoading: boolean
  activeUserId?: string | null
  onItemClick?: (member: MemberStatus) => void
  renderItem?: (
    member: MemberStatus,
    defaultRender: React.ReactNode
  ) => React.ReactNode
  position?: 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function MemberList({
  members,
  isLoading,
  activeUserId,
  onItemClick,
  renderItem,
  position = 'right',
  className,
  style,
}: MemberListProps) {
  const { t } = useFleetwork()
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => m.name.toLowerCase().includes(q))
  }, [members, query])

  return (
    <div
      className={cn(
        'absolute top-3 bottom-3 z-10 flex w-72 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg',
        position === 'left' ? 'left-3' : 'right-3',
        className
      )}
      style={style}
    >
      <div className='border-b border-slate-100 px-3 py-2'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search'
            className='w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2 pl-7 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none'
          />
        </div>
        <div className='mt-1 text-[11px] text-slate-500'>
          {filtered.length} / {members.length}
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='space-y-2 p-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className='p-4 text-center text-xs text-slate-400'>
            {t('common.noData')}
          </div>
        ) : (
          <ul className='divide-y divide-slate-100'>
            {filtered.map((m) => {
              const defaultItem = (
                <div className='flex items-center gap-3 px-3 py-2'>
                  <Avatar
                    src={m.avatarUrl ?? undefined}
                    alt={m.name}
                    fallback={m.name}
                    size={32}
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-slate-800'>
                      {m.name}
                    </div>
                    <div className='truncate text-[11px] text-slate-500'>
                      {m.lastAddress ?? '—'}
                    </div>
                  </div>
                  <Badge variant={m.status}>{m.statusLabel}</Badge>
                </div>
              )
              const content = renderItem ? renderItem(m, defaultItem) : defaultItem
              return (
                <li
                  key={m.userId}
                  onClick={() => onItemClick?.(m)}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-slate-50',
                    activeUserId === m.userId && 'bg-blue-50'
                  )}
                >
                  {content}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
