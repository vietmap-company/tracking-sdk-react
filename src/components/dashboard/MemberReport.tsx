import * as React from 'react'
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMemberReport } from '@/hooks'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { cn, formatNumber } from '@/lib/utils'
import type { MemberReportData, MemberRow } from '@/lib/types'

export interface MemberReportProps {
  date?: number
  pageSize?: number
  pollInterval?: number
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  onDataChange?: (data: MemberReportData) => void
  onRowClick?: (member: MemberRow) => void
}

export function MemberReport({
  date,
  pageSize = 10,
  pollInterval,
  className,
  style,
  onError,
  onDataChange,
  onRowClick,
}: MemberReportProps) {
  const { t } = useFleetwork()
  const [page, setPage] = React.useState(1)
  const { data, isLoading, error } = useMemberReport({
    date,
    page,
    pageSize,
    pollInterval,
  })

  React.useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])

  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data)
  }, [data, onDataChange])

  const summary = data?.summary
  const members = data?.members ?? []
  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <Card className={className} style={style}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ClipboardList className='h-4 w-4 text-slate-500' />
          {t('report.title')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className='mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <StatCard label={t('report.total')} value={summary?.total} />
          <StatCard
            label={t('report.moving')}
            value={summary?.moving}
            accent='moving'
          />
          <StatCard
            label={t('report.stopped')}
            value={summary?.stopped}
            accent='stopped'
          />
          <StatCard
            label={t('report.signalLost')}
            value={summary?.signalLost}
            accent='signal_lost'
          />
        </div>

        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('report.col.employee')}</TableHead>
                <TableHead>{t('report.col.distance')}</TableHead>
                <TableHead>{t('report.col.travelTime')}</TableHead>
                <TableHead>{t('report.col.fuel')}</TableHead>
                <TableHead>{t('report.col.fuelCost')}</TableHead>
                <TableHead>{t('report.col.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className='h-4 w-20' />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-8 text-center text-slate-400'>
                    {t('report.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow
                    key={m.userId}
                    onClick={() => onRowClick?.(m)}
                    className={cn(onRowClick && 'cursor-pointer')}
                  >
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar
                          src={m.avatarUrl ?? undefined}
                          alt={m.name}
                          fallback={m.name}
                          size={28}
                        />
                        <span className='font-medium text-slate-800'>
                          {m.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(m.distance.value, 1)}</TableCell>
                    <TableCell>{m.travelTime.formatted}</TableCell>
                    <TableCell>
                      {formatNumber(m.fuel.consumedLiters, 1)}
                    </TableCell>
                    <TableCell>
                      {formatNumber(m.fuel.costVnd / 1_000_000, 2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status}>{m.statusLabel}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className='mt-3 flex items-center justify-end gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className='h-4 w-4' />
              {t('report.prev')}
            </Button>
            <span className='text-xs text-slate-500'>
              {t('report.page')} {page} {t('report.of')} {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('report.next')}
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatCardProps {
  label: string
  value?: number
  accent?: 'moving' | 'stopped' | 'signal_lost'
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentColor =
    accent === 'moving'
      ? 'text-emerald-600'
      : accent === 'stopped'
        ? 'text-amber-600'
        : accent === 'signal_lost'
          ? 'text-slate-500'
          : 'text-slate-900'
  return (
    <div className='rounded-md border border-slate-100 bg-slate-50 px-3 py-2'>
      <div className='text-xs text-slate-500'>{label}</div>
      <div className={cn('mt-0.5 text-lg font-semibold', accentColor)}>
        {value == null ? <Skeleton className='h-5 w-8' /> : value}
      </div>
    </div>
  )
}
