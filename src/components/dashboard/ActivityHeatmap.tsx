import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useActivityHeatmap, type UseActivityHeatmapOptions } from '@/hooks'
import { cn } from '@/lib/utils'

export interface ActivityHeatmapProps extends UseActivityHeatmapOptions {
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const DAYS_VI = [
  { key: 'Mon', label: 'T2' },
  { key: 'Tue', label: 'T3' },
  { key: 'Wed', label: 'T4' },
  { key: 'Thu', label: 'T5' },
  { key: 'Fri', label: 'T6' },
  { key: 'Sat', label: 'T7' },
  { key: 'Sun', label: 'CN' },
]

// 6-step gradient — dễ phân biệt hơn
function cellStyle(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-muted/50 border border-border/30'
  const p = value / max
  if (p < 0.17) return 'bg-primary/12'
  if (p < 0.33) return 'bg-primary/28'
  if (p < 0.50) return 'bg-primary/48'
  if (p < 0.67) return 'bg-primary/65'
  if (p < 0.84) return 'bg-primary/82'
  return 'bg-primary'
}

export function ActivityHeatmap({ className, ...options }: ActivityHeatmapProps) {
  const { t } = useFleetwork()
  const { data, isLoading, error } = useActivityHeatmap(options)

  return (
    <Card className={cn('shadow-none rounded-xl border-border/50', className)}>
      <CardHeader className="px-5 py-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-[15px] font-semibold text-foreground">
            {t('heatmap.title')}
          </CardTitle>
          {data && (
            <span className="text-[11px] text-muted-foreground">
              {new Date(data.from).toLocaleDateString('vi-VN')}
              {' – '}
              {new Date(data.to).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 py-5">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-md" />
            ))}
          </div>
        )}

        {error && (
          <div className="h-40 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-[12px] text-muted-foreground/60">{t('common.error')}</p>
          </div>
        )}

        {!isLoading && !error && !data && (
          <div className="h-40 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-[12px] text-muted-foreground/60">{t('common.noData')}</p>
          </div>
        )}

        {data && (
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">

              {/* Hour axis labels */}
              <div className="flex items-center ml-10 mb-2">
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground/60 font-medium">
                    {h % 4 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              <div className="space-y-1.5">
                {DAYS_VI.map(({ key, label }) => {
                  const cells = data.cells.filter(c =>
                    c.dayOfWeek === key ||
                    c.dayOfWeek?.toLowerCase() === key.toLowerCase()
                  )
                  return (
                    <div key={key} className="flex items-center gap-1.5">
                      {/* Day label */}
                      <div className="w-8 text-[11px] font-semibold text-muted-foreground text-right shrink-0">
                        {label}
                      </div>

                      {/* Hour cells */}
                      <div className="flex flex-1 gap-px">
                        {HOURS.map(h => {
                          const cell = cells.find(c => c.hour === h)
                          const tip = cell?.label
                            ?? `${label} ${String(h).padStart(2, '0')}:00`
                          return (
                            <div
                              key={h}
                              title={tip}
                              className={cn(
                                'flex-1 h-6 rounded-[4px] cursor-default transition-all hover:scale-110 hover:z-10 hover:shadow-sm',
                                cellStyle(cell?.value ?? 0, data.maxValue)
                              )}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-[11px] text-muted-foreground">{t('heatmap.less')}</span>
                <div className="flex items-center gap-1">
                  {[0, 0.17, 0.33, 0.50, 0.67, 0.84, 1].map((v, i) => (
                    <div
                      key={i}
                      className={cn('h-4 w-4 rounded-[4px]', cellStyle(v * data.maxValue, data.maxValue))}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{t('heatmap.more')}</span>
              </div>

            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
