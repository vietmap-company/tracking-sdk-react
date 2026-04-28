import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn } from "@/lib/utils";

export interface ReportShellProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ReportShell({ title, subtitle, right, onBack, children, className }: ReportShellProps) {
  const { t } = useFleetwork();
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
                <ChevronLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            )}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">{children}</CardContent>
    </Card>
  );
}

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

export function PaginationBar({ page, totalPages, onChange }: PaginationBarProps) {
  const { t } = useFleetwork();
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {t("report.page")} <span className="font-semibold text-foreground">{page}</span> {t("report.of")} {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("report.prev")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="rounded-full"
        >
          {t("report.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TableSkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function EmptyRow({ colSpan }: { colSpan: number }) {
  const { t } = useFleetwork();
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        {t("report.empty")}
      </TableCell>
    </TableRow>
  );
}

export interface DateRangeBarProps {
  from: number;
  to: number;
  onChange: (range: { from: number; to: number }) => void;
}

export function DateRangeBar({ from, to, onChange }: DateRangeBarProps) {
  return (
    <DateRangePicker
      from={new Date(from)}
      to={new Date(to)}
      maxDate={new Date()}
      onChange={(r) => onChange({ from: r.from.getTime(), to: r.to.getTime() })}
    />
  );
}

export function formatTime(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("vi-VN");
}
