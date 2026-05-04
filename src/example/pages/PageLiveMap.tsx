import { LiveMap } from '@/components/livemap/MapView'

const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY ?? ''

export function PageLiveMap() {
  return (
    <div style={{ height: '100dvh' }} className="flex flex-col">
      <div className="px-6 py-4 border-b border-border/50 shrink-0 bg-background">
        <h1 className="text-xl font-bold text-foreground">LiveMap</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vị trí thời gian thực của nhân viên</p>
        {!VIETMAP_KEY && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Thêm <code className="bg-muted px-1 rounded font-mono">VITE_VIETMAP_KEY=your-key</code> vào <code className="bg-muted px-1 rounded font-mono">.env.local</code> để hiển thị bản đồ VietMap.
          </p>
        )}
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <LiveMap
          apiKeyTilemap={VIETMAP_KEY}
          memberNameKey="userName"
          pollInterval={15_000}
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  )
}
