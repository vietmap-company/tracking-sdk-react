# Analytics API — Hướng dẫn tích hợp cho Frontend (React)

> **Audience:** Frontend developer (React)
> **Base URL:** `http://<host>:5029` (Fleetwork.Web gateway)
> **Auth:** Gọi qua Fleetwork.Web — chỉ cần `X-API-Key`, gateway tự inject `X-Internal-Token` + `X-Account-Id`

---

## Mục lục

- [Analytics API — Hướng dẫn tích hợp cho Frontend (React)](#analytics-api--hướng-dẫn-tích-hợp-cho-frontend-react)
  - [Mục lục](#mục-lục)
  - [Authentication](#authentication)
  - [Timestamps](#timestamps)
  - [TypeScript Types](#typescript-types)
  - [Dashboard API](#dashboard-api)
    - [2.1 GPS Summary (KPI tổng quan ngày)](#21-gps-summary-kpi-tổng-quan-ngày)
    - [2.2 GPS Users (Bảng thống kê theo user)](#22-gps-users-bảng-thống-kê-theo-user)
    - [2.3 Activity Heatmap (Heatmap giờ hoạt động)](#23-activity-heatmap-heatmap-giờ-hoạt-động)
    - [2.4 Fuel Tracking (Xu hướng nhiên liệu)](#24-fuel-tracking-xu-hướng-nhiên-liệu)
    - [2.5 Monthly Costs (Chi phí theo tháng)](#25-monthly-costs-chi-phí-theo-tháng)
    - [2.6 All-in-One Dashboard (Tất cả trong một request)](#26-all-in-one-dashboard-tất-cả-trong-một-request)
  - [Reports API](#reports-api)
    - [3.1 Trip Summary (Tổng hợp hành trình)](#31-trip-summary-tổng-hợp-hành-trình)
    - [3.2 Trip Detail (Chi tiết hành trình theo ngày)](#32-trip-detail-chi-tiết-hành-trình-theo-ngày)
    - [3.3 Fuel Summary (Tổng hợp nhiên liệu)](#33-fuel-summary-tổng-hợp-nhiên-liệu)
    - [3.4 Fuel Detail (Chi tiết nhiên liệu theo ngày)](#34-fuel-detail-chi-tiết-nhiên-liệu-theo-ngày)
    - [3.5 Activity Time (Thống kê hoạt động theo giờ)](#35-activity-time-thống-kê-hoạt-động-theo-giờ)
  - [Error Responses](#error-responses)
  - [Rate Limiting](#rate-limiting)
  - [Caching](#caching)
  - [React Fetch Helper](#react-fetch-helper)

---

## Authentication

Tất cả request gửi qua **Fleetwork.Web** (port 5029). Gateway đã tự xử lý auth nội bộ.

```
FE (React) → Fleetwork.Web:5029 → [inject X-Internal-Token + X-Account-Id] → AnalyticsApi:7102
```

**Header bắt buộc:**

| Header | Giá trị |
|--------|---------|
| `X-API-Key` | API key của account (lấy từ màn hình quản lý API Key) |
| `Content-Type` | `application/json` *(chỉ khi có body)* |

> ⚠️ **Không cần** truyền `X-Internal-Token` hay `X-Account-Id` — gateway tự inject.

**Ví dụ fetch:**

```typescript
const response = await fetch('/api/v1/dashboard/gps-manager/summary', {
  headers: {
    'X-API-Key': 'your-api-key-here',
  },
});
```

---

## Timestamps

Tất cả param `date`, `from`, `to` đều là **Unix milliseconds (UTC)**.

> Múi giờ nghiệp vụ là **UTC+7**. Khi bỏ trống, API mặc định lấy "đầu ngày hôm nay UTC+7".

**Helper tính timestamp:**

```typescript
const UTC7_OFFSET_MS = 7 * 3600 * 1000;

/** Đầu ngày hôm nay theo UTC+7, trả về UTC ms */
export function todayStartMs(): number {
  const nowLocal = new Date(Date.now() + UTC7_OFFSET_MS);
  const sodLocal = Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate(),
    0, 0, 0, 0
  );
  return sodLocal - UTC7_OFFSET_MS;
}

/** Đầu năm hiện tại theo UTC+7 */
export function yearStartMs(year = new Date().getFullYear()): number {
  return new Date(`${year}-01-01T00:00:00+07:00`).getTime();
}

/** Cuối năm hiện tại theo UTC+7 */
export function yearEndMs(year = new Date().getFullYear()): number {
  return new Date(`${year}-12-31T23:59:59+07:00`).getTime();
}

/** N ngày trước (so với đầu ngày hôm nay) */
export function daysAgoMs(days: number): number {
  return todayStartMs() - days * 86400000;
}
```

---

## TypeScript Types

Paste vào `src/types/analytics.ts`:

```typescript
// ─── Shared ───────────────────────────────────────────────────────────────

export interface TravelTimeDto {
  totalSeconds: number;   // tổng giây
  formatted: string;      // "4h 30m"
}

export interface PaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface LocationDto {
  lat: number;
  lng: number;
  address: string | null;
}

export interface ReportPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────

export interface GpsSummaryResponse {
  date: number;
  activeUsers: { active: number; total: number };
  totalDistance: { value: number; unit: string };
  totalTravelTime: TravelTimeDto;
  totalFuelCost: { value: number; currency: string; formatted: string };
  generatedAt: number;
}

export interface GpsUserStat {
  userId: string;
  distance: { value: number; unit: string };
  travelTime: TravelTimeDto;
  fuel: {
    consumedLiters: number;
    costVnd: number;
    costFormatted: string;
    efficiencyKmPerL: number;
  };
  status: 'moving' | 'stopped' | 'signal_lost';
  statusLabel: string;
  lastLocation: {
    lat: number;
    lng: number;
    speed: number;
    time: number;
    address: string | null;
  } | null;
  lastSeenAt: number | null;
  metaData: unknown | null;
}

export interface GpsUsersResponse {
  date: number;
  summary: { total: number; moving: number; stopped: number; signalLost: number };
  users: GpsUserStat[];
  pagination: PaginationDto;
}

export interface HeatmapCell {
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  date: number;
  hour: number;       // 0–23
  value: number;
  label: string;      // "245.3 km" hoặc "13 pts"
}

export interface ActivityHeatmapResponse {
  from: number;
  to: number;
  metric: 'distance' | 'points';
  resolution: 'hour';
  cells: HeatmapCell[];
  maxValue: number;
  minValue: number;
  totalCells: number;
}

export interface FuelSeries {
  period: string;         // "2026-04" | "2026-W17" | "2026-04-24"
  label: string;          // "T4" | "T17" | "24/04"
  distanceKm: number;
  fuelLiters: number;
  efficiencyKmPerL: number;
}

export interface FuelTrackingResponse {
  from: number;
  to: number;
  groupBy: 'day' | 'week' | 'month';
  fuelEfficiency: { value: number; unit: string; trend: 'improving' | 'declining' | 'stable' };
  series: FuelSeries[];
  totals: { totalDistanceKm: number; totalFuelLiters: number; avgEfficiencyKmPerL: number };
}

export interface MonthCost {
  month: number;    // 1–12
  label: string;    // "Apr"
  costs: { fuel: number; maintenance: number; insurance: number; other: number; total: number };
}

export interface MonthlyCostResponse {
  from: number;
  to: number;
  currency: string;
  months: MonthCost[];
  totals: { fuel: number; maintenance: number; insurance: number; other: number; grandTotal: number };
  categories: Array<{ key: string; label: string; color: string }>;
}

export interface AllInOneDashboardResponse {
  summary: GpsSummaryResponse;
  users: GpsUsersResponse;
  heatmap: ActivityHeatmapResponse;
  fuelTracking: FuelTrackingResponse;
  monthlyCosts: MonthlyCostResponse;
}

// ─── Reports ──────────────────────────────────────────────────────────────

export interface TripSummaryUser {
  userId: string;
  totalDistanceKm: number;
  travelTime: TravelTimeDto;
  stopTime: TravelTimeDto;
  maxSpeedKmh: number;
  minSpeedKmh: number;
  tripDays: number;
  metaData: unknown | null;
}

export interface TripSummaryResponse {
  reportType: string;
  from: number;
  to: number;
  users: TripSummaryUser[];
  pagination: ReportPaginationDto;
  generatedAt: number;
}

export interface TripDetailRow {
  date: number;
  userId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  travelTime: TravelTimeDto;
  stopTime: TravelTimeDto;
  maxSpeedKmh: number;
  minSpeedKmh: number;
  startLocation: LocationDto | null;
  endLocation: LocationDto | null;
  metaData: unknown | null;
}

export interface TripDetailResponse {
  reportType: string;
  trips: TripDetailRow[];
  pagination: ReportPaginationDto;
  generatedAt: number;
}

export interface FuelSummaryUser {
  userId: string;
  distanceKm: number;
  travelTime: TravelTimeDto;
  fuelStandardLiters: number;
  totalCostVnd: number;
  totalCostFormatted: string;
  metaData: unknown | null;
}

export interface FuelSummaryResponse {
  reportType: string;
  fuelConfig: { efficiencyLper100km: number; pricePerLiterVnd: number };
  users: FuelSummaryUser[];
  totals: { distanceKm: number; fuelStandardLiters: number; totalCostVnd: number; totalCostFormatted: string };
  pagination: ReportPaginationDto;
  generatedAt: number;
}

export interface FuelDetailRow {
  date: number;
  userId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  travelTime: TravelTimeDto;
  fuelStandardLiters: number;
  fuelPricePerLiterVnd: number;
  totalCostVnd: number;
  totalCostFormatted: string;
  metaData: unknown | null;
}

export interface FuelDetailResponse {
  reportType: string;
  trips: FuelDetailRow[];
  totals: { distanceKm: number; fuelStandardLiters: number; totalCostVnd: number; totalCostFormatted: string };
  pagination: ReportPaginationDto;
  generatedAt: number;
}

export interface ActivityTimeRow {
  date: number;
  hour: number;             // 0–23
  activeUserCount: number;
  inactiveUserCount: number;
  totalDistanceKm: number;
}

export interface ActivityTimeResponse {
  reportType: string;
  totalUsers: number;
  rows: ActivityTimeRow[];
  totals: { totalDistanceKm: number };
  pagination: ReportPaginationDto;
  generatedAt: number;
}
```

---

## Dashboard API

**Base path:** `/api/v1/dashboard/gps-manager`

---

### 2.1 GPS Summary (KPI tổng quan ngày)

```
GET /api/v1/dashboard/gps-manager/summary
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `date` | `number` (ms) | Không | Đầu ngày hôm nay UTC+7 | Ngày cần xem |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager/summary?date=1776963600000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "date": 1776963600000,
  "activeUsers": {
    "active": 3,
    "total": 6
  },
  "totalDistance": {
    "value": 247.83,
    "unit": "km"
  },
  "totalTravelTime": {
    "totalSeconds": 14400,
    "formatted": "4h 0m"
  },
  "totalFuelCost": {
    "value": 406000,
    "currency": "VND",
    "formatted": "406,000 VND"
  },
  "generatedAt": 1776985000000
}
```

**React usage**

```typescript
import { GpsSummaryResponse } from '@/types/analytics';

const data = await fetch(
  `/api/v1/dashboard/gps-manager/summary?date=${todayStartMs()}`,
  { headers: { 'X-API-Key': apiKey } }
).then<GpsSummaryResponse>(r => r.json());
```

---

### 2.2 GPS Users (Bảng thống kê theo user)

```
GET /api/v1/dashboard/gps-manager/users
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `date` | `number` (ms) | Không | Đầu ngày hôm nay UTC+7 | Ngày cần xem |
| `status` | `string` | Không | *(tất cả)* | Lọc: `moving` \| `stopped` \| `signal_lost` |
| `page` | `number` | Không | `1` | Trang (1-based) |
| `pageSize` | `number` | Không | `20` | Số item/trang (tối đa 100) |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager/users?date=1776963600000&status=moving&page=1&pageSize=20
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "date": 1776963600000,
  "summary": {
    "total": 6,
    "moving": 2,
    "stopped": 3,
    "signalLost": 1
  },
  "users": [
    {
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "distance": { "value": 45.2, "unit": "km" },
      "travelTime": { "totalSeconds": 3600, "formatted": "1h 0m" },
      "fuel": {
        "consumedLiters": 3.164,
        "costVnd": 72772,
        "costFormatted": "72,772 VND",
        "efficiencyKmPerL": 14.28
      },
      "status": "moving",
      "statusLabel": "Đang di chuyển",
      "lastLocation": {
        "lat": 21.028511,
        "lng": 105.804817,
        "speed": 42,
        "time": 1776980000000,
        "address": null
      },
      "lastSeenAt": 1776980000000,
      "metaData": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 6,
    "totalPages": 1
  }
}
```

**Status values**

| Value | Nghĩa |
|-------|-------|
| `moving` | Đang di chuyển (speed > 0) |
| `stopped` | Đã dừng, tín hiệu < 30 phút trước |
| `signal_lost` | Mất tín hiệu ≥ 30 phút |

---

### 2.3 Activity Heatmap (Heatmap giờ hoạt động)

```
GET /api/v1/dashboard/gps-manager/activity-heatmap
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | Không | 14 ngày trước | Bắt đầu khoảng thời gian |
| `to` | `number` (ms) | Không | Hiện tại | Kết thúc khoảng thời gian |
| `metric` | `string` | Không | `distance` | `distance` (km) \| `points` (số điểm GPS) |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user cụ thể |
| `resolution` | `string` | Không | `hour` | Luôn là `hour` |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager/activity-heatmap?from=1775754000000&to=1777049999000&metric=distance
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "from": 1775754000000,
  "to": 1777049999000,
  "metric": "distance",
  "resolution": "hour",
  "maxValue": 2289.54,
  "minValue": 0.0,
  "totalCells": 360,
  "cells": [
    {
      "dayOfWeek": "Thu",
      "date": 1775754000000,
      "hour": 15,
      "value": 245.3,
      "label": "245.3 km"
    },
    {
      "dayOfWeek": "Thu",
      "date": 1775754000000,
      "hour": 0,
      "value": 0.0,
      "label": "0 km"
    }
  ]
}
```

**Ghi chú render:**
- `totalCells` = số ngày × 24 (15 ngày → 360 cells)
- Cells có `value: 0` vẫn được trả về (grid đầy đủ để render chart)
- Map `value` sang màu: 0 → transparent, `maxValue` → tối nhất
- `label`: `"245.3 km"` với distance, `"13 pts"` với points
- `dayOfWeek`: `Mon` `Tue` `Wed` `Thu` `Fri` `Sat` `Sun`

---

### 2.4 Fuel Tracking (Xu hướng nhiên liệu)

```
GET /api/v1/dashboard/gps-manager/fuel-tracking
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | Không | 1/1 năm hiện tại | Bắt đầu |
| `to` | `number` (ms) | Không | Hiện tại | Kết thúc |
| `groupBy` | `string` | Không | `week` | `day` \| `week` \| `month` |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager/fuel-tracking?from=1767200400000&to=1777049999000&groupBy=month
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "from": 1767200400000,
  "to": 1777049999000,
  "groupBy": "month",
  "fuelEfficiency": {
    "value": 14.28,
    "unit": "km/L",
    "trend": "stable"
  },
  "series": [
    {
      "period": "2026-04",
      "label": "T4",
      "distanceKm": 247.83,
      "fuelLiters": 17.348,
      "efficiencyKmPerL": 14.28
    }
  ],
  "totals": {
    "totalDistanceKm": 247.83,
    "totalFuelLiters": 17.348,
    "avgEfficiencyKmPerL": 14.28
  }
}
```

**Format `period` theo `groupBy`:**

| groupBy | `period` | `label` |
|---------|----------|---------|
| `day` | `"2026-04-24"` | `"24/04"` |
| `week` | `"2026-W17"` | `"T17"` |
| `month` | `"2026-04"` | `"T4"` |

**`trend` values:**

| Value | Nghĩa |
|-------|-------|
| `improving` | Hiệu suất nửa sau > nửa đầu >5% |
| `declining` | Hiệu suất nửa sau < nửa đầu >5% |
| `stable` | Chênh lệch ≤ 5% |

---

### 2.5 Monthly Costs (Chi phí theo tháng)

```
GET /api/v1/dashboard/gps-manager/monthly-costs
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | Không | 1/1 năm hiện tại | Bắt đầu |
| `to` | `number` (ms) | Không | 31/12 năm hiện tại | Kết thúc |
| `currency` | `string` | Không | `VND` | Mã tiền tệ (chỉ dùng để hiển thị) |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager/monthly-costs?from=1767200400000&to=1798649999000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "from": 1767200400000,
  "to": 1798649999000,
  "currency": "VND",
  "months": [
    {
      "month": 4,
      "label": "Apr",
      "costs": {
        "fuel": 4182393,
        "maintenance": 0,
        "insurance": 0,
        "other": 0,
        "total": 4182393
      }
    }
  ],
  "totals": {
    "fuel": 4182393,
    "maintenance": 0,
    "insurance": 0,
    "other": 0,
    "grandTotal": 4182393
  },
  "categories": [
    { "key": "fuel",        "label": "Nhiên liệu",   "color": "#F97316" },
    { "key": "maintenance", "label": "Bảo dưỡng",    "color": "#3B82F6" },
    { "key": "insurance",   "label": "Bảo hiểm",     "color": "#10B981" },
    { "key": "other",       "label": "Khác",          "color": "#8B5CF6" }
  ]
}
```

**Ghi chú:**
- Hiện tại chỉ có `fuel` được tính (từ dữ liệu GPS). `maintenance`, `insurance`, `other` luôn = 0.
- Tháng không có data sẽ **không xuất hiện** trong mảng `months`.

---

### 2.6 All-in-One Dashboard (Tất cả trong một request)

```
GET /api/v1/dashboard/gps-manager
```

Gọi một request, nhận đủ data cho toàn bộ trang Dashboard.

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `date` | `number` (ms) | Không | Đầu ngày hôm nay UTC+7 | Ngày cho summary/users |

**Request ví dụ**

```http
GET /api/v1/dashboard/gps-manager?date=1776963600000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "summary": { /* giống 2.1 */ },
  "users": { /* giống 2.2, page=1, pageSize=20 */ },
  "heatmap": { /* giống 2.3, last 14 ngày, metric=distance */ },
  "fuelTracking": { /* giống 2.4, năm hiện tại, groupBy=month */ },
  "monthlyCosts": { /* giống 2.5, năm hiện tại */ }
}
```

> **Khuyến nghị:** Dùng endpoint này cho lần load đầu tiên của trang Dashboard để giảm số lượng request.

---

## Reports API

**Base path:** `/api/v1/reports`

> **Lưu ý:** `from` và `to` là **bắt buộc** cho tất cả Reports API.

---

### 3.1 Trip Summary (Tổng hợp hành trình)

Thống kê tổng hợp theo từng user trong một khoảng thời gian.

```
GET /api/v1/reports/trip/summary
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | **Có** | — | Bắt đầu khoảng thời gian |
| `to` | `number` (ms) | **Có** | — | Kết thúc khoảng thời gian |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user UUID |
| `groupId` | `string` | Không | *(tất cả)* | Lọc theo group |
| `page` | `number` | Không | `1` | Trang |
| `pageSize` | `number` | Không | `20` | Số item/trang (tối đa 200) |
| `sortBy` | `string` | Không | `totalDistance` | Cột sắp xếp |
| `sortDesc` | `boolean` | Không | `true` | Giảm dần? |

**Request ví dụ**

```http
GET /api/v1/reports/trip/summary?from=1776963600000&to=1777049999000&page=1&pageSize=20&sortBy=totalDistance&sortDesc=true
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "reportType": "trip-summary",
  "from": 1776963600000,
  "to": 1777049999000,
  "users": [
    {
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "totalDistanceKm": 125.4,
      "travelTime": { "totalSeconds": 14400, "formatted": "4h 0m" },
      "stopTime": { "totalSeconds": 3600, "formatted": "1h 0m" },
      "maxSpeedKmh": 95.0,
      "minSpeedKmh": 0.0,
      "tripDays": 1,
      "metaData": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 3,
    "totalPages": 1
  },
  "generatedAt": 1777055000000
}
```

---

### 3.2 Trip Detail (Chi tiết hành trình theo ngày)

Mỗi row là một ngày hoạt động của một user.

```
GET /api/v1/reports/trip/detail
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | **Có** | — | Bắt đầu |
| `to` | `number` (ms) | **Có** | — | Kết thúc |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user UUID |
| `groupId` | `string` | Không | *(tất cả)* | Lọc theo group |
| `page` | `number` | Không | `1` | Trang |
| `pageSize` | `number` | Không | `50` | Số item/trang (tối đa 500) |
| `sortBy` | `string` | Không | `date` | Cột sắp xếp |
| `sortDesc` | `boolean` | Không | `true` | Giảm dần? |

**Request ví dụ**

```http
GET /api/v1/reports/trip/detail?from=1776963600000&to=1777049999000&userId=3fa85f64-5717-4562-b3fc-2c963f66afa6
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "reportType": "trip-detail",
  "trips": [
    {
      "date": 1776963600000,
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "startTime": 1776970800000,
      "endTime": 1777006800000,
      "distanceKm": 125.4,
      "travelTime": { "totalSeconds": 14400, "formatted": "4h 0m" },
      "stopTime": { "totalSeconds": 3600, "formatted": "1h 0m" },
      "maxSpeedKmh": 95.0,
      "minSpeedKmh": 0.0,
      "startLocation": { "lat": 21.028511, "lng": 105.804817, "address": "Hoàn Kiếm, Hà Nội" },
      "endLocation": { "lat": 20.995278, "lng": 105.843889, "address": null },
      "metaData": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 1,
    "totalPages": 1
  },
  "generatedAt": 1777055000000
}
```

---

### 3.3 Fuel Summary (Tổng hợp nhiên liệu)

Tổng hợp chi phí nhiên liệu theo từng user trong khoảng thời gian.

```
GET /api/v1/reports/fuel/summary
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | **Có** | — | Bắt đầu |
| `to` | `number` (ms) | **Có** | — | Kết thúc |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user |
| `groupId` | `string` | Không | *(tất cả)* | Lọc theo group |
| `page` | `number` | Không | `1` | Trang |
| `pageSize` | `number` | Không | `20` | Số item/trang (tối đa 200) |
| `sortBy` | `string` | Không | `distanceKm` | Cột sắp xếp |
| `sortDesc` | `boolean` | Không | `true` | Giảm dần? |

**Request ví dụ**

```http
GET /api/v1/reports/fuel/summary?from=1776963600000&to=1777049999000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "reportType": "fuel-summary",
  "fuelConfig": {
    "efficiencyLper100km": 7.0,
    "pricePerLiterVnd": 23000
  },
  "users": [
    {
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "distanceKm": 125.4,
      "travelTime": { "totalSeconds": 14400, "formatted": "4h 0m" },
      "fuelStandardLiters": 8.778,
      "totalCostVnd": 201894,
      "totalCostFormatted": "201,894 VND",
      "metaData": null
    }
  ],
  "totals": {
    "distanceKm": 125.4,
    "fuelStandardLiters": 8.778,
    "totalCostVnd": 201894,
    "totalCostFormatted": "201,894 VND"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  },
  "generatedAt": 1777055000000
}
```

**Cách tính nhiên liệu:**
- Tiêu hao: **7.0 L/100km**
- Giá: **23,000 VND/lít**

---

### 3.4 Fuel Detail (Chi tiết nhiên liệu theo ngày)

Mỗi row là một ngày + một user, kèm chi phí nhiên liệu.

```
GET /api/v1/reports/fuel/detail
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | **Có** | — | Bắt đầu |
| `to` | `number` (ms) | **Có** | — | Kết thúc |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user |
| `groupId` | `string` | Không | *(tất cả)* | Lọc theo group |
| `page` | `number` | Không | `1` | Trang |
| `pageSize` | `number` | Không | `50` | Số item/trang (tối đa 500) |
| `sortBy` | `string` | Không | `date` | Cột sắp xếp |
| `sortDesc` | `boolean` | Không | `true` | Giảm dần? |

**Request ví dụ**

```http
GET /api/v1/reports/fuel/detail?from=1776963600000&to=1777049999000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "reportType": "fuel-detail",
  "trips": [
    {
      "date": 1776963600000,
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "startTime": 1776970800000,
      "endTime": 1777006800000,
      "distanceKm": 125.4,
      "travelTime": { "totalSeconds": 14400, "formatted": "4h 0m" },
      "fuelStandardLiters": 8.778,
      "fuelPricePerLiterVnd": 23000,
      "totalCostVnd": 201894,
      "totalCostFormatted": "201,894 VND",
      "metaData": null
    }
  ],
  "totals": {
    "distanceKm": 125.4,
    "fuelStandardLiters": 8.778,
    "totalCostVnd": 201894,
    "totalCostFormatted": "201,894 VND"
  },
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 1,
    "totalPages": 1
  },
  "generatedAt": 1777055000000
}
```

---

### 3.5 Activity Time (Thống kê hoạt động theo giờ)

Số user hoạt động tại từng bucket ngày × giờ.

```
GET /api/v1/reports/activity-time
```

**Query Parameters**

| Param | Type | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|---------|-------|
| `from` | `number` (ms) | **Có** | — | Bắt đầu |
| `to` | `number` (ms) | **Có** | — | Kết thúc |
| `userId` | `string` | Không | *(tất cả)* | Lọc theo user |
| `groupId` | `string` | Không | *(tất cả)* | Lọc theo group |
| `page` | `number` | Không | `1` | Trang |
| `pageSize` | `number` | Không | `50` | Số item/trang (tối đa 500) |

**Request ví dụ**

```http
GET /api/v1/reports/activity-time?from=1776963600000&to=1777049999000
X-API-Key: your-api-key
```

**Response 200**

```json
{
  "reportType": "activity-time",
  "totalUsers": 6,
  "rows": [
    {
      "date": 1776963600000,
      "hour": 8,
      "activeUserCount": 4,
      "inactiveUserCount": 2,
      "totalDistanceKm": 35.2
    },
    {
      "date": 1776963600000,
      "hour": 9,
      "activeUserCount": 5,
      "inactiveUserCount": 1,
      "totalDistanceKm": 61.7
    }
  ],
  "totals": {
    "totalDistanceKm": 247.83
  },
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 24,
    "totalPages": 1
  },
  "generatedAt": 1777055000000
}
```

**Ghi chú:** Chỉ trả về các giờ có data (giờ không hoạt động bị bỏ qua).

---

## Error Responses

| Status | Body | Khi nào |
|--------|------|---------|
| `400 Bad Request` | `{ "error": "BAD_REQUEST", "message": "...", "code": 400 }` | Param không hợp lệ (vd: `metric` sai, thiếu `from`/`to`) |
| `401 Unauthorized` | `{ "message": "AccountId not resolved" }` | API key không hợp lệ hoặc thiếu |
| `429 Too Many Requests` | *(gateway body)* | Vượt rate limit |
| `501 Not Implemented` | `{ "error": "NOT_IMPLEMENTED", "message": "Export not yet available", "code": 501 }` | Truyền `format` param (export chưa có) |

**React error handler ví dụ:**

```typescript
async function fetchAnalytics<T>(url: string, apiKey: string): Promise<T> {
  const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });

  if (res.status === 401) throw new Error('API key không hợp lệ');
  if (res.status === 429) throw new Error('Quá nhiều request, thử lại sau');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Lỗi ${res.status}`);
  }

  return res.json() as Promise<T>;
}
```

---

## Rate Limiting

Được áp dụng tại Fleetwork.Web gateway:

| Endpoint group | Limit | Burst | Timeout |
|----------------|-------|-------|---------|
| Dashboard (`/dashboard/*`) | 10 req/s | 5 | 10s |
| Reports (`/reports/*`) | 5 req/s | 3 | 30s |

---

## Caching

Backend cache Redis với TTL:

| Endpoint | TTL |
|----------|-----|
| `summary` | 5 phút |
| `activity-heatmap` | 15 phút |
| `fuel-tracking` | 15 phút |
| `monthly-costs` | 15 phút |
| `users` | Không cache |
| Reports | Không cache |

> FE **không cần** tự cache — response header không có `Cache-Control` cụ thể. Nếu muốn, có thể dùng **React Query** với `staleTime` tương ứng TTL trên.

---

## React Fetch Helper

Gợi ý wrapper với React Query:

```typescript
// src/lib/analyticsApi.ts
import { useQuery } from '@tanstack/react-query';
import type {
  GpsSummaryResponse,
  GpsUsersResponse,
  ActivityHeatmapResponse,
  FuelTrackingResponse,
  MonthlyCostResponse,
  AllInOneDashboardResponse,
  TripSummaryResponse,
  TripDetailResponse,
  FuelSummaryResponse,
  FuelDetailResponse,
  ActivityTimeResponse,
} from '@/types/analytics';

const BASE = '/api/v1';

async function get<T>(path: string, apiKey: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { headers: { 'X-API-Key': apiKey } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Dashboard hooks ───────────────────────────────────────────────────────

export function useDashboardAll(apiKey: string, date?: number) {
  return useQuery({
    queryKey: ['dashboard-all', date],
    queryFn: () => get<AllInOneDashboardResponse>(`${BASE}/dashboard/gps-manager`, apiKey, { date }),
    staleTime: 5 * 60_000,
  });
}

export function useGpsSummary(apiKey: string, date?: number) {
  return useQuery({
    queryKey: ['gps-summary', date],
    queryFn: () => get<GpsSummaryResponse>(`${BASE}/dashboard/gps-manager/summary`, apiKey, { date }),
    staleTime: 5 * 60_000,
  });
}

export function useGpsUsers(apiKey: string, params?: {
  date?: number; status?: string; page?: number; pageSize?: number;
}) {
  return useQuery({
    queryKey: ['gps-users', params],
    queryFn: () => get<GpsUsersResponse>(`${BASE}/dashboard/gps-manager/users`, apiKey, params),
  });
}

export function useActivityHeatmap(apiKey: string, params?: {
  from?: number; to?: number; metric?: 'distance' | 'points'; userId?: string;
}) {
  return useQuery({
    queryKey: ['activity-heatmap', params],
    queryFn: () => get<ActivityHeatmapResponse>(`${BASE}/dashboard/gps-manager/activity-heatmap`, apiKey, params),
    staleTime: 15 * 60_000,
  });
}

export function useFuelTracking(apiKey: string, params?: {
  from?: number; to?: number; groupBy?: 'day' | 'week' | 'month'; userId?: string;
}) {
  return useQuery({
    queryKey: ['fuel-tracking', params],
    queryFn: () => get<FuelTrackingResponse>(`${BASE}/dashboard/gps-manager/fuel-tracking`, apiKey, params),
    staleTime: 15 * 60_000,
  });
}

export function useMonthlyCosts(apiKey: string, params?: { from?: number; to?: number; currency?: string }) {
  return useQuery({
    queryKey: ['monthly-costs', params],
    queryFn: () => get<MonthlyCostResponse>(`${BASE}/dashboard/gps-manager/monthly-costs`, apiKey, params),
    staleTime: 15 * 60_000,
  });
}

// ─── Reports hooks ─────────────────────────────────────────────────────────

export function useTripSummary(apiKey: string, params: {
  from: number; to: number; userId?: string; groupId?: string;
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean;
}) {
  return useQuery({
    queryKey: ['trip-summary', params],
    queryFn: () => get<TripSummaryResponse>(`${BASE}/reports/trip/summary`, apiKey, params),
  });
}

export function useTripDetail(apiKey: string, params: {
  from: number; to: number; userId?: string; groupId?: string;
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean;
}) {
  return useQuery({
    queryKey: ['trip-detail', params],
    queryFn: () => get<TripDetailResponse>(`${BASE}/reports/trip/detail`, apiKey, params),
  });
}

export function useFuelSummary(apiKey: string, params: {
  from: number; to: number; userId?: string; groupId?: string;
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean;
}) {
  return useQuery({
    queryKey: ['fuel-summary', params],
    queryFn: () => get<FuelSummaryResponse>(`${BASE}/reports/fuel/summary`, apiKey, params),
  });
}

export function useFuelDetail(apiKey: string, params: {
  from: number; to: number; userId?: string; groupId?: string;
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean;
}) {
  return useQuery({
    queryKey: ['fuel-detail', params],
    queryFn: () => get<FuelDetailResponse>(`${BASE}/reports/fuel/detail`, apiKey, params),
  });
}

export function useActivityTime(apiKey: string, params: {
  from: number; to: number; userId?: string; groupId?: string;
  page?: number; pageSize?: number;
}) {
  return useQuery({
    queryKey: ['activity-time', params],
    queryFn: () => get<ActivityTimeResponse>(`${BASE}/reports/activity-time`, apiKey, params),
  });
}
```
