import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn, formatNumber } from "@/lib/utils";
import {
  useActivityTimeReport,
  useFuelDetailReport,
  useFuelSummaryReport,
  useTripDetailReport,
  useTripSummaryReport,
} from "@/hooks";
import {
  DateRangeBar,
  EmptyRow,
  PaginationBar,
  ReportShell,
  TableSkeletonRows,
  formatDate,
  formatTime,
} from "./shared";

export interface ReportRangeState {
  from: number;
  to: number;
}

export interface ReportViewProps {
  range: ReportRangeState;
  onRangeChange: (r: ReportRangeState) => void;
  onBack?: () => void;
  onError?: (err: Error) => void;
  pageSize?: number;
}

/* ─── Sort helpers ───────────────────────────────────────────────────────── */

interface SortState {
  key: string;
  desc: boolean;
}

function toggleSort(current: SortState, key: string): SortState {
  if (current.key === key) return { key, desc: !current.desc };
  return { key, desc: false };
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {active ? (
          sort.desc ? (
            <ArrowDown className="h-3 w-3 shrink-0 text-foreground" />
          ) : (
            <ArrowUp className="h-3 w-3 shrink-0 text-foreground" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}

/* ─────────────────────────────── Trip Summary ─────────────────────────────── */

export function TripSummaryReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 20,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({ key: "totalDistance", desc: true });

  const handleSort = React.useCallback((key: string) => {
    setSort((prev) => toggleSort(prev, key));
    setPage(1);
  }, []);

  const { data, isLoading, error } = useTripSummaryReport({
    ...range,
    page,
    pageSize,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const rows = data?.users ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const COLS = 6;

  return (
    <ReportShell
      title={t("reports.trip.title") + " — " + t("reports.tab.summary")}
      subtitle={t("reports.trip.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="totalDistance" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.stopTime")} sortKey="stopTime" sort={sort} onSort={handleSort} />
              <SortableHead label={`${t("reports.col.maxSpeed")} (km/h)`} sortKey="maxSpeed" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.tripDays")} sortKey="tripDays" sort={sort} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={pageSize} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              rows.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell className="font-medium">{r.userId}</TableCell>
                  <TableCell>{formatNumber(r.totalDistanceKm, 1)}</TableCell>
                  <TableCell>{r.travelTime.formatted}</TableCell>
                  <TableCell>{r.stopTime.formatted}</TableCell>
                  <TableCell>{formatNumber(r.maxSpeedKmh, 0)}</TableCell>
                  <TableCell>{r.tripDays}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </ReportShell>
  );
}

/* ─────────────────────────────── Trip Detail ─────────────────────────────── */

export function TripDetailReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 50,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({ key: "date", desc: true });

  const handleSort = React.useCallback((key: string) => {
    setSort((prev) => toggleSort(prev, key));
    setPage(1);
  }, []);

  const { data, isLoading, error } = useTripDetailReport({
    ...range,
    page,
    pageSize,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const rows = data?.trips ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;
  const COLS = 8;

  return (
    <ReportShell
      title={t("reports.trip.title") + " — " + t("reports.tab.detail")}
      subtitle={t("reports.trip.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <SortableHead label={t("reports.col.date")} sortKey="date" sort={sort} onSort={handleSort} />
              <TableHead>{t("reports.col.employee")}</TableHead>
              <TableHead>{t("reports.col.startTime")}</TableHead>
              <TableHead>{t("reports.col.endTime")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} />
              <TableHead>{t("reports.col.startLocation")}</TableHead>
              <TableHead>{t("reports.col.endLocation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={10} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              rows.map((r, i) => (
                <TableRow key={`${r.userId}-${r.date}-${i}`}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="font-medium">{r.userId}</TableCell>
                  <TableCell>{formatTime(r.startTime)}</TableCell>
                  <TableCell>{formatTime(r.endTime)}</TableCell>
                  <TableCell>{formatNumber(r.distanceKm, 1)}</TableCell>
                  <TableCell>{r.travelTime.formatted}</TableCell>
                  <TableCell
                    className="max-w-48 truncate text-muted-foreground"
                    title={r.startLocation?.address ?? undefined}
                  >
                    {r.startLocation?.address ?? "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-48 truncate text-muted-foreground"
                    title={r.endLocation?.address ?? undefined}
                  >
                    {r.endLocation?.address ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </ReportShell>
  );
}

/* ─────────────────────────────── Fuel Summary ─────────────────────────────── */

export function FuelSummaryReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 20,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({ key: "distanceKm", desc: true });

  const handleSort = React.useCallback((key: string) => {
    setSort((prev) => toggleSort(prev, key));
    setPage(1);
  }, []);

  const { data, isLoading, error } = useFuelSummaryReport({
    ...range,
    page,
    pageSize,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const rows = data?.users ?? [];
  const totals = data?.totals;
  const totalPages = data?.pagination.totalPages ?? 1;
  const COLS = 5;

  return (
    <ReportShell
      title={t("reports.fuel.title") + " — " + t("reports.tab.summary")}
      subtitle={t("reports.fuel.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.fuelLiters")} sortKey="fuelStandardLiters" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.totalCost")} sortKey="totalCostVnd" sort={sort} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={pageSize} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              <>
                {rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-medium">{r.userId}</TableCell>
                    <TableCell>{formatNumber(r.distanceKm, 1)}</TableCell>
                    <TableCell>{r.travelTime.formatted}</TableCell>
                    <TableCell>{formatNumber(r.fuelStandardLiters, 1)}</TableCell>
                    <TableCell>{r.totalCostFormatted}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell>{t("reports.totals")}</TableCell>
                    <TableCell>{formatNumber(totals.distanceKm, 1)}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{formatNumber(totals.fuelStandardLiters, 1)}</TableCell>
                    <TableCell>{totals.totalCostFormatted}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </ReportShell>
  );
}

/* ─────────────────────────────── Fuel Detail ─────────────────────────────── */

export function FuelDetailReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 50,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({ key: "date", desc: true });

  const handleSort = React.useCallback((key: string) => {
    setSort((prev) => toggleSort(prev, key));
    setPage(1);
  }, []);

  const { data, isLoading, error } = useFuelDetailReport({
    ...range,
    page,
    pageSize,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const rows = data?.trips ?? [];
  const totals = data?.totals;
  const totalPages = data?.pagination.totalPages ?? 1;
  const COLS = 7;

  return (
    <ReportShell
      title={t("reports.fuel.title") + " — " + t("reports.tab.detail")}
      subtitle={t("reports.fuel.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <SortableHead label={t("reports.col.date")} sortKey="date" sort={sort} onSort={handleSort} />
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.fuelLiters")} sortKey="fuelStandardLiters" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.pricePerLiter")} sortKey="fuelPricePerLiterVnd" sort={sort} onSort={handleSort} />
              <SortableHead label={t("reports.col.totalCost")} sortKey="totalCostVnd" sort={sort} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={10} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              <>
                {rows.map((r, i) => (
                  <TableRow key={`${r.userId}-${r.date}-${i}`}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="font-medium">{r.userId}</TableCell>
                    <TableCell>{formatNumber(r.distanceKm, 1)}</TableCell>
                    <TableCell>{r.travelTime.formatted}</TableCell>
                    <TableCell>{formatNumber(r.fuelStandardLiters, 1)}</TableCell>
                    <TableCell>{formatNumber(r.fuelPricePerLiterVnd, 0)}</TableCell>
                    <TableCell>{r.totalCostFormatted}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={2}>{t("reports.totals")}</TableCell>
                    <TableCell>{formatNumber(totals.distanceKm, 1)}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{formatNumber(totals.fuelStandardLiters, 1)}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{totals.totalCostFormatted}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </ReportShell>
  );
}

/* ─────────────────────────────── Activity Time ─────────────────────────────── */

export function ActivityTimeReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 50,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, error } = useActivityTimeReport({
    ...range,
    page,
    pageSize,
  });

  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const rows = data?.rows ?? [];
  const totals = data?.totals;
  const totalUsers = data?.totalUsers;
  const totalPages = data?.pagination.totalPages ?? 1;
  const COLS = 5;

  return (
    <ReportShell
      title={t("reports.activity.title")}
      subtitle={
        typeof totalUsers === "number"
          ? `${t("reports.activity.subtitle")} · ${totalUsers} ${t("reports.col.employee").toLowerCase()}`
          : t("reports.activity.subtitle")
      }
      onBack={onBack}
      right={
        <DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead>{t("reports.col.date")}</TableHead>
              <TableHead>{t("reports.col.hour")}</TableHead>
              <TableHead>{t("reports.col.activeCount")}</TableHead>
              <TableHead>{t("reports.col.inactiveCount")}</TableHead>
              <TableHead>{t("reports.col.distance")} (km)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={10} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              <>
                {rows.map((r, i) => (
                  <TableRow key={`${r.date}-${r.hour}-${i}`}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{String(r.hour).padStart(2, "0")}:00</TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {r.activeUserCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.inactiveUserCount}
                    </TableCell>
                    <TableCell>{formatNumber(r.totalDistanceKm, 1)}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="bg-muted/40 font-semibold">
                    <TableCell colSpan={4}>{t("reports.totals")}</TableCell>
                    <TableCell>{formatNumber(totals.totalDistanceKm, 1)}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </ReportShell>
  );
}
