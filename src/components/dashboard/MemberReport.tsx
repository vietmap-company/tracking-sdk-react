import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemberReport } from "@/hooks";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn, formatNumber, getPageNumbers } from "@/lib/utils";
import type { MemberReportData, MemberRow } from "@/lib/types";

export interface MemberReportProps {
  date?: number;
  pageSize?: number;
  pollInterval?: number;
  className?: string;
  style?: React.CSSProperties;
  onError?: (error: Error) => void;
  onDataChange?: (data: MemberReportData) => void;
  onRowClick?: (member: MemberRow) => void;
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
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, error } = useMemberReport({
    date,
    page,
    pageSize,
    pollInterval,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  React.useEffect(() => {
    if (data && onDataChange) onDataChange(data);
  }, [data, onDataChange]);

  const summary = data?.summary;
  const members = data?.users ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <Card className={cn("min-h-120", className)} style={style}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          {t("report.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label={t("report.total")} value={summary?.total} />
          <StatCard
            label={t("report.moving")}
            value={summary?.moving}
            accent="moving"
          />
          <StatCard
            label={t("report.stopped")}
            value={summary?.stopped}
            accent="stopped"
          />
          <StatCard
            label={t("report.signalLost")}
            value={summary?.signalLost}
            accent="signal_lost"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
          <Table containerClassName="h-full overflow-y-auto">
            <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
              <TableRow>
                <TableHead className="w-10 text-center font-normal text-muted-foreground">#</TableHead>
                <TableHead>{t("report.col.employee")}</TableHead>
                <TableHead className="text-right">{t("report.col.distance")}</TableHead>
                <TableHead className="text-right">{t("report.col.travelTime")}</TableHead>
                <TableHead className="text-right">{t("report.col.fuel")}</TableHead>
                <TableHead className="text-right">{t("report.col.fuelCost")}</TableHead>
                <TableHead>{t("report.col.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t("report.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m, i) => {
                  const meta = m.metaData as Record<string, string> | undefined
                  const displayName = meta?.userName ?? m.name ?? m.userId
                  const avatar = meta?.userAvatar ?? m.avatarUrl ?? undefined
                  return (
                    <TableRow
                      key={m.userId}
                      onClick={() => onRowClick?.(m)}
                      className={cn(
                        i % 2 === 1 ? "bg-muted/30" : "",
                        onRowClick && "cursor-pointer",
                      )}
                    >
                      <TableCell className="w-10 text-center text-xs tabular-nums text-muted-foreground">
                        {(page - 1) * pageSize + i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar src={avatar} alt={displayName} fallback={displayName} size={28} />
                          <span className="font-medium text-foreground">{displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(m.distance.value, 1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{m.travelTime.formatted}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(m.fuel.consumedLiters, 1)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(m.fuel.costVnd / 1_000_000, 2)}</TableCell>
                      <TableCell>
                        <Badge variant={m.status}>{m.statusLabel}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t("report.page")}{" "}
              <span className="font-semibold text-foreground">{page}</span>{" "}
              {t("report.of")} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {getPageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="flex h-8 w-6 items-center justify-center text-xs text-muted-foreground">…</span>
                ) : (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 min-w-8 px-2 text-xs" onClick={() => setPage(p as number)}>
                    {p}
                  </Button>
                ),
              )}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value?: number;
  accent?: "moving" | "stopped" | "signal_lost";
}

const STATUS_DOT: Record<string, string> = {
  moving: "bg-emerald-500",
  stopped: "bg-amber-400",
  signal_lost: "bg-muted-foreground/50",
};

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 shadow-whisper">
      <div className="flex items-center gap-1.5">
        {accent && (
          <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[accent] ?? "bg-muted-foreground/50")} />
        )}
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-semibold tracking-tight text-foreground">
        {value == null ? <Skeleton className="h-6 w-8" /> : value}
      </div>
    </div>
  );
}
