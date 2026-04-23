import * as React from "react";
import { addDays, isSameDay, isToday, startOfDay, subDays } from "date-fns";
import {
  X,
  Route,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { LiveMapController } from "@/controllers/LiveMapController";
import type { GpsPoint, MemberStatus } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GPS_LOST_MS = 5 * 60 * 1000;

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
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
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
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Segment computation ──────────────────────────────────────────────────────

interface Segment {
  type: "moving" | "stopped" | "lostGps";
  startTs: number;
  endTs: number;
  durationMs: number;
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
    ) {
      i++;
    }
    segs.push({
      type,
      startTs: pts[start].time,
      endTs: pts[i].time,
      durationMs: pts[i].time - pts[start].time,
    });
  }
  return segs;
}

// ─── Group computation for the point list ────────────────────────────────────

interface MoveGroup {
  type: "moving";
  idx: number;
  pt: GpsPoint;
}

interface StopGroup {
  type: "stopped";
  startIdx: number;
  endIdx: number;
  pts: GpsPoint[];
  durationMs: number;
}

interface LostGroup {
  type: "lostGps";
  startTs: number;
  endTs: number;
  durationMs: number;
}

export type HistoryGroup = MoveGroup | StopGroup | LostGroup;

export function computeGroups(pts: GpsPoint[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let i = 0;
  while (i < pts.length) {
    if (i > 0) {
      const gap = pts[i].time - pts[i - 1].time;
      if (gap > GPS_LOST_MS) {
        groups.push({
          type: "lostGps",
          startTs: pts[i - 1].time,
          endTs: pts[i].time,
          durationMs: gap,
        });
      }
    }
    if (pts[i].speed === 0) {
      const start = i;
      while (
        i < pts.length &&
        pts[i].speed === 0 &&
        (i === start || pts[i].time - pts[i - 1].time <= GPS_LOST_MS)
      ) {
        i++;
      }
      const end = i - 1;
      const dur = end > start ? pts[end].time - pts[start].time : 0;
      if (end - start >= 2) {
        groups.push({
          type: "stopped",
          startIdx: start,
          endIdx: end,
          pts: pts.slice(start, end + 1),
          durationMs: dur,
        });
      } else {
        for (let j = start; j <= end; j++) {
          groups.push({ type: "moving", idx: j, pt: pts[j] });
        }
      }
    } else {
      groups.push({ type: "moving", idx: i, pt: pts[i] });
      i++;
    }
  }
  return groups;
}

// ─── Timeline bar ─────────────────────────────────────────────────────────────

function TimelineBar({
  pts,
  segments,
  totalMs,
}: {
  pts: GpsPoint[];
  segments: Segment[];
  totalMs: number;
}) {
  const first = pts[0];
  const last = pts[pts.length - 1];

  // Build time label ticks
  const intervalMs =
    totalMs <= 2 * 3_600_000
      ? 30 * 60_000
      : totalMs <= 6 * 3_600_000
        ? 60 * 60_000
        : 2 * 3_600_000;

  const ticks: { pct: number; label: string }[] = [];
  const firstTick = Math.ceil(first.time / intervalMs) * intervalMs;
  for (let t = firstTick; t < last.time; t += intervalMs) {
    ticks.push({
      pct: ((t - first.time) / totalMs) * 100,
      label: fmtTimeShort(t),
    });
  }

  const COLOR: Record<Segment["type"], string> = {
    moving: "#10b981",
    stopped: "#f59e0b",
    lostGps: "#94a3b8",
  };

  // Segment duration totals for legend
  const totals = { moving: 0, stopped: 0, lostGps: 0 };
  segments.forEach((s) => {
    totals[s.type] += s.durationMs;
  });

  return (
    <div className="border-b border px-3 py-2.5 flex-shrink-0">
      {/* Time labels */}
      <div className="relative mb-1 h-4 text-[9px] text-muted-foreground">
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
      {/* Segment bar */}
      <div className="flex h-4 overflow-hidden rounded-md">
        {segments.map((sg, i) => (
          <div
            key={i}
            title={fmtDuration(sg.durationMs)}
            style={{
              width: `${Math.max((sg.durationMs / totalMs) * 100, 0.3).toFixed(2)}%`,
              background: COLOR[sg.type],
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {(
          [
            ["#10b981", "moving", "Di chuyển"],
            ["#f59e0b", "stopped", "Dừng"],
            ["#94a3b8", "lostGps", "Mất GPS"],
          ] as [string, keyof typeof totals, string][]
        )
          .filter(([, k]) => totals[k] > 0)
          .map(([c, k, lbl]) => (
            <span
              key={k}
              className="flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: c }}
              />
              {lbl} {fmtDuration(totals[k])}
            </span>
          ))}
      </div>
    </div>
  );
}

// ─── Single row in the points list ───────────────────────────────────────────

function HistoryRowItem({
  group,
  groupIndex: _groupIndex,
  activeIndex,
  expanded,
  onToggle,
  onSeek,
}: {
  group: HistoryGroup;
  groupIndex: number;
  activeIndex: number;
  expanded: boolean;
  onToggle: () => void;
  onSeek: (idx: number) => void;
}) {
  if (group.type === "lostGps") {
    return (
      <div className="flex items-center gap-2.5 border-b bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
        <span className="italic">Mất GPS</span>
        <span className="ml-auto font-medium">
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
        {/* Group header */}
        <div
          className={cn(
            "flex cursor-pointer items-center gap-3 border-b px-4 py-2.5 transition-colors hover:bg-amber-50/60",
            hasActive ? "bg-amber-50" : "bg-card",
          )}
          onClick={onToggle}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <div className="min-w-0 flex-1">
            <span className="text-[12px] font-semibold text-amber-700">
              Dừng {fmtDuration(group.durationMs)}
            </span>
            <span className="ml-2 text-[11px] text-amber-500/80">
              {group.pts.length} điểm
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {fmtTimeShort(group.pts[0].time)}
          </span>
        </div>
        {/* Child rows */}
        {expanded &&
          group.pts.map((p, pi) => {
            const idx = group.startIdx + pi;
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                data-idx={idx}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b py-2 pl-14 pr-4 transition-colors hover:bg-muted/70",
                  isActive && "bg-primary/10",
                )}
                onClick={() => onSeek(idx)}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                <span
                  className={cn(
                    "w-[72px] shrink-0 font-mono text-[11px]",
                    isActive
                      ? "font-semibold text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {fmtTime(p.time)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  — km/h
                </span>
              </div>
            );
          })}
      </>
    );
  }

  // moving point
  const isActive = group.idx === activeIndex;
  const isMoving = group.pt.speed > 0;
  const dot = isMoving ? "bg-emerald-500" : "bg-amber-400";
  return (
    <div
      data-idx={group.idx}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b py-2 px-4 transition-colors hover:bg-muted/70",
        isActive && "bg-primary/10",
      )}
      onClick={() => onSeek(group.idx)}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
      <span
        className={cn(
          "w-[72px] shrink-0 font-mono text-[11px]",
          isActive ? "font-semibold text-primary" : "text-muted-foreground",
        )}
      >
        {fmtTime(group.pt.time)}
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px]",
          isMoving ? "text-emerald-600 font-medium" : "text-muted-foreground",
        )}
      >
        {isMoving ? `${Math.round(group.pt.speed)} km/h` : "—"}
      </span>
    </div>
  );
}

// ─── Main HistoryPanel ────────────────────────────────────────────────────────

export interface HistoryPanelProps {
  member: MemberStatus;
  onClose: () => void;
  onHistoryLoaded: (points: GpsPoint[]) => void;
  playIndex: number;
  onSeek: (index: number) => void;
}

const STATUS_DOT: Record<MemberStatus["status"], string> = {
  moving: "bg-emerald-500",
  stopped: "bg-amber-500",
  signal_lost: "bg-slate-400",
};

const STATUS_AVATAR: Record<MemberStatus["status"], string> = {
  moving: "bg-emerald-500",
  stopped: "bg-amber-500",
  signal_lost: "bg-slate-400",
};

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

  // Load on mount
  React.useEffect(() => {
    loadHistory(historyDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll active row
  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(
      `[data-idx="${playIndex}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [playIndex]);

  const pts = historyPoints;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const totalMs = pts.length > 1 ? last.time - first.time : 0;

  const totalDistM = React.useMemo(() => {
    let d = 0;
    for (let i = 1; i < pts.length; i++) {
      d += haversineM(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
    }
    return d;
  }, [pts]);

  const segments = React.useMemo(() => computeSegments(pts), [pts]);
  const groups = React.useMemo(() => computeGroups(pts), [pts]);

  const toggleGroup = (gi: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gi)) next.delete(gi);
      else next.add(gi);
      return next;
    });
  };

  return (
    <div className="absolute top-3 bottom-3 right-3 z-20 flex w-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-lg">
      {/* Header */}
      <div className="shrink-0 border-b border">
        {/* Member info row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white",
              STATUS_AVATAR[member.status],
            )}
          >
            {member.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-foreground">
              {member.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  STATUS_DOT[member.status],
                )}
              />
              <span className="text-muted-foreground">
                {member.statusLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Date navigation row */}
        <div className="border-t bg-muted/40 px-4 py-2.5">
          <div className="flex items-center overflow-hidden rounded-md border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const prev = subDays(historyDate, 1);
                setHistoryDate(prev);
                loadHistory(prev);
              }}
              aria-label="Ngày trước"
              className="h-8 w-8 shrink-0 rounded-none border-r border-border"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <DatePicker
                value={historyDate}
                onChange={(d) => {
                  setHistoryDate(d);
                  loadHistory(d);
                }}
                maxDate={new Date()}
                formatLabel={(d) => {
                  if (isToday(d)) return "Hôm nay";
                  if (isSameDay(d, subDays(new Date(), 1))) return "Hôm qua";
                  return new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(d);
                }}
                className="h-8 w-full justify-center rounded-none border-0 font-medium shadow-none hover:bg-muted focus-visible:ring-0"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = addDays(historyDate, 1);
                setHistoryDate(next);
                loadHistory(next);
              }}
              disabled={startOfDay(historyDate) >= startOfDay(new Date())}
              aria-label="Ngày sau"
              className="h-8 w-8 shrink-0 rounded-none border-l border-border"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {historyLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-t-primary" />
            <span className="text-[12px] text-muted-foreground">
              {t("history.loading")}
            </span>
          </div>
        ) : pts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Route className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">
                {t("history.noData")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Chọn ngày khác và nhấn Tải
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid shrink-0 grid-cols-2 divide-x border-b">
              <div className="flex items-center gap-2.5 px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Route className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">
                    {fmtDist(totalDistM)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("history.distance")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <Clock3 className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">
                    {fmtDuration(totalMs)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("history.duration")}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {segments.length > 0 && (
              <TimelineBar pts={pts} segments={segments} totalMs={totalMs} />
            )}

            {/* Column header */}
            <div className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b bg-muted/40 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 shrink-0" />
              <span className="w-[72px] shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Giờ
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Gauge className="h-3 w-3" /> Tốc độ
              </span>
            </div>

            {/* Points */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {groups.map((g, gi) => (
                <HistoryRowItem
                  key={gi}
                  group={g}
                  groupIndex={gi}
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
