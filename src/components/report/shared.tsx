import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn, getPageNumbers } from '@/lib/utils'

// ── ReportShell ───────────────────────────────────────────────────────────────

export interface ReportShellProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  onBack?: () => void
  children: React.ReactNode
  className?: string
}

export function ReportShell({ title, subtitle, right, onBack, children, className }: ReportShellProps) {
  const { t } = useFleetwork()
  return (
    <Card className={cn('shadow-none rounded-xl border-border/50 w-full overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="px-5 py-4 border-b border-border/40 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1 text-[13px] shrink-0">
                <ChevronLeft className="h-4 w-4" />
                {t('common.back')}
              </Button>
            )}
            <div className="min-w-0">
              <CardTitle className="text-[15px] font-semibold text-foreground truncate">{title}</CardTitle>
              {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

// ── PaginationBar ─────────────────────────────────────────────────────────────

export interface PaginationBarProps {
  page: number
  totalPages: number
  onChange: (p: number) => void
}

export function PaginationBar({ page, totalPages, onChange }: PaginationBarProps) {
  const { t } = useFleetwork()
  if (totalPages <= 1) return null
  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/40 bg-card">
      <span className="text-[11px] text-muted-foreground">
        {t('report.page')} <span className="font-semibold text-foreground tabular-nums">{page}</span> {t('report.of')} <span className="tabular-nums">{totalPages}</span>
      </span>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onChange(1)}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="flex h-7 w-5 items-center justify-center text-[11px] text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7 text-[11px]"
              onClick={() => onChange(p as number)}
            >
              {p}
            </Button>
          )
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onChange(totalPages)}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Table helpers ─────────────────────────────────────────────────────────────

export function ReportTableSkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-border/30">
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-3 w-16" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function ReportEmptyRow({ colSpan }: { colSpan: number }) {
  const { t } = useFleetwork()
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-[13px] text-muted-foreground">
        {t('report.empty')}
      </TableCell>
    </TableRow>
  )
}

// ── DateRangeBar ──────────────────────────────────────────────────────────────

export interface DateRangeBarProps {
  from: number
  to: number
  onChange: (range: { from: number; to: number }) => void
}

export function DateRangeBar({ from, to, onChange }: DateRangeBarProps) {
  return (
    <DateRangePicker
      from={new Date(from)}
      to={new Date(to)}
      maxDate={new Date()}
      onChange={(r) => onChange({ from: r.from.getTime(), to: r.to.getTime() })}
      className="text-[12px]"
    />
  )
}

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtTime(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateShort(ms: number): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('vi-VN')
}
