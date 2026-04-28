import * as React from 'react'
import { Clock, Droplet, Route, Users } from 'lucide-react'
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

const KPIS = [
  {
    key: 'activeUsers',
    Icon: Users,
    labelKey: 'summary.activeEmployees',
    render: (d: SummaryCardsData) => `${d.activeUsers.active} / ${d.activeUsers.total}`,
  },
  {
    key: 'totalDistance',
    Icon: Route,
    labelKey: 'summary.totalDistance',
    render: (d: SummaryCardsData) =>
      `${formatNumber(d.totalDistance.value, 1)} ${d.totalDistance.unit}`,
  },
  {
    key: 'totalTravelTime',
    Icon: Clock,
    labelKey: 'summary.totalTravelTime',
    render: (d: SummaryCardsData) => d.totalTravelTime.formatted,
  },
  {
    key: 'totalFuelCost',
    Icon: Droplet,
    labelKey: 'summary.totalFuelCost',
    render: (d: SummaryCardsData) => d.totalFuelCost.formatted,
  },
] as const

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
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}
      style={style}
    >
      {KPIS.map(({ key, Icon, labelKey, render }) => (
        <Card key={key} className="gap-0 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">{t(labelKey)}</p>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {isLoading || !data ? <Skeleton className="h-7 w-28" /> : render(data)}
          </div>
        </Card>
      ))}
    </div>
  )
}
