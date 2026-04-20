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

const DEFAULT_COLORS: Record<string, string> = {
  fuel: '#10b981',
  maintenance: '#3b82f6',
  insurance: '#f59e0b',
  other: '#8b5cf6',
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

  const categories = data?.categories ?? [
    { key: 'fuel', label: t('expenses.fuel'), color: DEFAULT_COLORS.fuel },
    {
      key: 'maintenance',
      label: t('expenses.maintenance'),
      color: DEFAULT_COLORS.maintenance,
    },
    {
      key: 'insurance',
      label: t('expenses.insurance'),
      color: DEFAULT_COLORS.insurance,
    },
    { key: 'other', label: t('expenses.other'), color: DEFAULT_COLORS.other },
  ]

  return (
    <Card className={className} style={style}>
      <CardHeader>
        <CardTitle>{t('expenses.title')}</CardTitle>
        <div className='text-xs text-slate-500'>
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
                  label={{
                    value: t('expenses.unit'),
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
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
                {categories.map((cat) => (
                  <Bar
                    key={cat.key}
                    dataKey={cat.key}
                    stackId='cost'
                    name={cat.label}
                    fill={cat.color || DEFAULT_COLORS[cat.key] || '#94a3b8'}
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
