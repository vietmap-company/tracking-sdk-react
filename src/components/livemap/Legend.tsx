import { cn } from '@/lib/utils'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { STATUS_BG } from './statusColors'

type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const POSITION_CLASSES: Record<Position, string> = {
  'top-left':     'top-3 left-3',
  'top-right':    'top-3 right-3',
  'bottom-left':  'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}

export function Legend({ position = 'top-right' as Position, className }: { position?: Position; className?: string }) {
  const { t } = useFleetwork()
  const items = [
    { key: 'moving',      label: t('status.moving')      },
    { key: 'stopped',     label: t('status.stopped')     },
    { key: 'signal_lost', label: t('status.signal_lost') },
  ]
  return (
    <div className={cn(
      'absolute z-10 rounded-xl border border-border/60 bg-card/90 px-3 py-2.5 shadow-md backdrop-blur-sm',
      POSITION_CLASSES[position],
      className
    )}>
      <ul className="flex flex-col gap-1.5">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-2 text-[11px] font-medium text-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_BG[it.key])} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
