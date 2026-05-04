import * as React from 'react'
import { Activity, ChevronRight, Droplet, Route, ChevronLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
}

export function Report({ from, to, className, style, onError }: ReportProps) {
  const { t } = useFleetwork()
  const [mode, setMode] = React.useState<ReportMode>('home')
  const [range, setRange] = React.useState<ReportRangeState>({
    from: from ?? daysAgoMs(30),
    to: to ?? Date.now(),
  })
  const back = React.useCallback(() => setMode('home'), [])

  if (mode === 'trip') {
    return (
      <TripFuelTabs className={className} style={style}
        title={t('reports.trip.title')} subtitle={t('reports.trip.subtitle')} onBack={back}
        Summary={() => <TripSummaryReport range={range} onRangeChange={setRange} onError={onError} />}
        Detail={() => <TripDetailReport range={range} onRangeChange={setRange} onError={onError} />}
      />
    )
  }
  if (mode === 'fuel') {
    return (
      <TripFuelTabs className={className} style={style}
        title={t('reports.fuel.title')} subtitle={t('reports.fuel.subtitle')} onBack={back}
        Summary={() => <FuelSummaryReport range={range} onRangeChange={setRange} onError={onError} />}
        Detail={() => <FuelDetailReport range={range} onRangeChange={setRange} onError={onError} />}
      />
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

// ── TripFuelTabs ──────────────────────────────────────────────────────────────

function TripFuelTabs({
  title, subtitle, onBack, Summary, Detail, className, style,
}: {
  title: string; subtitle: string; onBack: () => void
  Summary: React.ComponentType; Detail: React.ComponentType
  className?: string; style?: React.CSSProperties
}) {
  const { t } = useFleetwork()
  return (
    <div className={cn('w-full space-y-5', className)} style={style}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1 text-[13px]">
          <ChevronLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList className="h-9 bg-muted/50 rounded-lg p-0.5 gap-0.5 mb-4">
          <TabsTrigger
            value="summary"
            className="h-8 px-4 text-[13px] rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium"
          >
            {t('reports.tab.summary')}
          </TabsTrigger>
          <TabsTrigger
            value="detail"
            className="h-8 px-4 text-[13px] rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-medium"
          >
            {t('reports.tab.detail')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-0"><Summary /></TabsContent>
        <TabsContent value="detail"  className="mt-0"><Detail /></TabsContent>
      </Tabs>
    </div>
  )
}
