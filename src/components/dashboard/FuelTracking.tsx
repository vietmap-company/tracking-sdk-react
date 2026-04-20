import * as React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFuelTracking } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { formatNumber } from '@/lib/utils'
import type { FuelGroupBy, FuelTrackingData } from '@/lib/types'

export interface FuelTrackingProps {
  from?: number
  to?: number
  groupBy?: FuelGroupBy
  pollInterval?: number
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: FuelTrackingData) => void
}

export function FuelTracking({
  from,
  to,
  groupBy = 'month',
  pollInterval,
  className,
  style,
  onError,
  onDataChange,
}: FuelTrackingProps) {
  const { t } = useFleetwork()
  const { data, isLoading, error } = useFuelTracking({
    from,
    to,
    groupBy,
    pollInterval,
  })

  React.useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])
  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data)
  }, [data, onDataChange])

  const chartData = data?.series.map((s) => ({
    label: s.label,
    distanceKm: s.distanceKm,
    fuelLiters: s.fuelLiters,
  }))

  return (
    <Card className={className} style={style}>
      <CardHeader className='grid grid-cols-[1fr_auto] items-end gap-2'>
        <div>
          <CardTitle>{t('fuel.title')}</CardTitle>
          <div className='text-xs text-slate-500'>{t('fuel.subtitle')}</div>
        </div>
        <div className='text-right'>
          {data ? (
            <>
              <div className='text-2xl font-semibold text-slate-900'>
                {formatNumber(data.fuelEfficiency.value, 1)}
              </div>
              <div className='text-xs text-slate-500'>
                {data.fuelEfficiency.unit} · {t('fuel.efficiency')}
              </div>
            </>
          ) : (
            <Skeleton className='h-8 w-16' />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !chartData ? (
          <Skeleton className='h-60 w-full' />
        ) : (
          <div className='h-60 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType='circle'
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Line
                  type='monotone'
                  dataKey='distanceKm'
                  name={t('fuel.distance')}
                  stroke='#3b82f6'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type='monotone'
                  dataKey='fuelLiters'
                  name={t('fuel.fuel')}
                  stroke='#10b981'
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
