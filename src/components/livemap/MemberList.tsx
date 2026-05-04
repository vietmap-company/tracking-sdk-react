import * as React from 'react'
import { PanelLeftClose, PanelLeftOpen, Search, SignalZero, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useMembers, type UseMembersOptions } from '@/hooks'
import type { MemberStatus, MemberStatusKind } from '@/lib/types'

const PAGE_SIZE = 50

const STATUS_DOT: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]',
  stopped:     'bg-amber-400  shadow-[0_0_0_2px_rgba(251,191,36,0.2)]',
  signal_lost: 'bg-slate-400',
}

const STATUS_BADGE: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  stopped:     'bg-amber-50  text-amber-700  border-amber-200',
  signal_lost: 'bg-slate-50  text-slate-500  border-slate-200',
}

function formatLastSeen(ts?: number): string {
  if (!ts) return ''
  const mins = Math.floor((Date.now() - ts) / 60_000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins}p`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}g`
  return `${Math.floor(hrs / 24)}n`
}

export interface MemberListProps extends UseMembersOptions {
  members?: MemberStatus[]
  isLoading?: boolean
  activeUserId?: string | null
  onItemClick?: (member: MemberStatus) => void
  renderItem?: (member: MemberStatus, defaultRender: React.ReactNode) => React.ReactNode
  position?: 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

export function MemberList({
  members: membersProp,
  isLoading: loadingProp,
  activeUserId,
  onItemClick,
  renderItem,
  position = 'left',
  className,
  style,
  ...fetchOptions
}: MemberListProps) {
  const { t } = useFleetwork()
  const { data: apiMembers = [], isLoading: apiLoading } = useMembers(
    membersProp ? { ...fetchOptions, enabled: false } : fetchOptions
  )
  const members = membersProp ?? apiMembers
  const isLoading = loadingProp ?? (membersProp ? false : apiLoading)

  const [query, setQuery] = React.useState('')
  const [collapsed, setCollapsed] = React.useState(false)
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  const filtered = React.useMemo(() => {
    const ORDER: Record<string, number> = { moving: 0, stopped: 1, signal_lost: 2 }
    const q = query.trim().toLowerCase()
    const base = q ? members.filter((m) => (m.name ?? m.userId).toLowerCase().includes(q)) : members
    return [...base].sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3))
  }, [members, query])

  React.useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query])

  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount(c => Math.min(c + PAGE_SIZE, filtered.length)) },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [filtered.length])

  const visible = filtered.slice(0, visibleCount)

  /* ── Collapsed pill ────────────────────────────────────────────────── */
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className={cn(
          'absolute top-3 z-10 flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3 py-2 text-[12px] font-semibold text-foreground shadow-md backdrop-blur-sm hover:bg-card transition-colors',
          position === 'left' ? 'left-3' : 'right-3',
          className
        )}
        style={style}
      >
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{members.length}</span>
        <PanelLeftOpen className={cn('h-3 w-3 text-muted-foreground', position === 'right' && 'rotate-180')} />
      </button>
    )
  }

  /* ── Full panel ────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'absolute top-3 z-10 flex flex-col overflow-hidden bg-card/95 backdrop-blur-md',
        'rounded-2xl border border-border/60 shadow-lg',
        'max-h-[calc(100%-24px)] w-[268px]',
        position === 'left' ? 'left-3' : 'right-3',
        className
      )}
      style={style}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">{t('list.title')}</span>
            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
              {members.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <PanelLeftClose className={cn('h-3.5 w-3.5', position === 'right' && 'rotate-180')} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('list.search')}
            className={cn(
              'h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3',
              'text-[12px] text-foreground placeholder:text-muted-foreground',
              'outline-none focus:ring-1 focus:ring-ring transition-shadow'
            )}
          />
        </div>
      </div>

      <Separator />

      {/* ── Body ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-3 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-2 w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <SignalZero className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <span className="text-[12px] text-muted-foreground">{t('common.noData')}</span>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {visible.map((m) => {
            const isActive = activeUserId === m.userId
            const initials = (m.name ?? m.userId).slice(0, 2).toUpperCase()

            const defaultItem = (
              <div className={cn(
                'group relative flex items-center gap-3 px-3.5 py-2.5 transition-colors',
                isActive
                  ? 'bg-primary/8 border-l-2 border-l-primary'
                  : 'hover:bg-muted/50 border-l-2 border-l-transparent'
              )}>
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    'text-[11px] font-bold text-white',
                    m.status === 'moving' ? 'bg-emerald-500'
                      : m.status === 'stopped' ? 'bg-amber-400'
                      : 'bg-slate-400'
                  )}>
                    {initials}
                  </div>
                  {/* Status dot */}
                  <span className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                    STATUS_DOT[m.status]
                  )} />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-[13px] font-medium text-foreground leading-none">
                      {m.name ?? m.userId}
                    </span>
                    {m.status !== 'moving' && m.lastSeenAt && (
                      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        {formatLastSeen(m.lastSeenAt)}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn('h-4 px-1.5 text-[10px] font-normal rounded-full border', STATUS_BADGE[m.status])}
                    >
                      {m.status === 'moving' ? t('list.moving')
                        : m.status === 'stopped' ? t('list.stopped')
                        : t('list.lost')}
                    </Badge>
                    {m.speed != null && m.speed > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{m.speed} km/h</span>
                    )}
                  </div>

                  {m.lastAddress && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{m.lastAddress}</p>
                  )}
                </div>
              </div>
            )

            const content = renderItem ? renderItem(m, defaultItem) : defaultItem
            return (
              <div key={m.userId} onClick={() => onItemClick?.(m)} className="cursor-pointer border-b border-border/30 last:border-0">
                {content}
              </div>
            )
          })}

          <div ref={sentinelRef} className="py-2 text-center">
            {visibleCount < filtered.length && (
              <span className="text-[11px] text-muted-foreground">
                {filtered.length - visibleCount} người nữa...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
