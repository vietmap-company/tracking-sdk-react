export type Locale = "vi" | "en";

export type TileType = "light" | "dark" | "terrain" | "satellite";

export type Position =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ThemeConfig {
  colors?: {
    /** Maps to shadcn --primary */
    primary?: string;
    /** Maps to shadcn --destructive */
    destructive?: string;
    /** Maps to shadcn --background */
    background?: string;
    /** Maps to shadcn --foreground */
    text?: string;
    /** Maps to shadcn --border */
    border?: string;
    /** Maps to --status-moving (moving indicator dot color) */
    statusMoving?: string;
    /** Maps to --status-stopped (stopped indicator dot color) */
    statusStopped?: string;
    /** Maps to --status-signal-lost (signal lost indicator dot color) */
    statusSignalLost?: string;
  };
  /** Maps to shadcn --radius (in pixels) */
  borderRadius?: number;
  fontFamily?: string;
}

export interface FleetworkConfig {
  /** API token for backend requests */
  apiKey: string;
  /** API key for VietMap tile styles */
  apiKeyTilemap: string;
  baseUrl?: string;
  locale?: Locale;
  theme?: ThemeConfig;
}

export type MemberStatusKind = "moving" | "stopped" | "signal_lost";

export interface SummaryCardsData {
  date: number;
  activeUsers: { active: number; total: number };
  totalDistance: { value: number; unit: string };
  totalTravelTime: { totalSeconds: number; formatted: string };
  totalFuelCost: { value: number; currency: string; formatted: string };
  generatedAt: number;
}

export interface MemberRow {
  userId: string;
  name?: string;
  avatarUrl?: string | null;
  groupName?: string | null;
  distance: { value: number; unit: string };
  travelTime: { totalSeconds: number; formatted: string };
  fuel: {
    consumedLiters: number;
    costVnd: number;
    costFormatted: string;
    efficiencyKmPerL: number;
  };
  status: MemberStatusKind;
  statusLabel: string;
  lastLocation: {
    lat: number;
    lng: number;
    address: string | null;
    speed: number;
    time: number;
  } | null;
  lastSeenAt: number | null;
  /** JSON object from server; key casing follows the API response */
  metaData?: Record<string, unknown> | null;
}

export interface MemberReportData {
  date: number;
  summary: {
    total: number;
    moving: number;
    stopped: number;
    signalLost: number;
  };
  users: MemberRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ActivityHeatmapCell {
  dayOfWeek: string;
  date: number;
  hour: number;
  value: number;
  label: string;
}

export interface ActivityHeatmapData {
  from: number;
  to: number;
  metric: "distance" | "points";
  resolution: "hour";
  cells: ActivityHeatmapCell[];
  maxValue: number;
  minValue: number;
  totalCells: number;
}

export type FuelGroupBy = "day" | "week" | "month";

export interface FuelTrackingData {
  from: number;
  to: number;
  groupBy: FuelGroupBy;
  fuelEfficiency: { value: number; unit: string; trend: string };
  series: {
    period: string;
    label: string;
    distanceKm: number;
    fuelLiters: number;
    efficiencyKmPerL: number;
  }[];
  totals: {
    totalDistanceKm: number;
    totalFuelLiters: number;
    avgEfficiencyKmPerL: number;
  };
}

export interface MonthlyExpensesData {
  from: number;
  to: number;
  currency: string;
  months: {
    month: number;
    label: string;
    costs: {
      fuel: number;
      maintenance: number;
      insurance: number;
      other: number;
      total: number;
    };
  }[];
  totals: {
    fuel: number;
    maintenance: number;
    insurance: number;
    other: number;
    grandTotal: number;
  };
  categories: { key: string; label: string; color: string }[];
}

export interface MemberStatus {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  groupName?: string | null;
  status: MemberStatusKind;
  statusLabel: string;
  lat: number;
  lng: number;
  lastAddress?: string;
  speed?: number;
  lastSeenAt?: number;
}

export interface GpsPoint {
  time: number;
  status?: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  userId?: string;
  vehicleId?: string;
  deviceId?: string;
  /** JSON-encoded string from the server, e.g. '{"userName":"...","userAvatar":"..."}' */
  metadata?: string | null;
  data?: string | null;
}

export interface GpsUserRow {
  id: string;
  userId?: string | null;
  vehicleId?: string | null;
  deviceId?: string | null;
  status: MemberStatusKind;
  statusCode?: number;
  lastSeenAt: number;
  lastLocation: GpsPoint | null;
}

export interface GpsUsersResponse {
  users: GpsUserRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SdkError extends Error {
  status?: number;
}

/* ────────────────────────────────────────────────────────────────
   Reports (section 3 of tracking API)
   ──────────────────────────────────────────────────────────────── */

export interface ReportPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DurationValue {
  totalSeconds: number;
  formatted: string;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string | null;
}

// 3.1 Trip summary
export interface TripSummaryRow {
  userId: string;
  totalDistanceKm: number;
  travelTime: DurationValue;
  stopTime: DurationValue;
  maxSpeedKmh: number;
  minSpeedKmh: number;
  tripDays: number;
  metaData?: unknown | null;
}

export interface TripSummaryReportData {
  reportType: "trip-summary";
  from: number;
  to: number;
  users: TripSummaryRow[];
  pagination: ReportPagination;
  generatedAt: number;
}

// 3.2 Trip detail
export interface TripDetailRow {
  date: number;
  userId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  travelTime: DurationValue;
  stopTime: DurationValue;
  maxSpeedKmh: number;
  minSpeedKmh: number;
  startLocation: LocationPoint | null;
  endLocation: LocationPoint | null;
  metaData?: unknown | null;
}

export interface TripDetailReportData {
  reportType: "trip-detail";
  trips: TripDetailRow[];
  pagination: ReportPagination;
  generatedAt: number;
}

// 3.3 Fuel summary
export interface FuelSummaryRow {
  userId: string;
  distanceKm: number;
  travelTime: DurationValue;
  fuelStandardLiters: number;
  totalCostVnd: number;
  totalCostFormatted: string;
  metaData?: unknown | null;
}

export interface FuelReportTotals {
  distanceKm: number;
  fuelStandardLiters: number;
  totalCostVnd: number;
  totalCostFormatted: string;
}

export interface FuelSummaryReportData {
  reportType: "fuel-summary";
  fuelConfig: { efficiencyLper100km: number; pricePerLiterVnd: number };
  users: FuelSummaryRow[];
  totals: FuelReportTotals;
  pagination: ReportPagination;
  generatedAt: number;
}

// 3.4 Fuel detail
export interface FuelDetailRow {
  date: number;
  userId: string;
  startTime: number;
  endTime: number;
  distanceKm: number;
  travelTime: DurationValue;
  fuelStandardLiters: number;
  fuelPricePerLiterVnd: number;
  totalCostVnd: number;
  totalCostFormatted: string;
  metaData?: unknown | null;
}

export interface FuelDetailReportData {
  reportType: "fuel-detail";
  trips: FuelDetailRow[];
  totals: FuelReportTotals;
  pagination: ReportPagination;
  generatedAt: number;
}

// 3.5 Activity time
export interface ActivityTimeRow {
  date: number;
  hour: number;
  activeUserCount: number;
  inactiveUserCount: number;
  totalDistanceKm: number;
}

export interface ActivityTimeReportData {
  reportType: "activity-time";
  totalUsers: number;
  rows: ActivityTimeRow[];
  totals: { totalDistanceKm: number };
  pagination: ReportPagination;
  generatedAt: number;
}
