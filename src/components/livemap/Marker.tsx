import { MapPin, Navigation, Users, X, Clock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { MemberStatus } from '@/lib/types'
import { STATUS_AVATAR_BG, STATUS_BADGE, STATUS_DOT_PLAIN } from '@/components/shared'

function formatLastSeen(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

const STATUS_LABEL: Record<MemberStatus['status'], string> = {
  moving:      'Đang di chuyển',
  stopped:     'Đang dừng',
  signal_lost: 'Mất tín hiệu',
}

export interface DefaultPopupProps {
  member: MemberStatus
  onViewHistory?: () => void
  onClose?: () => void
}

export function DefaultPopup({ member, onViewHistory, onClose }: DefaultPopupProps) {
  const initials = (member.name ?? member.userId).slice(0, 2).toUpperCase()

  return (
    <div className="w-[240px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] text-[12px]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative px-4 pt-4 pb-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="flex items-start gap-3 pr-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold text-white',
              STATUS_AVATAR_BG[member.status]
            )}>
              {initials}
            </div>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
              STATUS_DOT_PLAIN[member.status]
            )} />
          </div>

          {/* Name + status badge — same badge as dashboard table */}
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate text-[14px] font-semibold text-foreground leading-tight">
              {member.name ?? member.userId}
            </p>
            {member.groupName && (
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">{member.groupName}</p>
            )}
            <span className={cn(
              'mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              STATUS_BADGE[member.status]
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT_PLAIN[member.status])} />
              {member.statusLabel || STATUS_LABEL[member.status]}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2.5">
        {member.status === 'moving' && member.speed != null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Navigation className="h-3 w-3 shrink-0" />
              <span>Tốc độ</span>
            </div>
            <span className="font-semibold text-emerald-600 tabular-nums">{member.speed} km/h</span>
          </div>
        )}
        {member.status !== 'moving' && member.lastSeenAt && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Cập nhật</span>
            </div>
            <span className="font-medium text-foreground">{formatLastSeen(member.lastSeenAt)}</span>
          </div>
        )}
        {member.groupName && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span>Nhóm</span>
            </div>
            <span className="font-medium text-foreground truncate max-w-32">{member.groupName}</span>
          </div>
        )}
        {member.lastAddress && (
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="leading-snug text-foreground/80 line-clamp-2 flex-1">{member.lastAddress}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-muted-foreground">Tọa độ</span>
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {member.lat.toFixed(5)}, {member.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {/* ── View history CTA ───────────────────────────────────── */}
      {onViewHistory && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={onViewHistory}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl py-2',
                'bg-primary text-primary-foreground text-[12px] font-semibold',
                'hover:bg-primary/90 transition-colors'
              )}
            >
              Xem lộ trình
            </button>
          </div>
        </>
      )}
    </div>
  )
}
