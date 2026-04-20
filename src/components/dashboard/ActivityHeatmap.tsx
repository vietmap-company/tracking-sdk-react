import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useActivityHeatmap } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn } from '@/lib/utils'
import type { ActivityHeatmapData } from '@/lib/types'

export interface ActivityHeatmapProps {
  from?: number
  to?: number
  pollInterval?: number
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: ActivityHeatmapData) => void
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatDateRange(from: number, to: number) {
  const f = new Date(from)
  const t = new Date(to)
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`
  return `${fmt(f)} - ${fmt(t)}`
}

function valueColor(value: number, max: number) {
  if (!max || value <= 0) return 'bg-slate-100'
  const ratio = Math.min(1, value / max)
  if (ratio < 0.15) return 'bg-blue-100'
  if (ratio < 0.35) return 'bg-blue-200'
  if (ratio < 0.55) return 'bg-blue-300'
  if (ratio < 0.75) return 'bg-blue-400'
  if (ratio < 0.9) return 'bg-blue-500'
  return 'bg-blue-600'
}

export function ActivityHeatmap({
  from,
  to,
  pollInterval,
  className,
  style,
  onError,
  onDataChange,
}: ActivityHeatmapProps) {
  const { t } = useFleetwork()
  const defaultTo = React.useMemo(() => Date.now(), [])
  const defaultFrom = React.useMemo(
    () => defaultTo - 7 * 24 * 60 * 60 * 1000,
    [defaultTo]
  )
  const [range, setRange] = React.useState<{ from: number; to: number }>({
    from: from ?? defaultFrom,
    to: to ?? defaultTo,
  })

  React.useEffect(() => {
    if (from && to) setRange({ from, to })
  }, [from, to])

  const { data, isLoading, error } = useActivityHeatmap({
    from: range.from,
    to: range.to,
    pollInterval,
  })

  React.useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])
  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data)
  }, [data, onDataChange])

  const cellMap = React.useMemo(() => {
    const map = new Map<string, number>()
    data?.cells.forEach((c) => {
      map.set(`${c.dayOfWeek}-${c.hour}`, c.value)
    })
    return map
  }, [data])

  const shiftRange = (weeks: number) => {
    const delta = weeks * 7 * 24 * 60 * 60 * 1000
    setRange((r) => ({ from: r.from + delta, to: r.to + delta }))
  }

  return (
    <Card className={className} style={style}>
      <CardHeader className='grid grid-cols-[1fr_auto] items-center'>
        <CardTitle>{t('heatmap.title')}</CardTitle>
        <div className='flex items-center gap-1'>
          <Button variant='ghost' size='icon' onClick={() => shiftRange(-1)}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <span className='text-xs text-slate-500'>
            {formatDateRange(range.from, range.to)}
          </span>
          <Button variant='ghost' size='icon' onClick={() => shiftRange(1)}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-48 w-full' />
        ) : (
          <div className='overflow-x-auto'>
            <div className='min-w-[680px]'>
              <div
                className='grid gap-[3px]'
                style={{
                  gridTemplateColumns: `32px repeat(24, minmax(0, 1fr))`,
                }}
              >
                <div />
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className='text-[10px] text-slate-400'
                    style={{ visibility: h % 2 === 0 ? 'visible' : 'hidden' }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}

                {DAYS.map((day) => (
                  <React.Fragment key={day}>
                    <div className='text-[11px] font-medium text-slate-500'>
                      {day}
                    </div>
                    {HOURS.map((h) => {
                      const v = cellMap.get(`${day}-${h}`) ?? 0
                      return (
                        <div
                          key={`${day}-${h}`}
                          title={`${day} ${String(h).padStart(2, '0')}:00 — ${v}`}
                          className={cn(
                            'h-6 rounded-[3px]',
                            valueColor(v, data?.maxValue ?? 0)
                          )}
                        />
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>

              <div className='mt-3 flex items-center gap-2 text-[11px] text-slate-500'>
                <span>{t('heatmap.less')}</span>
                <div className='flex gap-[2px]'>
                  {[
                    'bg-slate-100',
                    'bg-blue-100',
                    'bg-blue-200',
                    'bg-blue-300',
                    'bg-blue-400',
                    'bg-blue-500',
                    'bg-blue-600',
                  ].map((c) => (
                    <div key={c} className={cn('h-3 w-4 rounded-sm', c)} />
                  ))}
                </div>
                <span>{t('heatmap.more')}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
