import * as React from 'react'
import { Activity, ChevronRight, Droplet, Route } from 'lucide-react'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn, daysAgoMs } from '@/lib/utils'
import {
  ActivityTimeReport, FuelDetailReport, FuelSummaryReport,
  TripDetailReport, TripSummaryReport, type ReportRangeState,
} from './views'

type ReportMode = 'home' | 'trip' | 'fuel' | 'activity'

export interface ReportProps {
  from?: number
  to?: number
  /** Chỉ lấy các user này cho mọi báo cáo (API lọc server-side). Bỏ trống = tất cả. */
  userIds?: string[]
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
}

export function Report({ from, to, userIds, className, style, onError }: ReportProps) {
  const { t } = useFleetwork()
  const [mode, setMode] = React.useState<ReportMode>('home')
  const [range, setRange] = React.useState<ReportRangeState>({
    from: from ?? daysAgoMs(30),
    to: to ?? Date.now(),
  })
  // Drill-down: click 1 user ở bảng tổng hợp -> mở màn chi tiết riêng của user đó.
  const [detailUser, setDetailUser] = React.useState<{ userId: string; name: string } | null>(null)
  const back = React.useCallback(() => {
    setDetailUser(null)
    setMode('home')
  }, [])
  const backToSummary = React.useCallback(() => setDetailUser(null), [])
  const openUser = React.useCallback(
    (userId: string, name: string) => setDetailUser({ userId, name }),
    [],
  )

  if (mode === 'trip') {
    return (
      <div className={cn('w-full', className)} style={style}>
        {detailUser ? (
          <TripDetailReport
            range={range} onRangeChange={setRange} onBack={backToSummary} onError={onError}
            userId={detailUser.userId} userName={detailUser.name}
          />
        ) : (
          <TripSummaryReport
            range={range} onRangeChange={setRange} onBack={back} onError={onError}
            userIds={userIds} onUserClick={openUser}
          />
        )}
      </div>
    )
  }
  if (mode === 'fuel') {
    return (
      <div className={cn('w-full', className)} style={style}>
        {detailUser ? (
          <FuelDetailReport
            range={range} onRangeChange={setRange} onBack={backToSummary} onError={onError}
            userId={detailUser.userId} userName={detailUser.name}
          />
        ) : (
          <FuelSummaryReport
            range={range} onRangeChange={setRange} onBack={back} onError={onError}
            userIds={userIds} onUserClick={openUser}
          />
        )}
      </div>
    )
  }
  if (mode === 'activity') {
    return (
      <div className={cn('w-full', className)} style={style}>
        <ActivityTimeReport range={range} onRangeChange={setRange} onBack={back} onError={onError} />
      </div>
    )
  }

  // ── Home ──────────────────────────────────────────────────────────────────
  return (
    <div className={cn('w-full space-y-8', className)} style={style}>
      {/* Hero */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('reports.title')}</h1>
        <p className="text-[13px] text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { mode: 'trip'     as ReportMode, icon: Route,    titleKey: 'reports.trip.title',      subKey: 'reports.trip.subtitle',      color: 'bg-indigo-500' },
          { mode: 'fuel'     as ReportMode, icon: Droplet,  titleKey: 'reports.fuel.title',      subKey: 'reports.fuel.subtitle',      color: 'bg-emerald-500' },
          { mode: 'activity' as ReportMode, icon: Activity, titleKey: 'reports.activity.title',  subKey: 'reports.activity.subtitle',  color: 'bg-amber-500' },
        ].map(({ mode: m, icon: Icon, titleKey, subKey, color }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'group flex w-full items-start gap-4 rounded-xl border border-border/60 bg-card p-5 text-left',
              'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white', color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-foreground truncate">{t(titleKey)}</p>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{t(subKey)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
