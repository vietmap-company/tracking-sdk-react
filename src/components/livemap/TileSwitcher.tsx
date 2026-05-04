import * as React from 'react'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TileType } from '@/lib/types'

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const POSITION_CLASSES: Record<Position, string> = {
  'top-left':     'top-3 left-3',
  'top-right':    'top-3 right-3',
  'bottom-left':  'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}

const OPTIONS: Array<{ key: TileType; label: string; swatch: string }> = [
  { key: 'terrain',   label: 'Terrain',   swatch: 'bg-emerald-100' },
  { key: 'light',     label: 'Light',     swatch: 'bg-slate-100'   },
  { key: 'dark',      label: 'Dark',      swatch: 'bg-slate-700'   },
  { key: 'satellite', label: 'Satellite', swatch: 'bg-blue-900'    },
]

export interface TileSwitcherProps {
  value: TileType
  onChange: (t: TileType) => void
  position?: Position
  className?: string
}

export function TileSwitcher({ value, onChange, position = 'bottom-right', className }: TileSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className={cn('absolute z-10', POSITION_CLASSES[position], className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground shadow-md backdrop-blur-sm hover:bg-card"
      >
        <Layers className="h-4 w-4" />
      </button>
      {open && (
        <div className={cn(
          'absolute min-w-[150px] rounded-xl border border-border/60 bg-popover p-1 shadow-lg',
          position.startsWith('bottom') ? 'bottom-11 right-0' : 'top-11 right-0'
        )}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-muted transition-colors',
                value === opt.key && 'bg-muted font-semibold'
              )}
            >
              <span className={cn('h-3.5 w-3.5 rounded border border-border/60', opt.swatch)} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
