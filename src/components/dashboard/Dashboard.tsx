import * as React from 'react'
import { cn } from '@/lib/utils'
import { SummaryCards } from './SummaryCards'
import { MemberReport } from './MemberReport'
import { ActivityHeatmap } from './ActivityHeatmap'
import { FuelTracking } from './FuelTracking'
import { MonthlyExpenses } from './MonthlyExpenses'

export interface DashboardProps {
  date?: number
  pollInterval?: number
  /** Chỉ hiển thị các user này trong Member report (API lọc server-side). Bỏ trống = tất cả. */
  userIds?: string[]
  showSummaryCards?: boolean
  showMemberReport?: boolean
  showActivityHeatmap?: boolean
  showFuelTracking?: boolean
  showMonthlyExpenses?: boolean
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
}

export function Dashboard({
  date,
  pollInterval = 30_000,
  userIds,
  showSummaryCards = true,
  showMemberReport = true,
  showActivityHeatmap = true,
  showFuelTracking = true,
  showMonthlyExpenses = true,
  className,
  style,
  onError,
}: DashboardProps) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)} style={style}>

      {/* Row 1: Summary cards */}
      {showSummaryCards && (
        <SummaryCards date={date} pollInterval={pollInterval} />
      )}

      {/* Row 2: Member report */}
      {showMemberReport && (
        <MemberReport date={date} pollInterval={pollInterval} userIds={userIds} />
      )}

      {/* Row 3: Heatmap */}
      {showActivityHeatmap && (
        <ActivityHeatmap pollInterval={pollInterval} />
      )}

      {/* Row 4: Charts side by side */}
      {(showFuelTracking || showMonthlyExpenses) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showFuelTracking && (
            <FuelTracking pollInterval={pollInterval} onError={onError} />
          )}
          {showMonthlyExpenses && (
            <MonthlyExpenses pollInterval={pollInterval} onError={onError} />
          )}
        </div>
      )}
    </div>
  )
}
