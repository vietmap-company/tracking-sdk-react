import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useActivityHeatmap, type UseActivityHeatmapOptions } from '@/hooks'
import { cn } from '@/lib/utils'

export interface ActivityHeatmapProps extends Omit<UseActivityHeatmapOptions, 'from' | 'to'> {
  /** Anchor date for the initial week. Snaps to Mon–Sun of that week. */
  initialDate?: Date | number
  /** Fired whenever the user navigates to a different week. */
  onWeekChange?: (range: { from: number; to: number }) => void
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_MS = 24 * 60 * 60 * 1000

const DAYS_VI: { dayIndex: number; label: string }[] = [
  { dayIndex: 0, label: 'T2' },
  { dayIndex: 1, label: 'T3' },
  { dayIndex: 2, label: 'T4' },
  { dayIndex: 3, label: 'T5' },
  { dayIndex: 4, label: 'T6' },
  { dayIndex: 5, label: 'T7' },
  { dayIndex: 6, label: 'CN' },
]

const DOW_ALIASES: Record<string, number> = {
  mon: 0, monday: 0, t2: 0,
  tue: 1, tues: 1, tuesday: 1, t3: 1,
  wed: 2, weds: 2, wednesday: 2, t4: 2,
  thu: 3, thur: 3, thurs: 3, thursday: 3, t5: 3,
  fri: 4, friday: 4, t6: 4,
  sat: 5, saturday: 5, t7: 5,
  sun: 6, sunday: 6, cn: 6,
}

// JS getDay() is 0=Sun..6=Sat — convert to 0=Mon..6=Sun
function jsDayToMonIndex(d: Date): number {
  const wd = d.getDay()
  return wd === 0 ? 6 : wd - 1
}

function startOfWeek(ts: number): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - jsDayToMonIndex(d))
  return d
}

function endOfWeek(ts: number): Date {
  const d = startOfWeek(ts)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function parseDayIndex(raw: unknown): number | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const k = raw.trim().toLowerCase()
    if (k in DOW_ALIASES) return DOW_ALIASES[k]
  }
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')
const shortDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground/30" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <p className="text-[12px] text-muted-foreground/60">{label}</p>
    </div>
  )
}

export function ActivityHeatmap({
  className, initialDate, onWeekChange, ...options
}: ActivityHeatmapProps) {
  const { t } = useFleetwork()

  const [anchor, setAnchor] = React.useState(() => {
    const ts = initialDate instanceof Date ? initialDate.getTime()
      : typeof initialDate === 'number' ? initialDate
      : Date.now()
    return startOfWeek(ts).getTime()
  })

  const weekStart = React.useMemo(() => new Date(anchor), [anchor])
  const weekEnd = React.useMemo(() => endOfWeek(anchor), [anchor])

  const setWeek = (ts: number) => {
    const start = startOfWeek(ts).getTime()
    setAnchor(start)
    onWeekChange?.({ from: start, to: endOfWeek(start).getTime() })
  }
  const shiftWeek = (delta: number) => setWeek(anchor + delta * 7 * DAY_MS)

  const { data, isLoading, error } = useActivityHeatmap({
    ...options,
    from: weekStart.getTime(),
    to: weekEnd.getTime(),
  })

  const weekDates = React.useMemo(() => {
    return DAYS_VI.map(({ dayIndex }) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + dayIndex)
      return d
    })
  }, [weekStart])

  // Bucket cells by (dayIndex, hour).
  // cell.date is start-of-day — DO NOT derive hour from it.
  // Use cell.hour (authoritative) and cell.dayOfWeek string (timezone-safe).
  const grid = React.useMemo(() => {
    const m = new Map<number, Map<number, { value: number; label?: string }>>()
    if (!data) return m
    for (const c of data.cells) {
      // Hour: explicit field only (date is start-of-day, not hour-level)
      let h: number | null = null
      if (typeof c.hour === 'number' && c.hour >= 0 && c.hour <= 23) h = c.hour
      // Day: prefer server-provided string (timezone-safe), fallback to date
      let di: number | null = parseDayIndex(c.dayOfWeek)
      if (di == null && typeof c.date === 'number' && Number.isFinite(c.date)) {
        di = jsDayToMonIndex(new Date(c.date))
        if (h == null) h = new Date(c.date).getHours()
      }
      if (di == null || h == null) continue
      let row = m.get(di)
      if (!row) { row = new Map(); m.set(di, row) }
      const prev = row.get(h)
      const v = typeof c.value === 'number' && Number.isFinite(c.value) ? c.value : 0
      row.set(h, {
        value: (prev?.value ?? 0) + v,
        label: c.label ?? prev?.label,
      })
    }
    return m
  }, [data])

  const maxValue = data?.maxValue ?? 0

  return (
    <Card className={cn('shadow-none rounded-xl border-border/50', className)}>
      <CardHeader className="px-5 py-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-[15px] font-semibold text-foreground">
            {t('heatmap.title')}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              type="button" variant="outline" size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => shiftWeek(-1)}
              aria-label={t('heatmap.prevWeek')}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <DatePicker
              value={weekStart}
              onChange={(d) => setWeek(d.getTime())}
              formatLabel={(d) => `${shortDate(d)} – ${shortDate(endOfWeek(d.getTime()))}`}
              className="h-8"
            />
            <Button
              type="button" variant="outline" size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => shiftWeek(1)}
              aria-label={t('heatmap.nextWeek')}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
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

        {error && <EmptyState label={t('common.error')} />}
        {!isLoading && !error && !data && <EmptyState label={t('common.noData')} />}

        {data && (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour axis labels */}
              <div className="flex items-center ml-[60px] mb-2">
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground/60 font-medium">
                    {h % 4 === 0 ? `${h}h` : ''}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              <div className="space-y-1.5">
                {DAYS_VI.map(({ dayIndex, label }) => {
                  const row = grid.get(dayIndex)
                  const date = weekDates[dayIndex]
                  return (
                    <div key={dayIndex} className="flex items-center gap-1.5">
                      <div className="w-[52px] shrink-0 text-right pr-1">
                        <div className="text-[11px] font-semibold text-muted-foreground leading-none">
                          {label}
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground/70 leading-none tabular-nums">
                          {shortDate(date)}
                        </div>
                      </div>

                      <div className="flex flex-1 gap-px">
                        {HOURS.map(h => {
                          const cell = row?.get(h)
                          const tip = cell?.label
                            ?? `${label} ${shortDate(date)} ${pad(h)}:00`
                          return (
                            <div
                              key={h}
                              title={tip}
                              className={cn(
                                'flex-1 h-6 rounded-[4px] cursor-default',
                                cellStyle(cell?.value ?? 0, maxValue)
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
                      className={cn('h-4 w-4 rounded-[4px]', cellStyle(v * maxValue, maxValue))}
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
