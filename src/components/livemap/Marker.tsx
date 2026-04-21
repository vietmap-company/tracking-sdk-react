import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/lib/types";

export interface MarkerDotProps {
  member: MemberStatus;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

const STATUS_COLOR: Record<MemberStatus["status"], string> = {
  moving: "bg-emerald-500",
  stopped: "bg-amber-500",
  signal_lost: "bg-slate-400",
};

const STATUS_RING: Record<MemberStatus["status"], string> = {
  moving: "ring-emerald-300",
  stopped: "ring-amber-300",
  signal_lost: "ring-slate-300",
};

/** Pure presentational marker rendered via React portal inside a vietmap Marker container. */
export function MarkerDot({
  member,
  active,
  onClick,
  className,
  style,
}: MarkerDotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-0 border-none bg-transparent p-0 outline-none cursor-pointer",
        className,
      )}
      style={style}
      aria-label={member.name}
    >
      {/* Avatar circle */}
      <div
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[11px] font-bold text-white drop-shadow-md transition-all group-hover:scale-105",
          STATUS_COLOR[member.status],
          active && "scale-105 ring-2 ring-offset-1 ring-offset-background",
          active && STATUS_RING[member.status],
        )}
      >
        {member.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Connector dot */}
      <div
        className={cn(
          "h-1.5 w-0.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/50",
        )}
      />

      {/* Name label */}
      <div
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none shadow-sm max-w-28 truncate whitespace-nowrap",
          active
            ? "bg-primary text-primary-foreground shadow-primary/20 shadow-md"
            : "bg-card text-foreground shadow-border",
        )}
      >
        {member.name.split(" ").slice(-1)[0]}
      </div>
    </button>
  );
}

export interface DefaultPopupProps {
  member: MemberStatus;
  onViewHistory?: () => void;
  onClose?: () => void;
}

export function DefaultPopup({
  member,
  onViewHistory,
  onClose,
}: DefaultPopupProps) {
  const STATUS_TEXT: Record<MemberStatus["status"], string> = {
    moving: "text-emerald-600",
    stopped: "text-amber-500",
    signal_lost: "text-slate-400",
  };
  const STATUS_BG: Record<MemberStatus["status"], string> = {
    moving: "bg-emerald-50",
    stopped: "bg-amber-50",
    signal_lost: "bg-slate-50",
  };
  const STATUS_DOT: Record<MemberStatus["status"], string> = {
    moving: "bg-emerald-500",
    stopped: "bg-amber-500",
    signal_lost: "bg-slate-400",
  };

  return (
    <div className="relative w-56 overflow-hidden rounded-xl border border-border/60 bg-card text-xs shadow-lg">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {/* Member row */}
      <div className="flex items-center gap-3 px-4 pt-4 pr-9 pb-3">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white",
            STATUS_COLOR[member.status],
          )}
        >
          {member.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">
            {member.name}
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-1.5 text-[11px] font-medium",
              STATUS_TEXT[member.status],
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                STATUS_DOT[member.status],
              )}
            />
            {member.statusLabel}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-border/60" />

      {/* Stats */}
      <div className="px-3 py-2.5 space-y-2">
        {member.speed != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tốc độ</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                STATUS_BG[member.status],
                STATUS_TEXT[member.status],
              )}
            >
              {member.speed} km/h
            </span>
          </div>
        )}
        {member.lastAddress && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Địa chỉ</span>
            <p className="leading-snug text-foreground line-clamp-2">
              {member.lastAddress}
            </p>
          </div>
        )}
      </div>

      {/* View history button */}
      {onViewHistory && (
        <>
          <div className="mx-3 border-t border-border/60" />
          <div className="px-3 py-2.5">
            <button
              type="button"
              onClick={onViewHistory}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 py-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15 hover:border-primary/30"
            >
              Xem lộ trình
            </button>
          </div>
        </>
      )}
    </div>
  );
}
