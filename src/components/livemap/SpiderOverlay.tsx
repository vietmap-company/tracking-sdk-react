import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { MemberStatus } from "@/lib/types";
import { STATUS_BG } from "./statusColors";

const SPOKE_R = 65;
const DOT_SIZE = 34;

function spokePos(i: number, total: number, cx: number, cy: number) {
  // Distribute evenly in a circle, starting from top (−π/2)
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
  onClose: () => void;
}

export function SpiderOverlay({
  centerPx,
  members,
  onSelect,
  onClose,
}: SpiderOverlayProps) {
  const { x: cx, y: cy } = centerPx;

  return (
    <>
      {/* Backdrop — closes spider on click outside legs */}
      <div className="absolute inset-0 z-20" onClick={onClose} />

      {/* SVG connecting lines */}
      <svg
        className="pointer-events-none absolute inset-0 z-20"
        width="100%"
        height="100%"
      >
        {members.map((m, i) => {
          const s = spokePos(i, members.length, cx, cy);
          return (
            <line
              key={m.userId}
              x1={cx}
              y1={cy}
              x2={s.x}
              y2={s.y}
              stroke="#64748b"
              strokeWidth={1.5}
              strokeOpacity={0.55}
              strokeDasharray="4 3"
            />
          );
        })}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill="#64748b" fillOpacity={0.5} />
      </svg>

      {/* Spoke avatar buttons */}
      {members.map((m, i) => {
        const s = spokePos(i, members.length, cx, cy);
        return (
          <button
            key={m.userId}
            type="button"
            title={m.name}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m);
            }}
            className="absolute z-30 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110 focus:outline-none"
            style={{
              left: s.x - DOT_SIZE / 2,
              top: s.y - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
            }}
          >
            <Avatar
              src={m.avatarUrl ?? undefined}
              alt={m.name}
              fallback={m.name}
              size={DOT_SIZE}
            />
            <span
              className={cn(
                "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-white",
                STATUS_BG[m.status],
              )}
            />
          </button>
        );
      })}
    </>
  );
}
