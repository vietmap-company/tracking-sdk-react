import { LiveMap } from "@/components/livemap/MapView";

const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY ?? "";

export function PageLiveMap() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 shrink-0 bg-background">
        <h1 className="text-lg sm:text-xl font-bold text-foreground">LiveMap</h1>
        {!VIETMAP_KEY && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Thêm{" "}
            <code className="bg-muted px-1 rounded font-mono">
              VITE_VIETMAP_KEY=your-key
            </code>{" "}
            vào{" "}
            <code className="bg-muted px-1 rounded font-mono">.env.local</code>{" "}
            để hiển thị bản đồ VietMap.
          </p>
        )}
      </div>
      <div className="flex-1 overflow-hidden p-2 sm:p-4 min-h-0">
        <LiveMap
          apiKeyTilemap={VIETMAP_KEY}
          pollInterval={15_000}
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  );
}
