import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { GpsPoint } from '@/lib/types'

function fmtTime(ts: number) { return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

export interface PlaybackControlsProps {
  points: GpsPoint[]
  index: number
  isPlaying: boolean
  speed: 1 | 2 | 4
  autoFollow: boolean
  onSeek: (index: number) => void
  onPlayToggle: () => void
  onSpeedCycle: () => void
  onAutoFollowToggle: () => void
}

export function PlaybackControls({ points, index, isPlaying, speed, autoFollow, onSeek, onPlayToggle, onSpeedCycle, onAutoFollowToggle }: PlaybackControlsProps) {
  const total = points.length
  if (!total) return null
  const curr = points[index]
  const pct = (total > 1 ? index / (total - 1) : 0) * 100
  const trackRef = React.useRef<HTMLDivElement>(null)

  const calcIndex = React.useCallback((clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return index
    return Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (total - 1))
  }, [index, total])

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onSeek(calcIndex(e.clientX))
    const onMove = (ev: MouseEvent) => onSeek(calcIndex(ev.clientX))
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [calcIndex, onSeek])

  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-[min(480px,calc(100%-32px))] -translate-x-1/2 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button type="button" onClick={onPlayToggle} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted">
          {isPlaying
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          }
        </button>
        {/* Speed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onSpeedCycle} className="flex h-7 shrink-0 items-center rounded-full border border-border/60 bg-card px-3 text-[11px] font-bold text-foreground hover:bg-muted">
              {speed}×
            </button>
          </TooltipTrigger>
          <TooltipContent>Tốc độ phát lại</TooltipContent>
        </Tooltip>
        {/* Seek */}
        <div ref={trackRef} className="relative flex h-8 flex-1 cursor-pointer select-none items-center px-2" onMouseDown={handleMouseDown}>
          <div className="relative h-1.5 w-full rounded-full bg-muted">
            <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${pct.toFixed(2)}%`, pointerEvents: 'none' }} />
            <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-md" style={{ left: `${pct.toFixed(2)}%`, pointerEvents: 'none' }} />
          </div>
        </div>
        {/* Auto-follow */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onAutoFollowToggle} className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors', autoFollow ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/60 bg-card text-muted-foreground hover:bg-muted')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>{autoFollow ? 'Auto-follow: bật' : 'Auto-follow: tắt'}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="font-mono">
          {curr ? fmtTime(curr.time) : '—'}
          <span className="mx-1 opacity-40">·</span>
          <span className="font-semibold text-foreground">{curr && curr.speed > 0 ? `${Math.round(curr.speed)} km/h` : '—'}</span>
        </span>
        <span>{index + 1} / {total}</span>
      </div>
    </div>
  )
}
