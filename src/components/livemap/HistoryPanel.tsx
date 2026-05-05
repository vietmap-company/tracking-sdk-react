import {
  STATUS_AVATAR_BG,
  STATUS_BADGE,
  STATUS_DOT_PLAIN,
} from "@/components/shared";
import { DatePicker } from "@/components/ui/date-picker";
import { LiveMapController } from "@/controllers/LiveMapController";
import type { GpsPoint, MemberStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { addDays, startOfDay, subDays } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Route,
  X,
} from "lucide-react";
import * as React from "react";
import type { HistoryGroup, Segment } from "./history.types";
import { GPS_LOST_MS } from "./history.types";
import { STATUS_HEX } from "./statusColors";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function fmtTimeShort(ts: number) {
  return new Date(ts).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  if (h > 0) return `${h}g ${m}p`;
  if (m > 0) return `${m}p ${sec}s`;
  return `${sec}s`;
}
export function fmtDist(meters: number) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000,
    dLat = ((lat2 - lat1) * Math.PI) / 180,
    dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeSegments(pts: GpsPoint[]): Segment[] {
  if (pts.length < 2) return [];
  const segs: Segment[] = [];
  let i = 0;
  while (i < pts.length - 1) {
    const gap = pts[i + 1].time - pts[i].time;
    if (gap > GPS_LOST_MS) {
      segs.push({
        type: "lostGps",
        startTs: pts[i].time,
        endTs: pts[i + 1].time,
        durationMs: gap,
      });
      i++;
      continue;
    }
    const type = pts[i].speed > 0 ? "moving" : "stopped";
    const start = i;
    while (
      i < pts.length - 1 &&
      pts[i].speed > 0 === pts[start].speed > 0 &&
      pts[i + 1].time - pts[i].time <= GPS_LOST_MS
    )
      i++;
    segs.push({
      type,
      startTs: pts[start].time,
      endTs: pts[i].time,
      durationMs: pts[i].time - pts[start].time,
    });
  }
  return segs;
}

export function computeGroups(pts: GpsPoint[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let i = 0;
  while (i < pts.length) {
    if (i > 0) {
      const gap = pts[i].time - pts[i - 1].time;
      if (gap > GPS_LOST_MS)
        groups.push({
          type: "lostGps",
          startTs: pts[i - 1].time,
          endTs: pts[i].time,
          durationMs: gap,
        });
    }
    if (pts[i].speed === 0) {
      const start = i;
      while (
        i < pts.length &&
        pts[i].speed === 0 &&
        (i === start || pts[i].time - pts[i - 1].time <= GPS_LOST_MS)
      )
        i++;
      const end = i - 1,
        dur = end > start ? pts[end].time - pts[start].time : 0;
      if (end - start >= 2)
        groups.push({
          type: "stopped",
          startIdx: start,
          endIdx: end,
          pts: pts.slice(start, end + 1),
          durationMs: dur,
        });
      else
        for (let j = start; j <= end; j++)
          groups.push({ type: "moving", idx: j, pt: pts[j] });
    } else {
      groups.push({ type: "moving", idx: i, pt: pts[i] });
      i++;
    }
  }
  return groups;
}

// ── Timeline bar ──────────────────────────────────────────────────────────────

function TimelineBar({
  pts,
  segments,
  totalMs,
}: {
  pts: GpsPoint[];
  segments: Segment[];
  totalMs: number;
}) {
  const { t } = useFleetwork();
  const first = pts[0],
    last = pts[pts.length - 1];
  const intervalMs =
    totalMs <= 2 * 3_600_000
      ? 30 * 60_000
      : totalMs <= 6 * 3_600_000
        ? 60 * 60_000
        : 2 * 3_600_000;
  const ticks: { pct: number; label: string }[] = [];
  const firstTick = Math.ceil(first.time / intervalMs) * intervalMs;
  for (let tick = firstTick; tick < last.time; tick += intervalMs) {
    ticks.push({
      pct: ((tick - first.time) / totalMs) * 100,
      label: fmtTimeShort(tick),
    });
  }
  const COLOR: Record<string, string> = {
    moving: STATUS_HEX.moving,
    stopped: STATUS_HEX.stopped,
    lostGps: STATUS_HEX.signal_lost,
  };
  const totals: Record<string, number> = { moving: 0, stopped: 0, lostGps: 0 };
  segments.forEach((s) => {
    totals[s.type] = (totals[s.type] ?? 0) + s.durationMs;
  });

  return (
    <div className="px-4 py-3 border-b border-border/40 shrink-0 bg-muted/20">
      {/* Time labels */}
      <div className="relative mb-1.5 h-4 text-[9px] text-muted-foreground/70">
        <span className="absolute left-0">{fmtTimeShort(first.time)}</span>
        {ticks.map((tk) => (
          <span
            key={tk.pct}
            className="absolute -translate-x-1/2"
            style={{ left: `${tk.pct.toFixed(1)}%` }}
          >
            {tk.label}
          </span>
        ))}
        <span className="absolute right-0">{fmtTimeShort(last.time)}</span>
      </div>
      {/* Bar */}
      <div className="flex h-5 overflow-hidden rounded-lg shadow-inner bg-muted/50">
        {segments.map((sg, i) => (
          <div
            key={i}
            title={`${sg.type === "moving" ? "Di chuyển" : sg.type === "stopped" ? "Dừng" : "Mất GPS"}: ${fmtDuration(sg.durationMs)}`}
            style={{
              width: `${Math.max((sg.durationMs / totalMs) * 100, 0.5).toFixed(2)}%`,
              background: COLOR[sg.type],
            }}
            className="transition-opacity hover:opacity-80"
          />
        ))}
      </div>
      {/* Legend chips */}
      <div className="mt-2 flex flex-wrap gap-2">
        {(
          [
            ["moving", t("history.moving")],
            ["stopped", t("history.stopped")],
            ["lostGps", t("history.lostGps")],
          ] as [string, string][]
        )
          .filter(([k]) => totals[k] > 0)
          .map(([k, lbl]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border/50 px-2 py-0.5 text-[10px] font-medium text-foreground"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: COLOR[k] }}
              />
              {lbl} · {fmtDuration(totals[k])}
            </span>
          ))}
      </div>
    </div>
  );
}

// ── HistoryRow ────────────────────────────────────────────────────────────────

function HistoryRowItem({
  group,
  activeIndex,
  expanded,
  onToggle,
  onSeek,
}: {
  group: HistoryGroup;
  activeIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onSeek: (idx: number) => void;
}) {
  if (group.type === "lostGps") {
    return (
      <div className="flex items-center gap-2.5 border-b border-border/30 bg-muted/30 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
        <span className="text-[11px] italic text-muted-foreground">
          Mất GPS
        </span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground">
          {fmtDuration(group.durationMs)}
        </span>
      </div>
    );
  }

  if (group.type === "stopped") {
    const hasActive =
      activeIndex >= group.startIdx && activeIndex <= group.endIdx;
    return (
      <>
        {/* Stop group header */}
        <div
          onClick={onToggle}
          className={cn(
            "flex cursor-pointer items-center gap-2.5 border-b border-border/30 px-4 py-2.5 transition-colors",
            hasActive
              ? "bg-amber-50 dark:bg-amber-950/20"
              : "hover:bg-amber-50/50 dark:hover:bg-amber-950/10",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
              hasActive
                ? "bg-amber-200 text-amber-700"
                : "bg-amber-100 text-amber-600",
            )}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[12px] font-semibold text-amber-700">
                Dừng {fmtDuration(group.durationMs)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 pl-4">
              {fmtTimeShort(group.pts[0].time)} →{" "}
              {fmtTimeShort(group.pts[group.pts.length - 1].time)}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {group.pts.length} điểm
          </span>
        </div>
        {/* Expanded child rows */}
        {expanded &&
          group.pts.map((p, pi) => {
            const idx = group.startIdx + pi;
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                data-idx={idx}
                onClick={() => onSeek(idx)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-border/20 py-2 pl-12 pr-4 transition-colors",
                  isActive
                    ? "bg-primary/8 border-l-2 border-l-primary"
                    : "hover:bg-muted/40 border-l-2 border-l-transparent",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    isActive
                      ? "font-semibold text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {fmtTime(p.time)}
                </span>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  — km/h
                </span>
              </div>
            );
          })}
      </>
    );
  }

  // Moving point
  const isActive = group.idx === activeIndex;
  const isMoving = group.pt.speed > 0;
  return (
    <div
      data-idx={group.idx}
      onClick={() => onSeek(group.idx)}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b border-border/20 py-2 px-4 transition-colors",
        isActive
          ? "bg-primary/8 border-l-2 border-l-primary"
          : "hover:bg-muted/40 border-l-2 border-l-transparent",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isMoving ? "bg-emerald-500" : "bg-amber-400",
        )}
      />
      <span
        className={cn(
          "font-mono text-[11px] tabular-nums",
          isActive ? "font-semibold text-primary" : "text-muted-foreground",
        )}
      >
        {fmtTime(group.pt.time)}
      </span>
      {isMoving && (
        <span className="ml-auto text-[11px] font-medium text-emerald-600 tabular-nums flex items-center gap-1">
          <Navigation className="h-3 w-3" />
          {Math.round(group.pt.speed)} km/h
        </span>
      )}
    </div>
  );
}

// ── HistoryPanel ──────────────────────────────────────────────────────────────

export interface HistoryPanelProps {
  member: MemberStatus;
  onClose: () => void;
  onHistoryLoaded: (points: GpsPoint[]) => void;
  playIndex: number;
  onSeek: (index: number) => void;
}

export function HistoryPanel({
  member,
  onClose,
  onHistoryLoaded,
  playIndex,
  onSeek,
}: HistoryPanelProps) {
  const { t } = useFleetwork();
  const [historyDate, setHistoryDate] = React.useState<Date>(() => new Date());
  const [historyPoints, setHistoryPoints] = React.useState<GpsPoint[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState(new Set<number>());
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const onHistoryLoadedRef = React.useRef(onHistoryLoaded);
  React.useEffect(() => {
    onHistoryLoadedRef.current = onHistoryLoaded;
  }, [onHistoryLoaded]);

  const loadHistory = React.useCallback(
    async (date: Date) => {
      setHistoryLoading(true);
      setHistoryPoints([]);
      setExpandedGroups(new Set());
      try {
        const startMs = new Date(date).setHours(0, 0, 0, 0);
        const endMs = new Date(date).setHours(23, 59, 59, 999);
        const pts = await LiveMapController.getHistoryRoute(
          member.userId,
          startMs,
          endMs,
        );
        setHistoryPoints(pts);
        onHistoryLoadedRef.current(pts);
      } catch {
        setHistoryPoints([]);
        onHistoryLoadedRef.current([]);
      }
      setHistoryLoading(false);
    },
    [member.userId],
  );

  React.useEffect(() => {
    const today = new Date();
    setHistoryDate(today);
    setHistoryPoints([]);
    setExpandedGroups(new Set());
    loadHistory(today);
  }, [member.userId]);

  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(
      `[data-idx="${playIndex}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [playIndex]);

  const pts = historyPoints;
  const totalMs = pts.length > 1 ? pts[pts.length - 1].time - pts[0].time : 0;
  const totalDistM = React.useMemo(() => {
    let d = 0;
    for (let i = 1; i < pts.length; i++)
      d += haversineM(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    return d;
  }, [pts]);
  const segments = React.useMemo(() => computeSegments(pts), [pts]);
  const groups = React.useMemo(() => computeGroups(pts), [pts]);
  const toggleGroup = (gi: number) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(gi) ? next.delete(gi) : next.add(gi);
      return next;
    });

  const initials = (member.name ?? member.userId).slice(0, 2).toUpperCase();

  return (
    <div className="absolute top-3 bottom-3 right-3 z-20 flex w-[300px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-xl">
      {/* ── Member header ─────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white",
                STATUS_AVATAR_BG[member.status],
              )}
            >
              {initials}
            </div>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                STATUS_DOT_PLAIN[member.status],
              )}
            />
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
              {member.name ?? member.userId}
            </p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                STATUS_BADGE[member.status],
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  STATUS_DOT_PLAIN[member.status],
                )}
              />
              {member.statusLabel}
            </span>
          </div>
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Date navigator ────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-2.5 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const p = subDays(historyDate, 1);
              setHistoryDate(p);
              loadHistory(p);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <DatePicker
            value={historyDate}
            onChange={(d) => {
              setHistoryDate(d);
              loadHistory(d);
            }}
            maxDate={new Date()}
            formatLabel={(d) =>
              new Intl.DateTimeFormat("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(d)
            }
            className="h-7 flex-1 rounded-lg text-[12px] font-medium"
          />

          <button
            type="button"
            onClick={() => {
              const n = addDays(historyDate, 1);
              setHistoryDate(n);
              loadHistory(n);
            }}
            disabled={startOfDay(historyDate) >= startOfDay(new Date())}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Loading */}
        {historyLoading && (
          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-[12px] text-muted-foreground">
              {t("history.loading")}
            </span>
          </div>
        )}

        {/* Empty */}
        {!historyLoading && pts.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                {t("history.noData")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Không có dữ liệu di chuyển
                <br />
                trong ngày đã chọn
              </p>
            </div>
          </div>
        )}

        {/* Data */}
        {!historyLoading && pts.length > 0 && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 divide-x divide-border/40 border-b border-border/40 shrink-0">
              <div className="flex flex-col items-center gap-0.5 py-3">
                <Route className="h-4 w-4 text-primary mb-0.5" />
                <p className="text-[13px] font-bold text-foreground tabular-nums">
                  {fmtDist(totalDistM)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {t("history.distance")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-0.5 py-3">
                <Clock3 className="h-4 w-4 text-violet-500 mb-0.5" />
                <p className="text-[13px] font-bold text-foreground tabular-nums">
                  {fmtDuration(totalMs)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {t("history.duration")}
                </p>
              </div>
              {/* GPS points stat removed */}
            </div>

            {/* Timeline */}
            {segments.length > 0 && (
              <TimelineBar pts={pts} segments={segments} totalMs={totalMs} />
            )}

            {/* Column header */}
            <div className="flex items-center gap-3 border-b border-border/40 bg-muted/30 px-4 py-1.5 shrink-0">
              <span className="w-4 shrink-0" />
              <span className="text-[10px] font-semibold text-muted-foreground">
                Giờ
              </span>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
                Tốc độ
              </span>
            </div>

            {/* Scrollable list */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {groups.map((g, gi) => (
                <HistoryRowItem
                  key={gi}
                  group={g}
                  activeIndex={playIndex}
                  expanded={expandedGroups.has(gi)}
                  onToggle={() => toggleGroup(gi)}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
