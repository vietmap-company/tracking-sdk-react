# @vietmap/tracking-sdk-react

React SDK for **Fleetwork GPS Tracking** — drop-in **Dashboard** & **LiveMap** components, React Query hooks, and framework-agnostic controllers.

📖 **Full documentation:** [https://fleetwork.vn/docs/sdk](https://fleetwork.vn/docs/sdk)

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
      baseUrl="https://live.fleetwork.vn"   // optional
      locale="vi"                            // 'vi' | 'en'
    >
      <Dashboard />
      <LiveMap height="600px" memberNameKey="userName" />
      <Report />
    </FleetworkProvider>
  )
}
```

> Full API reference, design guide and live examples are on the [docs site](https://fleetwork.vn/docs/sdk).

## Provider config

| Prop | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | Fleetwork API token (`X-API-Key`) |
| `apiKeyTilemap` | `string` | — | VietMap tile key |
| `baseUrl` | `string` | `https://live.fleetwork.vn` | API base URL, SDK automatically appends `/api/v1/` |
| `locale` | `'vi' \| 'en'` | `'vi'` | UI language |
| `theme` | `ThemeConfig` | — | CSS variable overrides |

## Components

### `<Dashboard />`

All-in-one dashboard with 5 widgets:
- `SummaryCards` — total distance / travel time / fuel cost
- `MemberReport` — per-user table with pagination
- `ActivityHeatmap` — hourly activity for date range
- `FuelTracking` — fuel consumption chart
- `MonthlyExpenses` — category breakdown

Each widget can also be imported standalone.

### `<Report />`

All-in-one report hub. Landing page with 3 cards → click into a report type:

- **Báo cáo hành trình** (Trip) — 2 tabs: Summary / Detail
- **Báo cáo tiêu thụ nhiên liệu** (Fuel) — 2 tabs: Summary / Detail
- **Báo cáo thời gian hoạt động** (Activity time) — single table

```tsx
<Report from={Date.now() - 30 * 86400_000} to={Date.now()} />
```

Sub-reports can also be used standalone (all accept `range`, `onRangeChange`, `onBack`, `onError`, `pageSize`):
`TripSummaryReport`, `TripDetailReport`, `FuelSummaryReport`, `FuelDetailReport`, `ActivityTimeReport`.

### `<LiveMap />`

Real-time fleet map with:
- Auto-polling member positions (`pollInterval`, default 10s)
- Member list sidebar, tile switcher, legend
- Click a member → popup → **View History** → playback controls with traveled/remaining route
- `ref` exposes `flyTo`, `fitBounds`, `focusMember`, `getMembers`, `getMap`
- `memberNameKey` — key inside `lastLocation.metadata` used as the display name (fallback: first 5 chars of `userId`)

```tsx
const mapRef = useRef<LiveMapRef>(null)
<LiveMap
  ref={mapRef}
  pollInterval={5000}
  defaultTile="terrain"
  onMarkerClick={(m) => console.log(m)}
/>
```

## Hooks (React Query)

```tsx
const { data } = useSummaryCards()
const { data } = useMemberReport()
const { data } = useActivityHeatmap({ from, to })
const { data } = useFuelTracking({ from, to })
const { data } = useMonthlyExpenses({ from, to })
const { data } = useMembers({ pollInterval: 10000 })
const { data } = useMember(userId)
const { data } = useHistoryRoute({ userId, startTime, endTime })

// Reports
const { data } = useTripSummaryReport({ from, to })
const { data } = useTripDetailReport({ from, to })
const { data } = useFuelSummaryReport({ from, to })
const { data } = useFuelDetailReport({ from, to })
const { data } = useActivityTimeReport({ from, to })
```

## Controllers (framework-agnostic)

Use outside React (Zustand, Redux, Node scripts):

```ts
import {
  initFleetwork,
  DashboardController,
  LiveMapController,
  ReportController,
} from '@vietmap/tracking-sdk-react'

initFleetwork({ apiKey: '...', apiKeyTilemap: '...' })

const summary = await DashboardController.getSummaryCards()
const members = await LiveMapController.getMembers()
const history = await LiveMapController.getHistoryRoute(userId, from, to)
const tripReport = await ReportController.getTripSummary({ from, to })
```

## Theming

Override CSS variables via `theme`:

```tsx
<FleetworkProvider
  theme={{
    colors: { primary: '#2563eb', background: '#0f172a', text: '#f1f5f9' },
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
  }}
/>
```

## Build

```bash
pnpm install
pnpm build
```

Outputs `dist/tracking-sdk-react.{js,cjs}`, `dist/index.d.ts`, `dist/tracking-sdk-react.css`.

## Links

- 📖 [Documentation](https://fleetwork.vn/docs/sdk)
- 🐛 [Report an issue](https://github.com/vietmap-company/tracking-sdk-react/issues)

## License

MIT © VietMap
