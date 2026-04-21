import * as React from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { POSITION_CLASSES } from "./types";
import type { Position, TileType } from "@/lib/types";

export interface TileSwitcherProps {
  value: TileType;
  onChange: (t: TileType) => void;
  position?: Position;
  className?: string;
  style?: React.CSSProperties;
}

const OPTIONS: Array<{ key: TileType; label: string; swatch: string }> = [
  { key: "light", label: "Light", swatch: "bg-slate-100" },
  { key: "dark", label: "Dark", swatch: "bg-slate-700" },
  { key: "terrain", label: "Terrain", swatch: "bg-emerald-100" },
  { key: "satellite", label: "Satellite", swatch: "bg-blue-900" },
];

export function TileSwitcher({
  value,
  onChange,
  position = "bottom-right",
  className,
  style,
}: TileSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("absolute z-10", POSITION_CLASSES[position], className)}
      style={style}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground shadow-sm hover:bg-muted"
      >
        <Layers className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute min-w-37.5 rounded-lg border border-border/60 bg-popover p-1 shadow-md",
            position.startsWith("bottom")
              ? "bottom-10 right-0"
              : "top-10 right-0",
          )}
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-popover-foreground transition-colors hover:bg-accent",
                value === opt.key && "bg-accent font-medium",
              )}
            >
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded border border-border/60",
                  opt.swatch,
                )}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
