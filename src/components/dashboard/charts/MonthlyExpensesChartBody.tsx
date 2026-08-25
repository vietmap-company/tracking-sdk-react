import {
  Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ChartColors } from '@/lib/utils'

export interface ExpensePoint {
  label: string
  fuel: number
  maintenance: number
  insurance: number
  other: number
}

export interface ExpenseCategory {
  key: string
  label: string
  color: string
}

function fmtVndShort(v: number): string {
  if (v >= 1_000_000_000) return `${+(v / 1_000_000_000).toFixed(1)} tỷ`
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)} tr`
  if (v >= 1_000) return `${+(v / 1_000).toFixed(0)}K`
  return v === 0 ? '0' : `${v}`
}

function fmtVndFull(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} tỷ ₫`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} triệu ₫`
  if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K ₫`
  return `${v.toFixed(2)} ₫`
}

/**
 * Phần vẽ recharts của MonthlyExpenses — tách để `React.lazy` tải theo yêu cầu
 * (recharts không nằm trong chunk chính).
 */
export default function MonthlyExpensesChartBody({
  data,
  categories,
  colors,
}: {
  data: ExpensePoint[]
  categories: ExpenseCategory[]
  colors: ChartColors
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.axisTick }} tickLine={false} axisLine={false} />
        <YAxis
          width={48}
          tick={{ fontSize: 11, fill: colors.axisTick }}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtVndShort}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10, border: `1px solid ${colors.tooltipBorder}`,
            background: colors.tooltipBg, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(v: number) => [fmtVndFull(v), undefined]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {categories.map((cat) => (
          <Bar key={cat.key} dataKey={cat.key} stackId="cost" name={cat.label} fill={cat.color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
