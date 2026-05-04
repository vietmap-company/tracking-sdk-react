import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useSummaryCards, type UseSummaryCardsOptions } from '@/hooks'
import { Users, Route, Clock, Fuel } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARD_CONFIGS = [
  { key: 'activeEmployees', icon: Users,  iconBg: 'bg-indigo-50 text-indigo-600',  border: 'border-l-indigo-400' },
  { key: 'totalDistance',   icon: Route,  iconBg: 'bg-emerald-50 text-emerald-600', border: 'border-l-emerald-400' },
  { key: 'totalTravelTime', icon: Clock,  iconBg: 'bg-amber-50 text-amber-600',     border: 'border-l-amber-400'  },
  { key: 'totalFuelCost',   icon: Fuel,   iconBg: 'bg-rose-50 text-rose-600',       border: 'border-l-rose-400'   },
] as const

interface StatCardProps {
  icon: React.ElementType
  iconBg: string
  border: string
  label: string
  value: string
  sub?: string
}

function StatCard({ icon: Icon, iconBg, border, label, value, sub }: StatCardProps) {
  return (
    <Card className={cn('shadow-none border-l-2 rounded-xl bg-card hover:shadow-sm transition-shadow', border)}>
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1 animate-in fade-in duration-300">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className="text-[22px] font-bold text-foreground leading-tight truncate">{value}</p>
            {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={cn('shrink-0 p-2.5 rounded-xl', iconBg)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton({ border }: { border: string }) {
  return (
    <Card className={cn('shadow-none border-l-2 rounded-xl', border)}>
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

export interface SummaryCardsProps extends UseSummaryCardsOptions {
  className?: string
}

export function SummaryCards({ className, ...options }: SummaryCardsProps) {
  const { t } = useFleetwork()
  const { data, isLoading, error, refetch } = useSummaryCards(options)

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3', className)}>
        {CARD_CONFIGS.map((c) => <StatCardSkeleton key={c.key} border={c.border} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive', className)}>
        <span>{t('common.error')}: {error.message}</span>
        <button onClick={refetch} className="text-xs underline underline-offset-2 ml-4 shrink-0">{t('common.retry')}</button>
      </div>
    )
  }

  if (!data) return null

  const pct = Math.round((data.activeUsers.active / Math.max(data.activeUsers.total, 1)) * 100)

  const cards = [
    { ...CARD_CONFIGS[0], label: t('summary.activeEmployees'), value: `${data.activeUsers.active} / ${data.activeUsers.total}`, sub: `${pct}% đang hoạt động` },
    { ...CARD_CONFIGS[1], label: t('summary.totalDistance'),   value: data.totalDistance.value.toLocaleString(), sub: data.totalDistance.unit },
    { ...CARD_CONFIGS[2], label: t('summary.totalTravelTime'), value: data.totalTravelTime.formatted, sub: undefined },
    { ...CARD_CONFIGS[3], label: t('summary.totalFuelCost'),   value: data.totalFuelCost.formatted,  sub: data.totalFuelCost.currency },
  ]

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3', className)}>
      {cards.map(({ key, ...rest }) => <StatCard key={key} {...rest} />)}
    </div>
  )
}
