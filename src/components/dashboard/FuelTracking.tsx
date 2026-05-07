import * as React from 'react'
import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFuelTracking, type UseFuelTrackingOptions } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { formatNumber, useChartColors, cn } from '@/lib/utils'
import type { FuelTrackingData } from '@/lib/types'

export interface FuelTrackingProps extends UseFuelTrackingOptions {
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: FuelTrackingData) => void
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-52 w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <p className="text-[12px] text-muted-foreground/60">{label}</p>
    </div>
  )
}

export function FuelTracking({
  className, style, onError, onDataChange, ...options
}: FuelTrackingProps) {
  const { t } = useFleetwork()
  const colors = useChartColors()
  const { data, isLoading, error } = useFuelTracking(options)

  React.useEffect(() => { if (error && onError) onError(error) }, [error, onError])
  React.useEffect(() => { if (data && onDataChange) onDataChange(data) }, [data, onDataChange])

  // Always render all 12 months (or raw series for day/week groupBy).
  // Months missing from the API response get 0 values so the X-axis is complete.
  const chartData = React.useMemo(() => {
    if (!data) return undefined
    if (data.groupBy !== 'month') {
      return data.series.map((s) => ({ label: s.label, distanceKm: s.distanceKm, fuelLiters: s.fuelLiters }))
    }
    const year = new Date(data.from).getFullYear()
    const byPeriod = new Map(data.series.map((s) => [s.period, s]))
    return Array.from({ length: 12 }, (_, i) => {
      const period = `${year}-${String(i + 1).padStart(2, '0')}`
      const entry = byPeriod.get(period)
      return { label: `T${i + 1}`, distanceKm: entry?.distanceKm ?? 0, fuelLiters: entry?.fuelLiters ?? 0 }
    })
  }, [data])

  return (
    <Card className={cn('shadow-none rounded-xl border-border/50', className)} style={style}>
      <CardHeader className="px-5 py-4 pb-3 border-b border-border/40">
        <div className="flex items-end justify-between gap-2">
          <div>
            <CardTitle className="text-[15px] font-semibold text-foreground">{t('fuel.title')}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t('fuel.subtitle') ?? 'Quãng đường vs Nhiên liệu'}</p>
          </div>
          <div className="text-right shrink-0">
            {data ? (
              <>
                <div className="text-[20px] font-bold text-foreground tabular-nums">
                  {formatNumber(data.fuelEfficiency.value, 1)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {data.fuelEfficiency.unit} · {t('fuel.efficiency') ?? 'Hiệu suất TB'}
                </div>
              </>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-lg" />
        ) : error || !chartData ? (
          <EmptyChart label={error ? t('common.error') : t('common.noData')} />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.axisTick }} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  width={44}
                  domain={[0, 'auto']}
                  allowDataOverflow={false}
                  tickCount={5}
                  tick={{ fontSize: 11, fill: colors.axisTick }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={44}
                  domain={[0, 'auto']}
                  allowDataOverflow={false}
                  tickCount={5}
                  tick={{ fontSize: 11, fill: colors.axisTick }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: `1px solid ${colors.tooltipBorder}`,
                    background: colors.tooltipBg, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(2)}k` : v.toFixed(2)}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line yAxisId="left"  type="monotone" dataKey="distanceKm" name={t('fuel.distance')} stroke={colors.chart2} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="fuelLiters"  name={t('fuel.fuel')}     stroke={colors.chart1} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
