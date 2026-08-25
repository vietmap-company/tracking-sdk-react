import { useRef, useState } from "react";
import { LiveMap } from "@/components/livemap/MapView";
import type { LiveMapRef } from "@/components/livemap/types";
import type { HistoryDataSource, MemberStatusKind } from "@/lib/types";

const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY ?? "";

// Vài userId có thật trong hệ thống để bấm thử nhanh.
const SAMPLE_IDS = ["kpg-fix", "khiem-plugin-1", "kpg-2"];

const STATUS_OPTIONS: { value: MemberStatusKind; label: string }[] = [
  { value: "moving", label: "Đang chạy" },
  { value: "stopped", label: "Dừng" },
  { value: "signal_lost", label: "Mất tín hiệu" },
];

// `null` = không gửi DataSource, để backend tự chọn.
const DATA_SOURCES: {
  value: HistoryDataSource | null;
  label: string;
  hint: string;
}[] = [
  {
    value: null,
    label: "Mặc định",
    hint: "Không gửi DataSource — backend ưu tiên enriched, chưa có thì fallback raw.",
  },
  {
    value: "raw",
    label: "raw",
    hint: "Bỏ qua map-matching hoàn toàn, chỉ lấy GPS gốc.",
  },
  {
    value: "both",
    label: "both",
    hint: "Query cả hai nguồn — vẽ enriched liền nét + raw nét đứt để đối chiếu.",
  },
  {
    value: "merged",
    label: "merged",
    hint: "Enriched làm xương sống, chèn raw vào đoạn matcher không match → tuyến liền mạch.",
  },
];

export function PageLiveMap() {
  const [raw, setRaw] = useState("");
  const [dataSource, setDataSource] = useState<HistoryDataSource | null>(null);
  const activeSource = DATA_SOURCES.find((d) => d.value === dataSource);
  const [showTransitions, setShowTransitions] = useState(false);

  // Filter theo status — điều khiển imperative qua ref (component "gọi" filter).
  const mapRef = useRef<LiveMapRef>(null);
  const [statuses, setStatuses] = useState<MemberStatusKind[]>([]);
  const toggleStatus = (s: MemberStatusKind) => {
    setStatuses((prev) => {
      const next = prev.includes(s)
        ? prev.filter((x) => x !== s)
        : [...prev, s];
      mapRef.current?.setStatusFilter(next); // gọi filter trên LiveMap
      return next;
    });
  };

  // Chuỗi "a, b, c" -> ["a","b","c"]. Rỗng -> undefined = hiện tất cả.
  const userIds = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const filter = userIds.length ? userIds : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 shrink-0 bg-background space-y-2">
        <h1 className="text-lg sm:text-xl font-bold text-foreground">
          LiveMap
        </h1>
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

        {/* Demo chọn DataSource cho lịch sử hành trình */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Tuyến lịch sử:
          </span>
          {DATA_SOURCES.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setDataSource(opt.value)}
              className={
                "text-xs px-2 py-1 rounded border font-mono " +
                (opt.value === dataSource
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted hover:bg-muted/70")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        {activeSource && (
          <p className="text-xs text-muted-foreground">{activeSource.hint}</p>
        )}

        {/* Demo filter theo status — gọi imperative qua ref của LiveMap */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Trạng thái:
          </span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleStatus(opt.value)}
              className={
                "text-xs px-2 py-1 rounded border " +
                (statuses.includes(opt.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted hover:bg-muted/70")
              }
            >
              {opt.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground">
            {statuses.length
              ? `Đang lọc ${statuses.length} trạng thái`
              : "Hiện mọi trạng thái"}
          </span>
          <button
            type="button"
            onClick={() => setShowTransitions((v) => !v)}
            className={
              "text-xs px-2 py-1 rounded border " +
              (showTransitions
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted hover:bg-muted/70")
            }
          >
            🔄 Marker chuyển tiếp
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-2 sm:p-4 min-h-0">
        <LiveMap
          ref={mapRef}
          apiKeyTilemap={VIETMAP_KEY}
          pollInterval={15_000}
          userIds={filter}
          dataSource={dataSource}
          showTransitionMarkers={showTransitions}
          height="100%"
          className="h-full"
          // memberNameKey="fullName"
        />
      </div>
    </div>
  );
}
