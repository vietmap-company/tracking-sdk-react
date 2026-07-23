import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  useActivityTimeReport,
  useFuelDetailReport,
  useFuelSummaryReport,
  useTripDetailReport,
  useTripSummaryReport,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { resolveMemberName } from "@/lib/member-name";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import * as React from "react";
import {
  DateRangeBar,
  PaginationBar,
  ReportEmptyRow,
  ReportShell,
  ReportTableSkeletonRows,
  fmtDateShort,
  fmtTime,
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
  /** Chỉ lấy các user này (API lọc server-side). Bỏ trống = tất cả. */
  userIds?: string[];
  /** Drill-down: chỉ xem chi tiết của 1 user (dùng cho màn detail riêng). */
  userId?: string;
  /** Tên hiển thị của user đang xem chi tiết (cho tiêu đề màn detail). */
  userName?: string;
  /** Summary: click 1 user để mở màn chi tiết riêng của user đó. */
  onUserClick?: (userId: string, userName: string) => void;
}

interface SortState {
  key: string;
  desc: boolean;
}

function toggleSort(cur: SortState, key: string): SortState {
  return cur.key === key ? { key, desc: !cur.desc } : { key, desc: false };
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  right = true,
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (k: string) => void;
  right?: boolean;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th
      className={cn(
        "cursor-pointer select-none h-10 px-3 text-[11px] font-semibold text-muted-foreground align-middle whitespace-nowrap",
        right ? "text-right" : "text-left",
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className={cn("flex items-center gap-1", right && "justify-end")}>
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
    </th>
  );
}

const NUM = "text-right tabular-nums text-[13px]";
const TH =
  "h-10 px-3 text-[11px] font-semibold text-muted-foreground text-left  align-middle whitespace-nowrap";
const TH_EMP =
  "h-10 px-3 text-[11px] font-semibold text-muted-foreground text-left  align-middle whitespace-nowrap min-w-[160px]";
const TH_R =
  "h-10 px-3 text-[11px] font-semibold text-muted-foreground text-right align-middle whitespace-nowrap";
const IDX_H =
  "h-10 w-10 px-2 text-[11px] font-semibold text-muted-foreground text-center align-middle";
const IDX_C = "w-10 text-center text-[11px] text-muted-foreground tabular-nums";
const STRIPE = (i: number) => (i % 2 === 1 ? "bg-muted/20" : "");

/** Scroll wrapper — header sticky top, footer sticky bottom */
function ScrollTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-auto max-h-[60vh]">
      <table className="w-full min-w-[720px] caption-bottom text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

/** Icon "Xem chi tiết" ở cột Thao tác — điều hướng nhờ click cả dòng. */
function DetailLink({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-primary"
    >
      <Eye className="h-4 w-4" />
    </span>
  );
}

// ── Trip Summary ─────────────────────────────────────────────────────────────

export function TripSummaryReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 20,
  userIds,
  onUserClick,
}: ReportViewProps) {
  const { t, memberNameKey } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({
    key: "totalDistance",
    desc: true,
  });
  const handleSort = React.useCallback((k: string) => {
    setSort((p) => toggleSort(p, k));
    setPage(1);
  }, []);
  const { data, isLoading, isFetching, error } = useTripSummaryReport({
    ...range,
    page,
    pageSize,
    userIds,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });
  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);
  const rows = data?.users ?? [];
  const COLS = 8;

  return (
    <ReportShell
      loading={isFetching}
      title={t("reports.trip.title")}
      subtitle={t("reports.trip.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar
          from={range.from}
          to={range.to}
          onChange={onRangeChange}
        />
      }
    >
      <ScrollTable>
        <thead className="sticky top-0 z-20 bg-card border-b border-border/40">
          <tr>
            <th className={IDX_H}>#</th>
            <th className={TH_EMP}>{t("reports.col.employee")}</th>
            <SortableHead
              label={`${t("reports.col.distance")} (km)`}
              sortKey="totalDistance"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.travelTime")}
              sortKey="travelTime"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.stopTime")}
              sortKey="stopTime"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={`${t("reports.col.maxSpeed")} (km/h)`}
              sortKey="maxSpeed"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.tripDays") ?? "Số ngày"}
              sortKey="tripDays"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <th className={TH_R}>{t("reports.col.action")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <ReportTableSkeletonRows rows={rows.length || pageSize} cols={COLS} />
          ) : !rows.length ? (
            <ReportEmptyRow colSpan={COLS} />
          ) : (
            rows.map((r, i) => {
              const name = resolveMemberName(r.metaData, memberNameKey) ?? r.userId;
              return (
                <TableRow
                  key={r.userId}
                  className={cn(
                    "border-border/30 hover:bg-muted/30 cursor-pointer",
                    STRIPE(i),
                  )}
                  onClick={() => onUserClick?.(r.userId, name)}
                >
                  <TableCell className={IDX_C}>
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="text-[13px] font-medium">{name}</TableCell>
                  <TableCell className={NUM}>
                    {r.totalDistanceKm.toFixed(1)}
                  </TableCell>
                  <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                  <TableCell className={NUM}>{r.stopTime.formatted}</TableCell>
                  <TableCell className={NUM}>{r.maxSpeedKmh}</TableCell>
                  <TableCell className={NUM}>{r.tripDays}</TableCell>
                  <TableCell className="text-right">
                    <DetailLink label={t("reports.viewDetail")} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </ScrollTable>
      <PaginationBar
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onChange={setPage}
      />
    </ReportShell>
  );
}

// ── Trip Detail ──────────────────────────────────────────────────────────────

export function TripDetailReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 50,
  userIds,
  userId,
  userName,
}: ReportViewProps) {
  const { t, memberNameKey } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({
    key: "date",
    desc: true,
  });
  const handleSort = React.useCallback((k: string) => {
    setSort((p) => toggleSort(p, k));
    setPage(1);
  }, []);
  const { data, isLoading, isFetching, error } = useTripDetailReport({
    ...range,
    page,
    pageSize,
    userIds,
    userId,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });
  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);
  // Drill-down 1 user: ẩn cột nhân viên (đã biết là ai), tên hiện ở tiêu đề.
  const showEmployee = !userId;
  const rows = data?.trips ?? [];
  const COLS = showEmployee ? 9 : 8;

  return (
    <ReportShell
      loading={isFetching}
      title={userId ? (userName ?? userId) : `${t("reports.trip.title")} — ${t("reports.tab.detail")}`}
      subtitle={userId ? t("reports.trip.title") : t("reports.trip.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar
          from={range.from}
          to={range.to}
          onChange={onRangeChange}
        />
      }
    >
      <ScrollTable>
        <thead className="sticky top-0 z-20 bg-card border-b border-border/40">
          <tr>
            <th className={IDX_H}>#</th>
            <th className={TH}>{t("reports.col.date")}</th>
            {showEmployee && (
              <th className={TH_EMP}>{t("reports.col.employee")}</th>
            )}
            <th className={TH_R}>{t("reports.col.startTime")}</th>
            <th className={TH_R}>{t("reports.col.endTime")}</th>
            <SortableHead
              label={`${t("reports.col.distance")} (km)`}
              sortKey="distanceKm"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.travelTime")}
              sortKey="travelTime"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <th className={TH}>{t("reports.col.startLocation")}</th>
            <th className={TH}>{t("reports.col.endLocation")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <ReportTableSkeletonRows rows={rows.length || pageSize} cols={COLS} />
          ) : !rows.length ? (
            <ReportEmptyRow colSpan={COLS} />
          ) : (
            rows.map((r, i) => (
              <TableRow
                key={`${r.userId}-${r.date}-${i}`}
                className={cn("border-border/30 hover:bg-muted/30", STRIPE(i))}
              >
                <TableCell className={IDX_C}>
                  {(page - 1) * pageSize + i + 1}
                </TableCell>
                <TableCell className="text-[13px]">
                  {fmtDateShort(r.date)}
                </TableCell>
                {showEmployee && (
                  <TableCell className="text-[13px] font-medium">
                    {resolveMemberName(r.metaData, memberNameKey) ?? r.userId}
                  </TableCell>
                )}
                <TableCell className={NUM}>{fmtTime(r.startTime)}</TableCell>
                <TableCell className={NUM}>{fmtTime(r.endTime)}</TableCell>
                <TableCell className={NUM}>{r.distanceKm.toFixed(1)}</TableCell>
                <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                <TableCell
                  className="max-w-36 truncate text-[12px] text-muted-foreground"
                  title={r.startLocation?.address ?? ""}
                >
                  {r.startLocation?.address ?? "—"}
                </TableCell>
                <TableCell
                  className="max-w-36 truncate text-[12px] text-muted-foreground"
                  title={r.endLocation?.address ?? ""}
                >
                  {r.endLocation?.address ?? "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </ScrollTable>
      <PaginationBar
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onChange={setPage}
      />
    </ReportShell>
  );
}

// ── Fuel Summary ─────────────────────────────────────────────────────────────

export function FuelSummaryReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 20,
  userIds,
  onUserClick,
}: ReportViewProps) {
  const { t, memberNameKey } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({
    key: "distanceKm",
    desc: true,
  });
  const handleSort = React.useCallback((k: string) => {
    setSort((p) => toggleSort(p, k));
    setPage(1);
  }, []);
  const { data, isLoading, isFetching, error } = useFuelSummaryReport({
    ...range,
    page,
    pageSize,
    userIds,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });
  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);
  const rows = data?.users ?? [];
  const totals = data?.totals;
  const COLS = 7;

  return (
    <ReportShell
      loading={isFetching}
      title={t("reports.fuel.title")}
      subtitle={t("reports.fuel.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar
          from={range.from}
          to={range.to}
          onChange={onRangeChange}
        />
      }
    >
      <ScrollTable>
        <thead className="sticky top-0 z-20 bg-card border-b border-border/40">
          <tr>
            <th className={IDX_H}>#</th>
            <th className={TH_EMP}>{t("reports.col.employee")}</th>
            <SortableHead
              label={`${t("reports.col.distance")} (km)`}
              sortKey="distanceKm"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.travelTime")}
              sortKey="travelTime"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={`${t("reports.col.fuelLiters")} (L)`}
              sortKey="fuelStandardLiters"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.totalCost")}
              sortKey="totalCostVnd"
              sort={sort}
              onSort={handleSort}
              right={true}
              className="min-w-[120px]"
            />
            <th className={TH_R}>{t("reports.col.action")}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <ReportTableSkeletonRows rows={rows.length || pageSize} cols={COLS} />
          ) : !rows.length ? (
            <ReportEmptyRow colSpan={COLS} />
          ) : (
            rows.map((r, i) => {
              const name = resolveMemberName(r.metaData, memberNameKey) ?? r.userId;
              return (
                <TableRow
                  key={r.userId}
                  className={cn(
                    "border-border/30 hover:bg-muted/30 cursor-pointer",
                    STRIPE(i),
                  )}
                  onClick={() => onUserClick?.(r.userId, name)}
                >
                  <TableCell className={IDX_C}>
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="text-[13px] font-medium">{name}</TableCell>
                  <TableCell className={NUM}>{r.distanceKm.toFixed(1)}</TableCell>
                  <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                  <TableCell className={NUM}>
                    {r.fuelStandardLiters.toFixed(1)}
                  </TableCell>
                  <TableCell className={NUM}>{r.totalCostFormatted}</TableCell>
                  <TableCell className="text-right">
                    <DetailLink label={t("reports.viewDetail")} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
        {totals && (
          <tfoot className="sticky bottom-0 z-20 border-t-2 border-border/60 bg-muted/60 backdrop-blur-sm">
            <tr>
              <td />
              <td className="px-3 py-2.5 text-[13px] font-semibold">
                {t("reports.totals")}
              </td>
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.distanceKm.toFixed(1)}
              </td>
              <td className="px-3 py-2.5" />
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.fuelStandardLiters.toFixed(1)}
              </td>
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.totalCostFormatted}
              </td>
              <td className="px-3 py-2.5" />
            </tr>
          </tfoot>
        )}
      </ScrollTable>
      <PaginationBar
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onChange={setPage}
      />
    </ReportShell>
  );
}

// ── Fuel Detail ──────────────────────────────────────────────────────────────

export function FuelDetailReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 50,
  userIds,
  userId,
  userName,
}: ReportViewProps) {
  const { t, memberNameKey } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({
    key: "date",
    desc: true,
  });
  const handleSort = React.useCallback((k: string) => {
    setSort((p) => toggleSort(p, k));
    setPage(1);
  }, []);
  const { data, isLoading, isFetching, error } = useFuelDetailReport({
    ...range,
    page,
    pageSize,
    userIds,
    userId,
    sortBy: sort.key,
    sortDesc: sort.desc,
  });
  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);
  // Drill-down 1 user: ẩn cột nhân viên (đã biết là ai), tên hiện ở tiêu đề.
  const showEmployee = !userId;
  const rows = data?.trips ?? [];
  const totals = data?.totals;
  const COLS = showEmployee ? 8 : 7;

  return (
    <ReportShell
      loading={isFetching}
      title={userId ? (userName ?? userId) : `${t("reports.fuel.title")} — ${t("reports.tab.detail")}`}
      subtitle={userId ? t("reports.fuel.title") : t("reports.fuel.subtitle")}
      onBack={onBack}
      right={
        <DateRangeBar
          from={range.from}
          to={range.to}
          onChange={onRangeChange}
        />
      }
    >
      <ScrollTable>
        <thead className="sticky top-0 z-20 bg-card border-b border-border/40">
          <tr>
            <th className={IDX_H}>#</th>
            <th className={TH}>{t("reports.col.date")}</th>
            {showEmployee && (
              <th className={TH_EMP}>{t("reports.col.employee")}</th>
            )}
            <SortableHead
              label={`${t("reports.col.distance")} (km)`}
              sortKey="distanceKm"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.travelTime")}
              sortKey="travelTime"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={`${t("reports.col.fuelLiters")} (L)`}
              sortKey="fuelStandardLiters"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.pricePerLiter")}
              sortKey="fuelPricePerLiterVnd"
              sort={sort}
              onSort={handleSort}
              right={true}
            />
            <SortableHead
              label={t("reports.col.totalCost")}
              sortKey="totalCostVnd"
              sort={sort}
              onSort={handleSort}
              right={true}
              className="min-w-[120px]"
            />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <ReportTableSkeletonRows rows={rows.length || pageSize} cols={COLS} />
          ) : !rows.length ? (
            <ReportEmptyRow colSpan={COLS} />
          ) : (
            rows.map((r, i) => (
              <TableRow
                key={`${r.userId}-${r.date}-${i}`}
                className={cn("border-border/30 hover:bg-muted/30", STRIPE(i))}
              >
                <TableCell className={IDX_C}>
                  {(page - 1) * pageSize + i + 1}
                </TableCell>
                <TableCell className="text-[13px]">
                  {fmtDateShort(r.date)}
                </TableCell>
                {showEmployee && (
                  <TableCell className="text-[13px] font-medium">
                    {resolveMemberName(r.metaData, memberNameKey) ?? r.userId}
                  </TableCell>
                )}
                <TableCell className={NUM}>{r.distanceKm.toFixed(1)}</TableCell>
                <TableCell className={NUM}>{r.travelTime.formatted}</TableCell>
                <TableCell className={NUM}>
                  {r.fuelStandardLiters.toFixed(1)}
                </TableCell>
                <TableCell className={NUM}>
                  {r.fuelPricePerLiterVnd.toLocaleString()}
                </TableCell>
                <TableCell className={NUM}>{r.totalCostFormatted}</TableCell>
              </TableRow>
            ))
          )}
        </tbody>
        {totals && (
          <tfoot className="sticky bottom-0 z-20 border-t-2 border-border/60 bg-muted/60 backdrop-blur-sm">
            <tr>
              <td />
              <td colSpan={showEmployee ? 2 : 1} className="px-3 py-2.5 text-[13px] font-semibold">
                {t("reports.totals")}
              </td>
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.distanceKm.toFixed(1)}
              </td>
              <td className="px-3 py-2.5" />
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.fuelStandardLiters.toFixed(1)}
              </td>
              <td className="px-3 py-2.5" />
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.totalCostFormatted}
              </td>
            </tr>
          </tfoot>
        )}
      </ScrollTable>
      <PaginationBar
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onChange={setPage}
      />
    </ReportShell>
  );
}

// ── Activity Time ─────────────────────────────────────────────────────────────

export function ActivityTimeReport({
  range,
  onRangeChange,
  onBack,
  onError,
  pageSize = 10,
}: ReportViewProps) {
  const { t } = useFleetwork();
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching, error } = useActivityTimeReport({
    ...range,
    page,
    pageSize,
  });
  React.useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);
  const rows = data?.rows ?? [];
  const totals = data?.totals;
  const COLS = 6;

  return (
    <ReportShell
      loading={isFetching}
      title={t("reports.activity.title")}
      subtitle={
        typeof data?.totalUsers === "number"
          ? `${t("reports.activity.subtitle")} · ${data.totalUsers} nhân viên`
          : t("reports.activity.subtitle")
      }
      onBack={onBack}
      right={
        <DateRangeBar
          from={range.from}
          to={range.to}
          onChange={onRangeChange}
        />
      }
    >
      <ScrollTable>
        <thead className="sticky top-0 z-20 bg-card border-b border-border/40">
          <tr>
            <th className={IDX_H}>#</th>
            <th className={TH}>{t("reports.col.date")}</th>
            <th className={TH_R}>{t("reports.col.hour")}</th>
            <th className={TH_R}>{t("reports.col.activeCount")}</th>
            <th className={TH_R}>{t("reports.col.inactiveCount")}</th>
            <th className={TH_R}>{t("reports.col.distance")} (km)</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <ReportTableSkeletonRows rows={rows.length || pageSize} cols={COLS} />
          ) : !rows.length ? (
            <ReportEmptyRow colSpan={COLS} />
          ) : (
            rows.map((r, i) => (
              <TableRow
                key={`${r.date}-${r.hour}-${i}`}
                className={cn("border-border/30 hover:bg-muted/30", STRIPE(i))}
              >
                <TableCell className={IDX_C}>
                  {(page - 1) * pageSize + i + 1}
                </TableCell>
                <TableCell className="text-[13px]">
                  {fmtDateShort(r.date)}
                </TableCell>
                <TableCell className="text-right text-[13px] tabular-nums">
                  {String(r.hour).padStart(2, "0")}:00
                </TableCell>
                <TableCell className="text-right text-[13px] tabular-nums font-medium text-emerald-600">
                  {r.activeUserCount}
                </TableCell>
                <TableCell className="text-right text-[13px] tabular-nums text-muted-foreground">
                  {r.inactiveUserCount}
                </TableCell>
                <TableCell className={NUM}>
                  {r.totalDistanceKm.toFixed(1)}
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
        {totals && (
          <tfoot className="sticky bottom-0 z-20 border-t-2 border-border/60 bg-muted/60 backdrop-blur-sm">
            <tr>
              <td />
              <td colSpan={4} className="px-3 py-2.5 text-[13px] font-semibold">
                {t("reports.totals")}
              </td>
              <td className={`${NUM} px-3 py-2.5 font-semibold`}>
                {totals.totalDistanceKm.toFixed(1)}
              </td>
            </tr>
          </tfoot>
        )}
      </ScrollTable>
      <PaginationBar
        page={page}
        totalPages={data?.pagination.totalPages ?? 1}
        onChange={setPage}
      />
    </ReportShell>
  );
}

