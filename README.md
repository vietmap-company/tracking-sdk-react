# @vietmap/tracking-sdk-react

React SDK for **GPS Tracking** — drop-in **Dashboard**, **LiveMap**, and **Report** components built on React Query and VietmapGL.

## Install

```bash
npm install @vietmap/tracking-sdk-react
# or
pnpm add @vietmap/tracking-sdk-react
```

Peer deps: `react >= 16.8`, `react-dom >= 16.8`.

## Quick start

```tsx
import {
  FleetworkProvider,
  Dashboard,
  LiveMap,
  Report,
} from '@vietmap/tracking-sdk-react'
import '@vietmap/tracking-sdk-react/styles.css'

export default function App() {
  return (
    <FleetworkProvider
      apiKey="YOUR_API_TOKEN"
      apiKeyTilemap="YOUR_VIETMAP_TILE_KEY"
      baseUrl="https://your-api-server.com"
      locale="vi"
    >
      <Dashboard />
      <LiveMap height="600px" memberNameKey="userName" />
      <Report />
    </FleetworkProvider>
  )
}
```

## Provider

| Prop | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | API token (`X-API-Key` header) |
| `apiKeyTilemap` | `string` | — | VietMap tile key for map rendering |
| `baseUrl` | `string` | — | API base URL — SDK appends `/api/v1/` automatically |
| `locale` | `'vi' \| 'en'` | `'vi'` | UI language |
| `theme` | `ThemeConfig` | — | CSS variable overrides (see Theming) |

## Components

### `<Dashboard />`

All-in-one dashboard with 5 widgets. Each widget can also be imported standalone.

| Widget | Description |
|---|---|
| `SummaryCards` | Total distance / travel time / fuel cost for a date |
| `MemberReport` | Per-user table with pagination and status badges |
| `ActivityHeatmap` | Hourly activity heatmap over a date range |
| `FuelTracking` | Fuel consumption bar/line chart |
| `MonthlyExpenses` | Monthly cost breakdown chart |

```tsx
import { SummaryCards, MemberReport } from '@vietmap/tracking-sdk-react'

<SummaryCards date={Date.now()} pollInterval={30_000} />
<MemberReport pageSize={20} onRowClick={(m) => console.log(m)} />
```

---

### `<LiveMap />`

Real-time fleet map backed by VietmapGL with GPU-accelerated clustering.

**Key features:**
- Auto-polling member positions (`pollInterval`, default 10 s)
- GeoJSON clustering — renders 3 000+ markers as GL circle layers (no DOM nodes), zoom to expand clusters
- Spiderfy — click overlapping markers at the same coordinate to fan them out and select individually
- Member sidebar — infinite scroll, sorted **moving → stopped → signal lost**, with live search
- Tile switcher (terrain / satellite / road)
- Click a marker → popup → **View History** → animated playback with traveled/remaining route overlay
- `ref` API: `flyTo`, `fitBounds`, `focusMember`, `getMembers`, `getMap`

```tsx
import { useRef } from 'react'
import { LiveMap, type LiveMapRef, type MemberStatus } from '@vietmap/tracking-sdk-react'

const mapRef = useRef<LiveMapRef>(null)

<LiveMap
  ref={mapRef}
  height="600px"
  center={[106.63, 10.82]}
  zoom={6}
  defaultTile="terrain"
  pollInterval={10_000}
  maxUsers={3000}
  clusterRadius={50}
  clusterMaxZoom={14}
  memberNameKey="userName"
  showList
  showLegend
  showTileSwitcher
  onMapReady={(map) => console.log('ready', map.getZoom())}
  onMarkerClick={(m: MemberStatus) => console.log(m.name)}
/>
```

**`LiveMapProps`**

| Prop | Type | Default | Description |
|---|---|---|---|
| `height` | `string` | `'100dvh'` | Map container height |
| `center` | `[lng, lat]` | `[106.6, 10.8]` | Initial map center |
| `zoom` | `number` | `11` | Initial zoom level |
| `defaultTile` | `'terrain' \| 'satellite' \| 'road'` | `'terrain'` | Map tile style |
| `pollInterval` | `number` | `10000` | Member position refresh interval (ms) |
| `maxUsers` | `number` | `3000` | Max users fetched per poll |
| `clusterRadius` | `number` | `50` | Cluster radius in pixels |
| `clusterMaxZoom` | `number` | `14` | Zoom level at which clustering stops |
| `memberNameKey` | `string` | — | Key in `lastLocation.metadata` to use as display name |
| `members` | `MemberStatus[]` | — | Override with local data (skips API polling) |
| `showList` | `boolean` | `true` | Show member sidebar |
| `showLegend` | `boolean` | `true` | Show status legend |
| `showTileSwitcher` | `boolean` | `true` | Show tile switcher control |
| `onMarkerClick` | `(m) => void \| boolean` | — | Marker click callback; return `false` to suppress default popup |
| `onMemberClick` | `(m) => void \| boolean` | — | Sidebar item click callback |
| `onMapClick` | `([lng, lat]) => void` | — | Map background click |
| `onMapReady` | `(map) => void` | — | Fires once after map loads |
| `renderMarkerPopup` | `(m) => ReactNode` | — | Custom popup content |
| `renderMemberItem` | `(m, default) => ReactNode` | — | Custom sidebar row renderer |

**`LiveMapRef` (imperative API)**

```tsx
mapRef.current?.flyTo([106.63, 10.82], 14)
mapRef.current?.fitBounds([[102, 8], [110, 23]])
mapRef.current?.focusMember('user-123')   // fly to + open popup
mapRef.current?.getMembers()              // MemberStatus[]
mapRef.current?.getMap()                  // MapInstance
```

---

### `<Report />`

All-in-one report hub. Landing page with 3 cards → navigate into report types.

| Report | Tabs | Description |
|---|---|---|
| Trip | Summary / Detail | Per-user trip totals and individual trip rows |
| Fuel | Summary / Detail | Fuel consumption and cost per user/trip |
| Activity time | — | Hourly active/inactive counts and distance |

All report tables include row numbers, zebra striping, right-aligned numeric columns, sortable headers, and paginator with page number buttons + first/last navigation.

```tsx
<Report from={Date.now() - 30 * 86_400_000} to={Date.now()} />
```

Sub-reports can also be used standalone:

```tsx
import {
  TripSummaryReport,
  TripDetailReport,
  FuelSummaryReport,
  FuelDetailReport,
  ActivityTimeReport,
} from '@vietmap/tracking-sdk-react'

// All accept: range, onRangeChange, onBack, onError, pageSize
<TripSummaryReport
  range={{ from, to }}
  onRangeChange={setRange}
  pageSize={20}
/>
```

---

## Hooks (React Query)

All hooks require `FleetworkProvider` in the tree. They return `{ data, isLoading, error, refetch, isFetching }`.

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

// Reports
const { data } = useTripSummaryReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useTripDetailReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useFuelSummaryReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useFuelDetailReport({ from, to, page?, pageSize?, sortBy?, sortDesc? })
const { data } = useActivityTimeReport({ from, to, page?, pageSize? })
```

---

## Controllers (framework-agnostic)

Use outside React — in Zustand actions, Redux thunks, Node scripts, or any non-React context.

```ts
import {
  initFleetwork,
  DashboardController,
  LiveMapController,
  ReportController,
} from '@vietmap/tracking-sdk-react'

initFleetwork({ apiKey: '...', apiKeyTilemap: '...', baseUrl: '...' })

const summary    = await DashboardController.getSummaryCards()
const members    = await LiveMapController.getMembers({ pageSize: 3000 })
const history    = await LiveMapController.getHistoryRoute(userId, from, to)
const tripReport = await ReportController.getTripSummary({ from, to })
const fuelReport = await ReportController.getFuelSummary({ from, to })
```

---

## Theming

Override CSS variables via the `theme` prop:

```tsx
<FleetworkProvider
  theme={{
    colors: {
      primary: '#2563eb',
      background: '#0f172a',
      text: '#f1f5f9',
    },
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
  }}
>
```

---

## Build

```bash
pnpm install
pnpm build
```

Outputs:
- `dist/tracking-sdk-react.js` (ESM)
- `dist/tracking-sdk-react.cjs` (CommonJS)
- `dist/index.d.ts` (TypeScript declarations)
- `dist/tracking-sdk-react.css` (styles)

---

## License

MIT © VietMap
