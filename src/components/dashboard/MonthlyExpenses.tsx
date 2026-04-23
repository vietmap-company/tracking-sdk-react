import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMonthlyExpenses } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useChartColors } from '@/lib/utils'
import type { MonthlyExpensesData } from '@/lib/types'

export interface MonthlyExpensesProps {
  from?: number
  to?: number
  currency?: string
  pollInterval?: number
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: MonthlyExpensesData) => void
}


export function MonthlyExpenses({
  from,
  to,
  currency = 'VND',
  pollInterval,
  className,
  style,
  onError,
  onDataChange,
}: MonthlyExpensesProps) {
  const { t } = useFleetwork()
  const colors = useChartColors()
  const { data, isLoading, error } = useMonthlyExpenses({
    from,
    to,
    currency,
    pollInterval,
  })

  React.useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])
  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data)
  }, [data, onDataChange])

  const chartData = data?.months.map((m) => ({
    label: m.label,
    fuel: m.costs.fuel / 1_000_000,
    maintenance: m.costs.maintenance / 1_000_000,
    insurance: m.costs.insurance / 1_000_000,
    other: m.costs.other / 1_000_000,
  }))

  // Always use theme chart tokens — API-provided colors are backend-defined
  // and not theme-aware, so we ignore categories[].color from the response.
  const categoryColorMap: Record<string, string> = {
    fuel: colors.chart1,
    maintenance: colors.chart2,
    insurance: colors.chart3,
    other: colors.chart5,
  }
  const categories = (data?.categories ?? [
    { key: 'fuel', label: t('expenses.fuel') },
    { key: 'maintenance', label: t('expenses.maintenance') },
    { key: 'insurance', label: t('expenses.insurance') },
    { key: 'other', label: t('expenses.other') },
  ]).map((cat) => ({ ...cat, color: categoryColorMap[cat.key] ?? colors.chart4 }))

  return (
    <Card className={className} style={style}>
      <CardHeader>
        <CardTitle>{t('expenses.title')}</CardTitle>
        <div className='text-xs text-muted-foreground'>
          {t('expenses.subtitle')}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !chartData ? (
          <Skeleton className='h-60 w-full' />
        ) : (
          <div className='h-60 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke={colors.grid} />
                <XAxis
                  dataKey='label'
                  tick={{ fontSize: 11, fill: colors.axisTick }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.axisTick }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: t('expenses.unit'),
                    angle: -90,
                    position: 'insideLeft',
                    fill: colors.axisTick,
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${colors.tooltipBorder}`,
                    background: colors.tooltipBg,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType='circle'
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                {categories.map((cat) => (
                  <Bar
                    key={cat.key}
                    dataKey={cat.key}
                    stackId='cost'
                    name={cat.label}
                    fill={cat.color}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
