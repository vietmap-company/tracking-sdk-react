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
  ChevronUp,
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
  // Playback controls (passed through so mobile sheet can embed them)
  isPlaying: boolean;
  playSpeed: 1 | 2 | 4;
  autoFollow: boolean;
  onPlayToggle: () => void;
  onSpeedCycle: () => void;
  onAutoFollowToggle: () => void;
}

// ── Inline playback bar (used inside the sheet on mobile) ─────────────────────
function PlaybackBar({
  points, index, isPlaying, speed, autoFollow,
  onSeek, onPlayToggle, onSpeedCycle, onAutoFollowToggle,
}: {
  points: GpsPoint[]; index: number; isPlaying: boolean; speed: 1 | 2 | 4;
  autoFollow: boolean; onSeek: (i: number) => void;
  onPlayToggle: () => void; onSpeedCycle: () => void; onAutoFollowToggle: () => void;
}) {
  const total = points.length;
  if (!total) return null;
  const curr = points[index];
  const pct = (total > 1 ? index / (total - 1) : 0) * 100;
  const trackRef = React.useRef<HTMLDivElement>(null);

  const calcIndex = React.useCallback((clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return index;
    return Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (total - 1));
  }, [index, total]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onSeek(calcIndex(e.clientX));
    const onMove = (ev: MouseEvent) => onSeek(calcIndex(ev.clientX));
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [calcIndex, onSeek]);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    onSeek(calcIndex(e.touches[0].clientX));
    const onMove = (ev: TouchEvent) => onSeek(calcIndex(ev.touches[0].clientX));
    const onUp = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp); };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
  }, [calcIndex, onSeek]);

  return (
    <div className="shrink-0 px-3 py-2.5 border-b border-border/40 bg-muted/10">
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button type="button" onClick={onPlayToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted">
          {isPlaying
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>}
        </button>
        {/* Speed */}
        <button type="button" onClick={onSpeedCycle}
          className="flex h-7 shrink-0 items-center rounded-full border border-border/60 bg-card px-2.5 text-[11px] font-bold text-foreground hover:bg-muted">
          {speed}×
        </button>
        {/* Seek track */}
        <div ref={trackRef}
          className="relative flex h-8 flex-1 cursor-pointer select-none items-center px-1"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}>
          <div className="relative h-1.5 w-full rounded-full bg-muted">
            <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${pct.toFixed(2)}%`, pointerEvents: 'none' }} />
            <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-md" style={{ left: `${pct.toFixed(2)}%`, pointerEvents: 'none' }} />
          </div>
        </div>
        {/* Auto-follow */}
        <button type="button" onClick={onAutoFollowToggle}
          className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors',
            autoFollow ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/60 bg-card text-muted-foreground hover:bg-muted')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </button>
      </div>
      {/* Time + count */}
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span className="font-mono">{curr ? fmtTime(curr.time) : '—'}</span>
        <span className="tabular-nums">{index + 1} / {total}</span>
      </div>
    </div>
  );
}

export function HistoryPanel({
  member, onClose, onHistoryLoaded,
  playIndex, onSeek,
  isPlaying, playSpeed, autoFollow,
  onPlayToggle, onSpeedCycle, onAutoFollowToggle,
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
  const [sheetExpanded, setSheetExpanded] = React.useState(false);

  return (
    <div
      className={cn(
        // Desktop: right side panel
        'sm:absolute sm:top-3 sm:bottom-3 sm:right-3 sm:z-20 sm:flex sm:w-[300px] sm:flex-col sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border/60 sm:bg-card/95 sm:backdrop-blur-md sm:shadow-xl',
        // Mobile: bottom sheet
        'max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-30 max-sm:flex max-sm:flex-col max-sm:overflow-hidden max-sm:rounded-t-2xl max-sm:border-t max-sm:border-border/60 max-sm:bg-card/95 max-sm:backdrop-blur-md max-sm:shadow-[0_-4px_24px_rgba(0,0,0,0.15)]',
        sheetExpanded ? 'max-sm:h-[68dvh]' : 'max-sm:min-h-[180px] max-sm:max-h-[320px]',
        'max-sm:transition-[height] max-sm:duration-300 max-sm:ease-in-out',
      )}
    >
      {/* Drag handle (mobile only) */}
      <div
        className="sm:hidden shrink-0 flex items-center justify-center pt-2.5 pb-1 cursor-pointer select-none"
        onClick={() => setSheetExpanded((v) => !v)}
      >
        <div className="h-1 w-10 rounded-full bg-border/60" />
      </div>

      {/* Member header */}
      <div className="shrink-0 px-3 pt-2 pb-2.5 sm:pt-4 sm:pb-3 sm:px-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white', STATUS_AVATAR_BG[member.status])}>
              {initials}
            </div>
            <span className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card', STATUS_DOT_PLAIN[member.status])} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground leading-tight">{member.name ?? member.userId}</p>
            <span className={cn('mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', STATUS_BADGE[member.status])}>
              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_PLAIN[member.status])} />
              {member.statusLabel}
            </span>
            {/* Stats inline — show when data loaded */}
            {!historyLoading && pts.length > 0 && (
              <div className="mt-1 flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Route className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-semibold text-foreground tabular-nums">{fmtDist(totalDistM)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="h-3 w-3 text-violet-500 shrink-0" />
                  <span className="font-semibold text-foreground tabular-nums">{fmtDuration(totalMs)}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setSheetExpanded((v) => !v)}
              className="sm:hidden flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors">
              {sheetExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date navigator */}
      <div className="shrink-0 px-3 py-2 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <button type="button"
            onClick={() => { const p = subDays(historyDate, 1); setHistoryDate(p); loadHistory(p); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <DatePicker
            value={historyDate}
            onChange={(d) => { setHistoryDate(d); loadHistory(d); }}
            maxDate={new Date()}
            formatLabel={(d) => new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)}
            className="h-7 flex-1 rounded-lg text-[12px] font-medium"
          />
          <button type="button"
            onClick={() => { const n = addDays(historyDate, 1); setHistoryDate(n); loadHistory(n); }}
            disabled={startOfDay(historyDate) >= startOfDay(new Date())}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {historyLoading && (
        <div className="flex shrink-0 items-center justify-center gap-2.5 py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-[12px] text-muted-foreground">{t('history.loading')}</span>
        </div>
      )}

      {/* Empty */}
      {!historyLoading && pts.length === 0 && (
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 py-8 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MapPin className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">{t('history.noData')}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Không có dữ liệu trong ngày này</p>
          </div>
        </div>
      )}

      {/* Data */}
      {!historyLoading && pts.length > 0 && (
        <>
          {/* ── Mobile bottom sheet content ───────────────────────────── */}
          <div className="sm:hidden shrink-0 overflow-hidden">
            {/* Timeline color bar + time labels */}
            {segments.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b border-border/40 bg-muted/10">
                {/* Time labels */}
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{fmtTimeShort(pts[0].time)}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{fmtTimeShort(pts[pts.length-1].time)}</span>
                </div>
                {/* Color bar */}
                <div className="flex h-4 overflow-hidden rounded-md bg-muted/50">
                  {segments.map((sg, i) => (
                    <div key={i}
                      style={{
                        width: `${Math.max((sg.durationMs / totalMs) * 100, 0.5).toFixed(2)}%`,
                        background: ({ moving: STATUS_HEX.moving, stopped: STATUS_HEX.stopped, lostGps: STATUS_HEX.signal_lost } as Record<string,string>)[sg.type],
                      }}
                    />
                  ))}
                </div>
                {/* Legend chips */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {(['moving','stopped','lostGps'] as const)
                    .filter(k => segments.some(s => s.type === k))
                    .map(k => {
                      const dur = segments.filter(s=>s.type===k).reduce((a,s)=>a+s.durationMs,0);
                      const color = ({ moving: STATUS_HEX.moving, stopped: STATUS_HEX.stopped, lostGps: STATUS_HEX.signal_lost } as Record<string,string>)[k];
                      const label = k==='moving'?'Di chuyển':k==='stopped'?'Dừng':'Mất GPS';
                      return (
                        <span key={k} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{background:color}} />
                          {label} · {fmtDuration(dur)}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Row 3: Playback controls — full width, touch-friendly */}
            <div className="px-3 pt-3 pb-3 border-b border-border/40">
              {/* Seek track — tall touch target */}
              <PlaybackBar
                points={pts}
                index={playIndex}
                isPlaying={isPlaying}
                speed={playSpeed}
                autoFollow={autoFollow}
                onSeek={onSeek}
                onPlayToggle={onPlayToggle}
                onSpeedCycle={onSpeedCycle}
                onAutoFollowToggle={onAutoFollowToggle}
              />
            </div>
          </div>

          {/* ── Desktop content (unchanged) ──────────────────────────────── */}
          {/* Desktop timeline */}
          {segments.length > 0 && (
            <div className="hidden sm:block">
              <TimelineBar pts={pts} segments={segments} totalMs={totalMs} />
            </div>
          )}

          {/* GPS list — desktop always, mobile only when expanded */}
          <div className={cn(
            'flex flex-col overflow-hidden sm:flex-1',
            sheetExpanded ? 'max-sm:flex-1 max-sm:min-h-0' : 'max-sm:hidden',
          )}>
            <div className="flex items-center gap-3 border-b border-border/40 bg-muted/30 px-4 py-1.5 shrink-0">
              <span className="w-4 shrink-0" />
              <span className="text-[10px] font-semibold text-muted-foreground">Giờ</span>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground">Tốc độ</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {groups.map((g, gi) => (
                <HistoryRowItem key={gi} group={g} activeIndex={playIndex}
                  expanded={expandedGroups.has(gi)}
                  onToggle={() => toggleGroup(gi)}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
