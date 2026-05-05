import { cn } from "@/lib/utils";
import type { MemberStatus } from "@/lib/types";
import { STATUS_AVATAR_BG, STATUS_DOT_PLAIN } from "@/components/shared";

const SPOKE_R = 65;
const DOT_SIZE = 36;

function spokePos(i: number, total: number, cx: number, cy: number) {
  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: cx + SPOKE_R * Math.cos(angle),
    y: cy + SPOKE_R * Math.sin(angle),
  };
}

export interface SpiderOverlayProps {
  centerPx: { x: number; y: number };
  members: MemberStatus[];
  onSelect: (member: MemberStatus) => void;
  onClose?: () => void;
  /**
   * When true (default), renders a full-map backdrop that closes the spider
   * on outside click — used for the click-triggered spider pattern.
   * When false, no backdrop is rendered so the underlying map remains
   * pannable/zoomable — used for the always-visible auto-spider pattern.
   */
  interactive?: boolean;
  /** Highlights the leaf for this user with a thicker blue ring. */
  activeUserId?: string | null;
}

export function SpiderOverlay({
  centerPx,
  members,
  onSelect,
  onClose,
  interactive = true,
  activeUserId,
}: SpiderOverlayProps) {
  const { x: cx, y: cy } = centerPx;

  // Compute all spoke positions once — reused by both the SVG lines and the
  // avatar buttons so `spokePos` is called exactly members.length times per render.
  const positions = members.map((_, i) => spokePos(i, members.length, cx, cy));

  return (
    <>
      {interactive && (
        <div className="absolute inset-0 z-20" onClick={onClose} />
      )}

      {/* SVG lines */}
      <svg
        className="pointer-events-none absolute inset-0 z-20"
        width="100%"
        height="100%"
      >
        {members.map((m, i) => {
          const s = positions[i];
          return (
            <line
              key={m.userId}
              x1={cx}
              y1={cy}
              x2={s.x}
              y2={s.y}
              stroke="#64748b"
              strokeWidth={1.5}
              strokeOpacity={0.5}
              strokeDasharray="4 3"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={5} fill="#64748b" fillOpacity={0.5} />
      </svg>

      {/* Avatar buttons */}
      {members.map((m, i) => {
        const s = positions[i];
        const initials = (m.name ?? m.userId).slice(0, 2).toUpperCase();
        const isActive = activeUserId != null && m.userId === activeUserId;
        return (
          <button
            key={m.userId}
            type="button"
            title={m.name ?? m.userId}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m);
            }}
            className={cn(
              "absolute z-30 flex items-center justify-center rounded-full",
              "text-[11px] font-bold text-white shadow-lg",
              "transition-transform hover:scale-110 focus:outline-none",
              isActive
                ? "border-[3px] border-blue-500 ring-2 ring-blue-500/30 scale-110"
                : "border-2 border-white",
              STATUS_AVATAR_BG[m.status],
            )}
            style={{
              left: s.x - DOT_SIZE / 2,
              top: s.y - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
            }}
          >
            {initials}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                STATUS_DOT_PLAIN[m.status],
              )}
            />
          </button>
        );
      })}
    </>
  );
}
