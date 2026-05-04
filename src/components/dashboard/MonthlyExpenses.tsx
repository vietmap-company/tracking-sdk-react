import * as React from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMonthlyExpenses, type UseMonthlyExpensesOptions } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useChartColors, cn } from '@/lib/utils'
import type { MonthlyExpensesData } from '@/lib/types'

export interface MonthlyExpensesProps extends UseMonthlyExpensesOptions {
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: MonthlyExpensesData) => void
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

export function MonthlyExpenses({
  className, style, onError, onDataChange, ...options
}: MonthlyExpensesProps) {
  const { t } = useFleetwork()
  const colors = useChartColors()
  const { data, isLoading, error } = useMonthlyExpenses(options)

  React.useEffect(() => { if (error && onError) onError(error) }, [error, onError])
  React.useEffect(() => { if (data && onDataChange) onDataChange(data) }, [data, onDataChange])

  const chartData = data?.months.map((m) => ({
    label: m.label,
    fuel:        m.costs.fuel        / 1_000_000,
    maintenance: m.costs.maintenance / 1_000_000,
    insurance:   m.costs.insurance   / 1_000_000,
    other:       m.costs.other       / 1_000_000,
  }))

  const categoryColorMap: Record<string, string> = {
    fuel:        colors.chart1,
    maintenance: colors.chart2,
    insurance:   colors.chart3,
    other:       colors.chart5,
  }

  const categories = (
    data?.categories ?? [
      { key: 'fuel',        label: t('expenses.fuel')        },
      { key: 'maintenance', label: t('expenses.maintenance') },
      { key: 'insurance',   label: t('expenses.insurance')   },
      { key: 'other',       label: t('expenses.other')       },
    ]
  ).map((cat) => ({ ...cat, color: categoryColorMap[cat.key] ?? colors.chart4 }))

  return (
    <Card className={cn('shadow-none rounded-xl border-border/50', className)} style={style}>
      <CardHeader className="px-5 py-4 pb-3 border-b border-border/40">
        <CardTitle className="text-[15px] font-semibold text-foreground">{t('expenses.title')}</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('expenses.subtitle') ?? 'Chi phí phân loại theo tháng'}</p>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-lg" />
        ) : error || !chartData ? (
          <EmptyChart label={error ? t('common.error') : t('common.noData')} />
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.axisTick }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.axisTick }} tickLine={false} axisLine={false}
                  label={{ value: t('expenses.unit') ?? 'Triệu VNĐ', angle: -90, position: 'insideLeft', fill: colors.axisTick, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: `1px solid ${colors.tooltipBorder}`,
                    background: colors.tooltipBg, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {categories.map((cat) => (
                  <Bar key={cat.key} dataKey={cat.key} stackId="cost" name={cat.label} fill={cat.color} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
