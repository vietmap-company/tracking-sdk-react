import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useFleetwork } from '@/provider/FleetworkProvider'
import { useMemberReport, type UseMemberReportOptions } from '@/hooks'
import { cn } from '@/lib/utils'
import { resolveMemberName } from '@/lib/member-name'
import { STATUS_BADGE, STATUS_SUMMARY_DOT, MemberAvatar, ErrorBanner } from '@/components/shared'
import { ReportShell, PaginationBar, ReportTableSkeletonRows, ReportEmptyRow } from '@/components/report/shared'

export interface MemberReportProps extends Omit<UseMemberReportOptions, 'page'> {
  className?: string
}

export function MemberReport({ className, ...options }: MemberReportProps) {
  const { t, memberNameKey } = useFleetwork()
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, refetch } = useMemberReport({ ...options, page })
  // Skeleton khớp số dòng đang hiển thị (data cũ khi refetch), fallback pageSize.
  const skeletonRows = data?.users?.length || (options.pageSize ?? 10)

  const summaryRight = data ? (
    <div className="flex items-center gap-3">
      {([
        { key: 'moving',     dotKey: 'moving',      labelKey: 'report.moving'     },
        { key: 'stopped',    dotKey: 'stopped',      labelKey: 'report.stopped'   },
        { key: 'signalLost', dotKey: 'signal_lost',  labelKey: 'report.signalLost'},
      ] as const).map(({ key, dotKey, labelKey }) => (
        <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn('h-2 w-2 rounded-full inline-block shrink-0', STATUS_SUMMARY_DOT[dotKey])} />
          <span className="font-semibold text-foreground tabular-nums">{data.summary[key]}</span>
          {t(labelKey)}
        </span>
      ))}
    </div>
  ) : undefined

  return (
    <ReportShell
      loading={isFetching}
      title={t('report.title')}
      right={summaryRight}
      className={className}
    >
      {error && <ErrorBanner error={error} onRetry={refetch} />}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] caption-bottom text-sm border-collapse">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="px-5 h-10 text-[11px] font-semibold text-muted-foreground min-w-[160px]">{t('report.col.employee')}</TableHead>
              <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground text-right whitespace-nowrap">{t('report.col.distance')}</TableHead>
              <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground text-right whitespace-nowrap">{t('report.col.travelTime')}</TableHead>
              <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground text-right whitespace-nowrap">{t('report.col.fuel')}</TableHead>
              <TableHead className="px-5 h-10 text-[11px] font-semibold text-muted-foreground">{t('report.col.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ReportTableSkeletonRows rows={skeletonRows} cols={5} />
            ) : !data?.users?.length ? (
              <ReportEmptyRow colSpan={5} />
            ) : (
              data.users?.map((user) => {
                // metadata sits inside `lastLocation`, shipped as a JSON string.
                // `resolveMemberName` handles both string and object shapes.
                const meta = user.lastLocation?.metadata
                const displayName =
                  resolveMemberName(meta, memberNameKey) ?? user.userId
                const avatarUrl =
                  resolveMemberName(meta, 'userAvatar') ?? null
                return (
                <TableRow key={user.userId} className="border-border/30 hover:bg-muted/30 transition-colors animate-in fade-in duration-200">
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <MemberAvatar name={displayName} avatarUrl={avatarUrl} size="sm" />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground leading-none">{displayName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums font-medium">{user.distance.value.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums text-muted-foreground">{user.travelTime.formatted}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums text-muted-foreground">{user.fuel.consumedLiters.toFixed(1)}</TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge variant="outline" className={cn('text-[11px] font-medium rounded-full px-2.5', STATUS_BADGE[user.status])}>
                      {user.statusLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </table>
      </div>

      {data && (
        <PaginationBar
          page={page}
          totalPages={data.pagination.totalPages}
          onChange={setPage}
        />
      )}
    </ReportShell>
  )
}
