# @vietmap/tracking-sdk-react

React SDK cho **GPS Tracking** — drop-in **Dashboard**, **LiveMap** và **Report** components với VietmapGL và shadcn/ui.

## Cài đặt

```bash
npm install @vietmap/tracking-sdk-react
# hoặc
pnpm add @vietmap/tracking-sdk-react
```

Import CSS:
```tsx
import "@vietmap/tracking-sdk-react/styles.css"
```

Peer deps: `react >= 18`, `react-dom >= 18`.

---

## Quick Start

```tsx
import {
  FleetworkProvider,
  Dashboard,
  LiveMap,
  Report,
} from "@vietmap/tracking-sdk-react"
import "@vietmap/tracking-sdk-react/styles.css"

export default function App() {
  return (
    <FleetworkProvider apiKey="YOUR_API_TOKEN">
      <Dashboard />
      <LiveMap apiKeyTilemap="YOUR_VIETMAP_TILE_KEY" height="600px" memberNameKey="userName" />
      <Report />
    </FleetworkProvider>
  )
}
```

---

## Provider

| Prop | Type | Mặc định | Mô tả |
|---|---|---|---|
| `apiKey` | `string` | — | API token (gửi qua header `X-API-Key`) |
| `baseUrl` | `string` | `"https://live.fleetwork.vn/api/v1"` | Base URL của API server |
| `locale` | `"vi" \| "en"` | `"vi"` | Ngôn ngữ giao diện |
| `theme` | `ThemeConfig` | — | Tuỳ chỉnh CSS variables (xem Theming) |

> `baseUrl` và `locale` là optional — chỉ truyền khi cần override mặc định.  
> `apiKeyTilemap` truyền trực tiếp vào prop của `<LiveMap>`, không qua Provider.

---

## Components

### `<Dashboard />`

Dashboard tổng hợp với 5 widgets. Mỗi widget có thể dùng độc lập.

| Widget | Mô tả |
|---|---|
| `SummaryCards` | Tổng quãng đường / thời gian / chi phí nhiên liệu hôm nay |
| `MemberReport` | Bảng nhân viên với phân trang và badge trạng thái |
| `ActivityHeatmap` | Heatmap giờ hoạt động (T2–CN × 0–23h) |
| `FuelTracking` | Biểu đồ quãng đường vs tiêu thụ nhiên liệu |
| `MonthlyExpenses` | Biểu đồ chi phí phân loại theo tháng |

```tsx
import { Dashboard, SummaryCards, MemberReport } from "@vietmap/tracking-sdk-react"

<Dashboard pollInterval={30_000} />
<SummaryCards date={Date.now()} />
<MemberReport pageSize={20} />
```

**`DashboardProps`**

| Prop | Type | Mặc định | Mô tả |
|---|---|---|---|
| `date` | `number` | hôm nay | Timestamp ms |
| `pollInterval` | `number` | `30000` | Tự động refresh (ms) |
| `showSummaryCards` | `boolean` | `true` | Hiện/ẩn widget |
| `showMemberReport` | `boolean` | `true` | Hiện/ẩn widget |
| `showActivityHeatmap` | `boolean` | `true` | Hiện/ẩn widget |
| `showFuelTracking` | `boolean` | `true` | Hiện/ẩn widget |
| `showMonthlyExpenses` | `boolean` | `true` | Hiện/ẩn widget |

---

### `<LiveMap />`

Bản đồ fleet real-time dùng VietmapGL (CDN loader) với GPU-accelerated clustering.

**Tính năng:**
- Tự động poll vị trí nhân viên (`pollInterval`, mặc định 10 giây)
- GeoJSON clustering — render 3000+ marker, zoom để mở cluster
- Spiderfy — click nhiều marker trùng toạ độ sẽ fan out để chọn riêng từng người
- Sidebar nhân viên — collapsible pill, infinite scroll, sắp xếp moving → stopped → mất tín hiệu, tìm kiếm
- Tile switcher: terrain / light / dark / satellite
- Click marker → popup → **Xem lộ trình** → animated playback với route overlay
- History panel: thống kê quãng đường + thời gian, timeline bar, danh sách điểm theo nhóm, date picker
- Khi đang xem lịch sử, chọn nhân viên khác sẽ tự tải lại lịch sử của người đó
- `ref` API: `flyTo`, `fitBounds`, `focusMember`, `getMembers`, `getMap`

```tsx
import { useRef } from "react"
import { LiveMap, type LiveMapRef } from "@vietmap/tracking-sdk-react"

const mapRef = useRef<LiveMapRef>(null)

<LiveMap
  ref={mapRef}
  apiKeyTilemap="YOUR_VIETMAP_KEY"
  height="600px"
  center={[106.63, 10.82]}
  zoom={11}
  defaultTile="terrain"
  pollInterval={10_000}
  maxUsers={3000}
  clusterRadius={50}
  clusterMaxZoom={14}
  memberNameKey="userName"
  showList
  onMarkerClick={(m) => console.log(m.name)}
  onMapReady={(map) => console.log("zoom:", map.getZoom())}
/>
```

**`LiveMapProps`**

| Prop | Type | Mặc định | Mô tả |
|---|---|---|---|
| `apiKeyTilemap` | `string` | — | VietMap tile key *(bắt buộc)* |
| `height` | `string` | `"100dvh"` | Chiều cao container |
| `center` | `[lng, lat]` | `[106.6, 10.8]` | Toạ độ trung tâm bản đồ |
| `zoom` | `number` | `11` | Mức zoom ban đầu |
| `defaultTile` | `TileType` | `"terrain"` | Loại tile mặc định |
| `pollInterval` | `number` | `10000` | Chu kỳ refresh vị trí (ms) |
| `maxUsers` | `number` | `3000` | Số nhân viên tối đa mỗi lần poll |
| `clusterRadius` | `number` | `50` | Bán kính cluster (px) |
| `clusterMaxZoom` | `number` | `14` | Mức zoom tắt cluster |
| `memberNameKey` | `string` | — | Key trong `metadata` dùng làm tên hiển thị |
| `members` | `MemberStatus[]` | — | Override data (tắt API polling) |
| `showList` | `boolean` | `true` | Hiện sidebar nhân viên |
| `onMarkerClick` | `(m) => void \| boolean` | — | Return `false` để chặn popup mặc định |
| `onMemberClick` | `(m) => void \| boolean` | — | Click item trên sidebar |
| `onMapClick` | `([lng, lat]) => void` | — | Click nền bản đồ |
| `onMapReady` | `(map) => void` | — | Fires sau khi bản đồ load xong |
| `renderMarkerPopup` | `(m) => ReactNode` | — | Tuỳ chỉnh nội dung popup |
| `renderMemberItem` | `(m, default) => ReactNode` | — | Tuỳ chỉnh hàng sidebar |

**`LiveMapRef` (imperative API)**

```tsx
mapRef.current?.flyTo([106.63, 10.82], 14)
mapRef.current?.fitBounds([[102, 8], [110, 23]])
mapRef.current?.focusMember("user-123")  // Bay đến + mở popup
mapRef.current?.getMembers()             // MemberStatus[]
mapRef.current?.getMap()                 // MapInstance
```

---

### `<Report />`

Hub báo cáo — màn hình chính với 3 thẻ, điều hướng vào từng loại.

| Báo cáo | Tabs | Mô tả |
|---|---|---|
| Hành trình | Tổng hợp / Chi tiết | Quãng đường, thời gian, tốc độ |
| Nhiên liệu | Tổng hợp / Chi tiết | Định mức và chi phí nhiên liệu |
| Giờ hoạt động | — | Số nhân viên hoạt động theo giờ |

Tất cả bảng: header có thể sort, sticky header + sticky hàng tổng, scroll ngang/dọc, `DateRangePicker` 2 tháng với nút xác nhận.

```tsx
<Report from={Date.now() - 30 * 86_400_000} to={Date.now()} />
```

Dùng từng sub-report độc lập:

```tsx
import {
  TripSummaryReport, TripDetailReport,
  FuelSummaryReport, FuelDetailReport,
  ActivityTimeReport,
} from "@vietmap/tracking-sdk-react"

// Tất cả nhận: range, onRangeChange, onBack, onError, pageSize
<TripSummaryReport range={{ from, to }} onRangeChange={setRange} pageSize={20} />
```

---

## Hooks

Tất cả hooks cần `FleetworkProvider` trong tree. Trả về `{ data, isLoading, error, refetch }`.

> Không dùng TanStack Query — hooks thuần `useState/useEffect`.

```tsx
// Dashboard
const { data } = useSummaryCards({ date?, pollInterval? })
const { data } = useMemberReport({ date?, page?, pageSize?, status? })
const { data } = useActivityHeatmap({ from?, to?, metric? })
const { data } = useFuelTracking({ from?, to?, groupBy? })
const { data } = useMonthlyExpenses({ from?, to?, currency? })

// LiveMap
const { data } = useMembers({ pollInterval?, nameKey?, maxUsers? })
const { data } = useMember(userId)
const { data } = useHistoryRoute({ userId, startTime, endTime })

// Report
const { data } = useTripSummaryReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useTripDetailReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useFuelSummaryReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useFuelDetailReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useActivityTimeReport({ from, to, page?, pageSize? })
```

---

## Controllers (framework-agnostic)

Dùng ngoài React — Zustand, Redux, Node.js scripts, hoặc bất kỳ context nào.

```ts
import {
  initFleetwork,
  DashboardController,
  LiveMapController,
  ReportController,
} from "@vietmap/tracking-sdk-react"

initFleetwork({ apiKey: "...", baseUrl: "..." })

const summary = await DashboardController.getSummaryCards()
const members = await LiveMapController.getMembers({ pageSize: 3000 })
const history = await LiveMapController.getHistoryRoute(userId, from, to)
const trips   = await ReportController.getTripSummary({ from, to })
const fuel    = await ReportController.getFuelSummary({ from, to })
```

---

## Theming

Tuỳ chỉnh CSS variables qua prop `theme` của `FleetworkProvider`:

```tsx
<FleetworkProvider
  theme={{
    colors: {
      primary:          "#2563eb",
      background:       "#0f172a",
      text:             "#f1f5f9",
      border:           "#1e293b",
      destructive:      "#ef4444",
      statusMoving:     "#10b981",
      statusStopped:    "#f59e0b",
      statusSignalLost: "#94a3b8",
    },
    borderRadius: 8,
    fontFamily: "Inter, sans-serif",
  }}
>
```

**`ThemeConfig`**

| Field | CSS variable | Mô tả |
|---|---|---|
| `colors.primary` | `--primary` | Màu chính (button, focus ring) |
| `colors.background` | `--background` | Màu nền trang |
| `colors.text` | `--foreground` | Màu chữ chính |
| `colors.border` | `--border` | Màu viền |
| `colors.destructive` | `--destructive` | Màu lỗi / xoá |
| `colors.statusMoving` | `--status-moving` | Màu chấm "đang di chuyển" |
| `colors.statusStopped` | `--status-stopped` | Màu chấm "dừng" |
| `colors.statusSignalLost` | `--status-signal-lost` | Màu chấm "mất tín hiệu" |
| `borderRadius` | `--radius` | Border radius (px) |
| `fontFamily` | `--dc-font` | Font chữ |

---

## Build

```bash
pnpm install
pnpm build
```

Output:
- `dist/tracking-sdk-react.js` — ESM
- `dist/tracking-sdk-react.cjs` — CommonJS
- `dist/index.d.ts` — TypeScript declarations
- `dist/tracking-sdk-react.css` — Styles (import riêng)

---

## License

MIT © VietMap
