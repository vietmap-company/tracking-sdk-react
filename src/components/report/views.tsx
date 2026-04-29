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

const NUM = "text-right tabular-nums";
const INDEX_HEAD = "w-10 text-center text-muted-foreground font-normal";
const INDEX_CELL = "w-10 text-center text-xs text-muted-foreground tabular-nums";

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
  const COLS = 7;

  return (
    <ReportShell
      title={t("reports.trip.title") + " — " + t("reports.tab.summary")}
      subtitle={t("reports.trip.subtitle")}
      onBack={onBack}
      right={<DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead className={INDEX_HEAD}>#</TableHead>
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="totalDistance" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.stopTime")} sortKey="stopTime" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={`${t("reports.col.maxSpeed")} (km/h)`} sortKey="maxSpeed" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.tripDays")} sortKey="tripDays" sort={sort} onSort={handleSort} className={NUM} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={pageSize} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              rows.map((r, i) => (
                <TableRow key={r.userId} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                  <TableCell className={INDEX_CELL}>{(page - 1) * pageSize + i + 1}</TableCell>
                  <TableCell className="font-medium">{r.userId}</TableCell>
                  <TableCell className={NUM}>{formatNumber(r.totalDistanceKm, 1)}</TableCell>
                  <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                  <TableCell className={NUM}>{r.stopTime.formatted}</TableCell>
                  <TableCell className={NUM}>{formatNumber(r.maxSpeedKmh, 0)}</TableCell>
                  <TableCell className={NUM}>{r.tripDays}</TableCell>
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
  const COLS = 9;

  return (
    <ReportShell
      title={t("reports.trip.title") + " — " + t("reports.tab.detail")}
      subtitle={t("reports.trip.subtitle")}
      onBack={onBack}
      right={<DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead className={INDEX_HEAD}>#</TableHead>
              <SortableHead label={t("reports.col.date")} sortKey="date" sort={sort} onSort={handleSort} />
              <TableHead>{t("reports.col.employee")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.startTime")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.endTime")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} className={NUM} />
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
                <TableRow key={`${r.userId}-${r.date}-${i}`} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                  <TableCell className={INDEX_CELL}>{(page - 1) * pageSize + i + 1}</TableCell>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="font-medium">{r.userId}</TableCell>
                  <TableCell className={NUM}>{formatTime(r.startTime)}</TableCell>
                  <TableCell className={NUM}>{formatTime(r.endTime)}</TableCell>
                  <TableCell className={NUM}>{formatNumber(r.distanceKm, 1)}</TableCell>
                  <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground" title={r.startLocation?.address ?? undefined}>
                    {r.startLocation?.address ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground" title={r.endLocation?.address ?? undefined}>
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
  const COLS = 6;

  return (
    <ReportShell
      title={t("reports.fuel.title") + " — " + t("reports.tab.summary")}
      subtitle={t("reports.fuel.subtitle")}
      onBack={onBack}
      right={<DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead className={INDEX_HEAD}>#</TableHead>
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={`${t("reports.col.fuelLiters")} (L)`} sortKey="fuelStandardLiters" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.totalCost")} sortKey="totalCostVnd" sort={sort} onSort={handleSort} className={NUM} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rows={pageSize} cols={COLS} />
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={COLS} />
            ) : (
              <>
                {rows.map((r, i) => (
                  <TableRow key={r.userId} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell className={INDEX_CELL}>{(page - 1) * pageSize + i + 1}</TableCell>
                    <TableCell className="font-medium">{r.userId}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.distanceKm, 1)}</TableCell>
                    <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.fuelStandardLiters, 1)}</TableCell>
                    <TableCell className={NUM}>{r.totalCostFormatted}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="border-t-2 bg-muted/50 font-semibold">
                    <TableCell />
                    <TableCell>{t("reports.totals")}</TableCell>
                    <TableCell className={NUM}>{formatNumber(totals.distanceKm, 1)}</TableCell>
                    <TableCell className={NUM}>—</TableCell>
                    <TableCell className={NUM}>{formatNumber(totals.fuelStandardLiters, 1)}</TableCell>
                    <TableCell className={NUM}>{totals.totalCostFormatted}</TableCell>
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
  const COLS = 8;

  return (
    <ReportShell
      title={t("reports.fuel.title") + " — " + t("reports.tab.detail")}
      subtitle={t("reports.fuel.subtitle")}
      onBack={onBack}
      right={<DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead className={INDEX_HEAD}>#</TableHead>
              <SortableHead label={t("reports.col.date")} sortKey="date" sort={sort} onSort={handleSort} />
              <TableHead>{t("reports.col.employee")}</TableHead>
              <SortableHead label={`${t("reports.col.distance")} (km)`} sortKey="distanceKm" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.travelTime")} sortKey="travelTime" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={`${t("reports.col.fuelLiters")} (L)`} sortKey="fuelStandardLiters" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.pricePerLiter")} sortKey="fuelPricePerLiterVnd" sort={sort} onSort={handleSort} className={NUM} />
              <SortableHead label={t("reports.col.totalCost")} sortKey="totalCostVnd" sort={sort} onSort={handleSort} className={NUM} />
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
                  <TableRow key={`${r.userId}-${r.date}-${i}`} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell className={INDEX_CELL}>{(page - 1) * pageSize + i + 1}</TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="font-medium">{r.userId}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.distanceKm, 1)}</TableCell>
                    <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.fuelStandardLiters, 1)}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.fuelPricePerLiterVnd, 0)}</TableCell>
                    <TableCell className={NUM}>{r.totalCostFormatted}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="border-t-2 bg-muted/50 font-semibold">
                    <TableCell />
                    <TableCell colSpan={2}>{t("reports.totals")}</TableCell>
                    <TableCell className={NUM}>{formatNumber(totals.distanceKm, 1)}</TableCell>
                    <TableCell className={NUM}>—</TableCell>
                    <TableCell className={NUM}>{formatNumber(totals.fuelStandardLiters, 1)}</TableCell>
                    <TableCell className={NUM}>—</TableCell>
                    <TableCell className={NUM}>{totals.totalCostFormatted}</TableCell>
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
  const COLS = 6;

  return (
    <ReportShell
      title={t("reports.activity.title")}
      subtitle={
        typeof totalUsers === "number"
          ? `${t("reports.activity.subtitle")} · ${totalUsers} ${t("reports.col.employee").toLowerCase()}`
          : t("reports.activity.subtitle")
      }
      onBack={onBack}
      right={<DateRangeBar from={range.from} to={range.to} onChange={onRangeChange} />}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
        <Table containerClassName="max-h-[60vh] overflow-y-auto">
          <TableHeader className="sticky top-0 z-10 border-b border-border bg-card">
            <TableRow>
              <TableHead className={INDEX_HEAD}>#</TableHead>
              <TableHead>{t("reports.col.date")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.hour")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.activeCount")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.inactiveCount")}</TableHead>
              <TableHead className={NUM}>{t("reports.col.distance")} (km)</TableHead>
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
                  <TableRow key={`${r.date}-${r.hour}-${i}`} className={i % 2 === 1 ? "bg-muted/30" : ""}>
                    <TableCell className={INDEX_CELL}>{(page - 1) * pageSize + i + 1}</TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className={NUM}>{String(r.hour).padStart(2, "0")}:00</TableCell>
                    <TableCell className={cn(NUM, "font-medium text-emerald-600")}>{r.activeUserCount}</TableCell>
                    <TableCell className={cn(NUM, "text-muted-foreground")}>{r.inactiveUserCount}</TableCell>
                    <TableCell className={NUM}>{formatNumber(r.totalDistanceKm, 1)}</TableCell>
                  </TableRow>
                ))}
                {totals && (
                  <TableRow className="border-t-2 bg-muted/50 font-semibold">
                    <TableCell />
                    <TableCell colSpan={4}>{t("reports.totals")}</TableCell>
                    <TableCell className={NUM}>{formatNumber(totals.totalDistanceKm, 1)}</TableCell>
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
