import { useState } from "react";
import { LiveMap } from "@/components/livemap/MapView";

const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY ?? "";

// Vài userId có thật trong hệ thống để bấm thử nhanh.
const SAMPLE_IDS = ["kpg-fix", "khiem-plugin-1", "kpg-2"];

export function PageLiveMap() {
  const [raw, setRaw] = useState("");

  // Chuỗi "a, b, c" -> ["a","b","c"]. Rỗng -> undefined = hiện tất cả.
  const userIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filter = userIds.length ? userIds : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 shrink-0 bg-background space-y-2">
        <h1 className="text-lg sm:text-xl font-bold text-foreground">LiveMap</h1>
        {!VIETMAP_KEY && (
          <p className="text-xs text-amber-600">
            ⚠️ Thêm{" "}
            <code className="bg-muted px-1 rounded font-mono">
              VITE_VIETMAP_KEY=your-key
            </code>{" "}
            vào{" "}
            <code className="bg-muted px-1 rounded font-mono">.env.local</code>{" "}
            để hiển thị bản đồ VietMap.
          </p>
        )}

        {/* Demo filter theo userIds */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Lọc userIds (cách nhau bởi dấu phẩy) — để trống = tất cả"
            className="flex-1 min-w-[240px] text-sm border border-border rounded px-2 py-1 bg-background font-mono"
          />
          <button
            type="button"
            onClick={() => setRaw(SAMPLE_IDS.join(", "))}
            className="text-xs px-2 py-1 rounded border border-border bg-muted hover:bg-muted/70"
          >
            Mẫu: {SAMPLE_IDS.length} user
          </button>
          <button
            type="button"
            onClick={() => setRaw("")}
            className="text-xs px-2 py-1 rounded border border-border bg-muted hover:bg-muted/70"
          >
            Xoá lọc
          </button>
          <span className="text-xs text-muted-foreground">
            {filter ? `Đang lọc ${filter.length} user` : "Đang hiện tất cả"}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-2 sm:p-4 min-h-0">
        <LiveMap
          apiKeyTilemap={VIETMAP_KEY}
          pollInterval={15_000}
          userIds={filter}
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  );
}
