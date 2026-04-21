# Fleetwork SDK Example (React + TypeScript)

Example app để demo `@vietmap/fleetwork-tracking-sdk-react` với routing:

- `/dashboard` — dùng `<Dashboard />` mặc định
- `/livemap` — dùng `<LiveMap />`
- `/controller` — demo `DashboardController` + `LiveMapController`
- `/widgets` — custom layout với từng dashboard widget

## 1) Cài dependencies

```bash
pnpm install
```

## 2) Cấu hình env

Copy `.env.example` thành `.env.local` và điền key:

```bash
VITE_FLEETWORK_API_KEY=your_api_token
VITE_FLEETWORK_TILEMAP_KEY=your_tilemap_api_key
VITE_FLEETWORK_BASE_URL=https://tracking.fleetwork.vn
```

- `VITE_FLEETWORK_API_KEY`: APITOKEN cho backend API
- `VITE_FLEETWORK_TILEMAP_KEY`: APIKEYTILEMAP cho VietMap tile style

## 3) Chạy dev

```bash
pnpm dev
```

Mở `http://localhost:5173` (hoặc port Vite báo trong terminal).

## Vị trí

Example này nằm trực tiếp trong source SDK:

`D:\dev\dricon\products\fleetwork-tracking-sdk-react\example`
