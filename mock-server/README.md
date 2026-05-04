# Fleetwork Mock Server

Fake Express-based API for testing the SDK locally while the real backend is being built. Implements every endpoint the SDK calls (Dashboard + LiveMap + GPS Tracking history/latest) plus a few Reports endpoints, with deterministic data so the UI stays stable across refreshes.

> This folder is gitignored. Reinstall deps after cloning.

## Run

```bash
cd mock-server
npm install
npm run dev        # auto-restart on file change
# or
npm start
```

Default base URL: `http://localhost:3001`

## Wire into the SDK

```tsx
<FleetworkProvider apiKey="dev-key" baseUrl="http://localhost:3001">
  <App />
</FleetworkProvider>
```

Or for controllers outside React:

```ts
initFleetwork({ apiKey: 'dev-key', baseUrl: 'http://localhost:3001' })
```

## Env vars

| Var            | Default | Purpose                                                           |
| -------------- | ------- | ----------------------------------------------------------------- |
| `PORT`         | `3001`  | HTTP port.                                                        |
| `MOCK_DELAY`   | `150`   | Artificial latency (ms) per request. Set `0` for instant.         |
| `MOCK_API_KEY` | —       | If set, server enforces `X-API-Key` header and rejects mismatches. |

Example:

```bash
PORT=4000 MOCK_DELAY=500 MOCK_API_KEY=dev-key npm start
```

## Endpoints implemented

### Dashboard (`/api/v1/dashboard/gps-manager`)

- `GET /summary?date=`
- `GET /employees?date=&page=&pageSize=&status=` — returns both `members` and `employees` keys
- `GET /activity-heatmap?from=&to=&metric=`
- `GET /fuel-tracking?from=&to=&groupBy=day|week|month`
- `GET /monthly-costs?from=&to=&currency=`
- `GET /` — composite all-in-one

### GPS Tracking (`/api/v1/gps-tracking`)

- `GET /latest`
- `GET /latest/users/:userId`
- `GET /latest/vehicles/:vehicleId`
- `GET /latest/devices/:deviceId`
- `GET /history?VehicleId=&UserId=&FromTime=&ToTime=&PageNumber=&PageSize=&SortDescending=`
- `POST /` and `POST /bulk` — accept writes and echo

### Reports

- `GET /api/v1/reports/trip/summary?from=&to=&page=&pageSize=`

## Seed data

12 members across 3 groups (Đội A/B/C), distributed across Hà Nội / HCM / Đà Nẵng / Nha Trang. Edit `MEMBERS` in `data.mjs` to add more.

Data is generated via a seeded PRNG (`mulberry32`) keyed off timestamps, so the same `date`/`from`/`to` query always returns the same response — good for visual regression checks.
