import * as React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SignalZero,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFleetwork } from "@/provider/FleetworkProvider";
import type { MemberStatus } from "@/lib/types";
import { STATUS_BG } from "./statusColors";

export interface MemberListProps {
  members: MemberStatus[];
  isLoading: boolean;
  activeUserId?: string | null;
  onItemClick?: (member: MemberStatus) => void;
  renderItem?: (
    member: MemberStatus,
    defaultRender: React.ReactNode,
  ) => React.ReactNode;
  position?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}

function formatLastSeen(ts?: number): string {
  if (!ts) return "";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export function MemberList({
  members,
  isLoading,
  activeUserId,
  onItemClick,
  renderItem,
  position = "left",
  className,
  style,
}: MemberListProps) {
  const { t } = useFleetwork();
  const [query, setQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, query]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label={t("list.title")}
        className={cn(
          "absolute top-3 z-10 flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-[12px] font-semibold text-foreground shadow-lg transition-colors hover:bg-muted",
          position === "left" ? "left-3" : "right-3",
          className,
        )}
        style={style}
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{members.length}</span>
        <PanelLeftOpen
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground",
            position === "right" && "rotate-180",
          )}
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "absolute top-3 z-10 flex max-h-[calc(100%-24px)] w-72 flex-col overflow-hidden rounded-2xl border bg-card shadow-lg",
        position === "left" ? "left-3" : "right-3",
        className,
      )}
      style={style}
    >
      {/* Header */}
      <div className="shrink-0 bg-card px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold tracking-tight text-foreground">
            {t("list.title")}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
              {members.length}
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Đóng"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose
                className={cn(
                  "h-3.5 w-3.5",
                  position === "right" && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 flex h-8 items-center gap-2 rounded-full bg-muted px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("list.search")}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* List */}
      <div className="min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <SignalZero className="h-9 w-9 opacity-30" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("common.noData")}
            </span>
          </div>
        ) : (
          <ul className="py-1.5">
            {filtered.map((m) => {
              const isActive = activeUserId === m.userId;
              const defaultItem = (
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-2.5 transition-colors",
                    isActive ? "bg-primary/8" : "hover:bg-muted/60",
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-primary" />
                  )}

                  {/* Avatar + status dot */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={m.avatarUrl ?? undefined}
                      alt={m.name}
                      fallback={m.name}
                      size={36}
                    />
                    <span
                      className={cn(
                        "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                        STATUS_BG[m.status],
                      )}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">
                        {m.name}
                      </span>
                      {m.status !== "moving" && m.lastSeenAt && (
                        <Badge
                          variant={
                            m.status === "signal_lost"
                              ? "signal_lost"
                              : "stopped"
                          }
                          className="shrink-0 rounded-full px-2 text-[10px] font-normal"
                        >
                          {formatLastSeen(m.lastSeenAt)}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {m.lastAddress ?? "—"}
                    </div>
                  </div>
                </div>
              );

              const content = renderItem
                ? renderItem(m, defaultItem)
                : defaultItem;
              return (
                <li
                  key={m.userId}
                  onClick={() => onItemClick?.(m)}
                  className="cursor-pointer"
                >
                  {content}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
