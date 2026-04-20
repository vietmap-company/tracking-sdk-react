import * as React from 'react'
import { cn } from '@/lib/utils'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { POSITION_CLASSES } from './types'
import type { Position } from '@/lib/types'

export interface LegendProps {
  position?: Position
  className?: string
  style?: React.CSSProperties
}

export function Legend({
  position = 'top-right',
  className,
  style,
}: LegendProps) {
  const { t } = useFleetwork()
  const items: Array<{ key: string; label: string; color: string }> = [
    { key: 'moving', label: t('status.moving'), color: 'bg-emerald-500' },
    { key: 'stopped', label: t('status.stopped'), color: 'bg-amber-500' },
    {
      key: 'signal_lost',
      label: t('status.signal_lost'),
      color: 'bg-slate-400',
    },
  ]

  return (
    <div
      className={cn(
        'absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md',
        POSITION_CLASSES[position],
        className
      )}
      style={style}
    >
      <ul className='space-y-1'>
        {items.map((it) => (
          <li
            key={it.key}
            className='flex items-center gap-2 text-[11px] text-slate-700'
          >
            <span className={cn('h-2.5 w-2.5 rounded-full', it.color)} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
