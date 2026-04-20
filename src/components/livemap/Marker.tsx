import * as React from 'react'
import { cn } from '@/lib/utils'
import type { MemberStatus } from '@/lib/types'

export interface MarkerDotProps {
  member: MemberStatus
  active?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  style?: React.CSSProperties
}

const STATUS_COLOR: Record<MemberStatus['status'], string> = {
  moving: 'bg-emerald-500',
  stopped: 'bg-amber-500',
  signal_lost: 'bg-slate-400',
}

/** Pure presentational marker rendered via React portal inside a vietmap Marker container. */
export function MarkerDot({
  member,
  active,
  onClick,
  className,
  style,
}: MarkerDotProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'group relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-md transition-transform hover:scale-110',
        STATUS_COLOR[member.status],
        active && 'scale-125 ring-2 ring-blue-400 ring-offset-1',
        className
      )}
      style={style}
      aria-label={member.name}
    >
      {member.name.slice(0, 2).toUpperCase()}
    </button>
  )
}

export interface DefaultPopupProps {
  member: MemberStatus
}

export function DefaultPopup({ member }: DefaultPopupProps) {
  return (
    <div className='min-w-[200px] p-1 text-xs'>
      <div className='text-sm font-semibold text-slate-900'>{member.name}</div>
      {member.lastAddress && (
        <div className='mt-1 text-slate-500'>{member.lastAddress}</div>
      )}
      <div className='mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-600'>
        <span>Status:</span>
        <span className='text-right'>{member.statusLabel}</span>
        {member.speed != null && (
          <>
            <span>Speed:</span>
            <span className='text-right'>{member.speed} km/h</span>
          </>
        )}
      </div>
    </div>
  )
}
