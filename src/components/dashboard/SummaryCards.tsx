import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSummaryCards } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn, formatNumber } from '@/lib/utils'
import type { SummaryCardsData } from '@/lib/types'

export interface SummaryCardsProps {
  date?: number
  pollInterval?: number
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: SummaryCardsData) => void
}

const KPI_ORDER: Array<{
  key: keyof SummaryCardsData | 'activeEmployees'
  labelKey: string
  render: (d: SummaryCardsData) => string
}> = [
  {
    key: 'activeEmployees',
    labelKey: 'summary.activeEmployees',
    render: (d) => `${d.activeEmployees.active}/${d.activeEmployees.total}`,
  },
  {
    key: 'totalDistance',
    labelKey: 'summary.totalDistance',
    render: (d) =>
      `${formatNumber(d.totalDistance.value, 1)} ${d.totalDistance.unit}`,
  },
  {
    key: 'totalTravelTime',
    labelKey: 'summary.totalTravelTime',
    render: (d) => d.totalTravelTime.formatted,
  },
  {
    key: 'totalFuelCost',
    labelKey: 'summary.totalFuelCost',
    render: (d) => d.totalFuelCost.formatted,
  },
]

export function SummaryCards({
  date,
  pollInterval,
  className,
  style,
  onError,
  onDataChange,
}: SummaryCardsProps) {
  const { t } = useFleetwork()
  const { data, isLoading, error } = useSummaryCards({ date, pollInterval })

  React.useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])

  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data)
  }, [data, onDataChange])

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
      style={style}
    >
      {KPI_ORDER.map((kpi) => (
        <Card key={kpi.key as string} className='px-4 py-3'>
          <div className='text-xs font-medium text-muted-foreground'>
            {t(kpi.labelKey)}
          </div>
          <div className='mt-1 text-xl font-semibold text-foreground'>
            {isLoading || !data ? (
              <Skeleton className='h-6 w-24' />
            ) : (
              kpi.render(data)
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
