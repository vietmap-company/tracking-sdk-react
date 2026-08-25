import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { ChartColors } from '@/lib/utils'

export interface FuelPoint {
  label: string
  distanceKm: number
  fuelLiters: number
}

/**
 * Phần vẽ recharts của FuelTracking — tách riêng để `React.lazy` tải theo yêu
 * cầu, nên recharts (dep nặng) không nằm trong chunk chính; consumer chỉ dùng
 * LiveMap/Report không phải tải nó.
 */
export default function FuelTrackingChartBody({
  data,
  colors,
  distanceLabel,
  fuelLabel,
}: {
  data: FuelPoint[]
  colors: ChartColors
  distanceLabel: string
  fuelLabel: string
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1))}
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
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1))}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10, border: `1px solid ${colors.tooltipBorder}`,
            background: colors.tooltipBg, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)}k` : v.toFixed(2))}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Line yAxisId="left"  type="monotone" dataKey="distanceKm" name={distanceLabel} stroke={colors.chart2} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        <Line yAxisId="right" type="monotone" dataKey="fuelLiters"  name={fuelLabel}     stroke={colors.chart1} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
