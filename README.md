# @vietmap/tracking-sdk-react

React SDK cho **GPS Tracking** -- drop-in **Dashboard**, **LiveMap** va **Report** components voi VietmapGL va shadcn/ui.

## Cai dat

```bash
npm install @vietmap/tracking-sdk-react
# hoac
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
    <FleetworkProvider
      apiKey="YOUR_API_TOKEN"
      baseUrl="https://your-api-server.com"
      locale="vi"
    >
      <Dashboard />
      <LiveMap
        apiKeyTilemap="YOUR_VIETMAP_TILE_KEY"
        height="600px"
        memberNameKey="userName"
      />
      <Report />
    </FleetworkProvider>
  )
}
```

---

## Provider

| Prop | Type | Default | Mo ta |
|---|---|---|---|
| `apiKey` | `string` | -- | API token (gui qua `X-API-Key` header) |
| `baseUrl` | `string` | -- | Base URL cua API server |
| `locale` | `"vi" \| "en"` | `"vi"` | Ngon ngu giao dien |
| `theme` | `ThemeConfig` | -- | Override CSS variables (xem Theming) |

> **Luu y:** `apiKeyTilemap` truyen truc tiep vao `<LiveMap>` prop, khong qua Provider.

---

## Components

### `<Dashboard />`

Dashboard tong hop voi 5 widgets. Moi widget co the dung doc lap.

| Widget | Mo ta |
|---|---|
| `SummaryCards` | Tong quang duong / thoi gian / chi phi nhien lieu hom nay |
| `MemberReport` | Bang nhan vien voi phan trang va badge trang thai |
| `ActivityHeatmap` | Heatmap gio hoat dong (T2-CN x 0-23h) |
| `FuelTracking` | Bieu do quang duong vs tieu thu nhien lieu |
| `MonthlyExpenses` | Bieu do chi phi phan loai theo thang |

```tsx
import { Dashboard, SummaryCards, MemberReport } from "@vietmap/tracking-sdk-react"

<Dashboard pollInterval={30_000} />
<SummaryCards date={Date.now()} />
<MemberReport pageSize={20} />
```

**`DashboardProps`**

| Prop | Type | Default | Mo ta |
|---|---|---|---|
| `date` | `number` | hom nay | Timestamp ms |
| `pollInterval` | `number` | `30000` | Tu dong refresh (ms) |
| `showSummaryCards` | `boolean` | `true` | Hien/an |
| `showMemberReport` | `boolean` | `true` | Hien/an |
| `showActivityHeatmap` | `boolean` | `true` | Hien/an |
| `showFuelTracking` | `boolean` | `true` | Hien/an |
| `showMonthlyExpenses` | `boolean` | `true` | Hien/an |

---

### `<LiveMap />`

Ban do fleet real-time dung VietmapGL (CDN loader) voi GPU-accelerated clustering.

**Tinh nang:**
- Tu dong poll vi tri nhan vien (pollInterval, mac dinh 10s)
- GeoJSON clustering -- render 3000+ marker, zoom de mo cluster
- Sidebar nhan vien -- collapsible pill, infinite scroll, sort moving -> stopped -> mat tin hieu
- Tile switcher: terrain / light / dark / satellite
- Click marker -> popup -> Xem lo trinh -> animated playback voi route overlay
- History panel: stats quang duong + thoi gian, timeline bar, danh sach diem theo nhom, date picker
- Switch member khi dang xem history tu reload history cua member moi
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

| Prop | Type | Default | Mo ta |
|---|---|---|---|
| `apiKeyTilemap` | `string` | -- | VietMap tile key (bat buoc) |
| `height` | `string` | `"100dvh"` | Chieu cao container |
| `center` | `[lng, lat]` | `[106.6, 10.8]` | Trung tam ban do |
| `zoom` | `number` | `11` | Zoom ban dau |
| `defaultTile` | `TileType` | `"terrain"` | Loai tile mac dinh |
| `pollInterval` | `number` | `10000` | Interval refresh vi tri (ms) |
| `maxUsers` | `number` | `3000` | So user toi da moi lan poll |
| `clusterRadius` | `number` | `50` | Ban kinh cluster (px) |
| `clusterMaxZoom` | `number` | `14` | Zoom tat cluster |
| `memberNameKey` | `string` | -- | Key trong `metadata` dung lam ten hien thi |
| `members` | `MemberStatus[]` | -- | Override data (tat API polling) |
| `showList` | `boolean` | `true` | Hien sidebar nhan vien |
| `onMarkerClick` | `(m) => void \| boolean` | -- | Return `false` de chan popup mac dinh |
| `onMemberClick` | `(m) => void \| boolean` | -- | Click item tren sidebar |
| `onMapClick` | `([lng, lat]) => void` | -- | Click nen ban do |
| `onMapReady` | `(map) => void` | -- | Fires khi map load xong |
| `renderMarkerPopup` | `(m) => ReactNode` | -- | Custom popup content |
| `renderMemberItem` | `(m, default) => ReactNode` | -- | Custom sidebar row |

**`LiveMapRef` (imperative API)**

```tsx
mapRef.current?.flyTo([106.63, 10.82], 14)
mapRef.current?.fitBounds([[102, 8], [110, 23]])
mapRef.current?.focusMember("user-123")  // bay den + mo popup
mapRef.current?.getMembers()             // MemberStatus[]
mapRef.current?.getMap()                 // MapInstance
```

---

### `<Report />`

Hub bao cao -- home screen voi 3 cards, navigate vao tung loai bao cao.

| Bao cao | Tabs | Mo ta |
|---|---|---|
| Hanh trinh | Tong hop / Chi tiet | Quang duong, thoi gian, toc do |
| Nhien lieu | Tong hop / Chi tiet | Dinh muc va chi phi nhien lieu |
| Gio hoat dong | -- | So nhan vien hoat dong theo gio |

Tat ca bang: sortable headers, sticky header + sticky totals row, scroll ngang/doc, DateRangePicker 2 thang.

```tsx
<Report from={Date.now() - 30 * 86_400_000} to={Date.now()} />
```

Sub-reports dung doc lap:

```tsx
import {
  TripSummaryReport, TripDetailReport,
  FuelSummaryReport, FuelDetailReport,
  ActivityTimeReport,
} from "@vietmap/tracking-sdk-react"

<TripSummaryReport range={{ from, to }} onRangeChange={setRange} pageSize={20} />
```

---

## Hooks

Tat ca hooks can `FleetworkProvider` trong tree. Tra ve `{ data, isLoading, error, refetch }`.

> Khong dung TanStack Query -- hooks thuan `useState/useEffect`.

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

Dung ngoai React -- Zustand, Redux, Node.js scripts, hoac bat ky context nao.

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

Override CSS variables qua `theme` prop cua `FleetworkProvider`:

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

| Field | Maps to CSS var | Mo ta |
|---|---|---|
| `colors.primary` | `--primary` | Mau chinh (buttons, focus ring) |
| `colors.background` | `--background` | Mau nen trang |
| `colors.text` | `--foreground` | Mau chu chinh |
| `colors.border` | `--border` | Mau vien |
| `colors.destructive` | `--destructive` | Mau loi/xoa |
| `colors.statusMoving` | `--status-moving` | Mau dot "dang di chuyen" |
| `colors.statusStopped` | `--status-stopped` | Mau dot "dung" |
| `colors.statusSignalLost` | `--status-signal-lost` | Mau dot "mat tin hieu" |
| `borderRadius` | `--radius` | Border radius (px) |
| `fontFamily` | `--dc-font` | Font chu |

---

## Mock Server (dev)

```bash
cd mock-server
node server.mjs
# -> http://localhost:3001  (3500 users, day du routes)
```

---

## Build

```bash
pnpm install
pnpm build
```

Output:
- `dist/tracking-sdk-react.js` -- ESM
- `dist/tracking-sdk-react.cjs` -- CommonJS
- `dist/index.d.ts` -- TypeScript declarations
- `dist/tracking-sdk-react.css` -- Styles (import rieng)

---

## License

MIT c VietMap