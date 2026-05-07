export type Locale = 'vi' | 'en'
export type TileType = 'light' | 'dark' | 'terrain' | 'satellite'

export interface ThemeConfig {
  colors?: {
    primary?: string
    destructive?: string
    background?: string
    text?: string
    border?: string
    statusMoving?: string
    statusStopped?: string
    statusSignalLost?: string
  }
  borderRadius?: number
  fontFamily?: string
}

export interface FleetworkConfig {
  /** API key / Bearer token for backend requests */
  apiKey: string
  baseUrl?: string
  locale?: Locale
  theme?: ThemeConfig
  /**
   * Default key in each row's `metaData` to use as the displayed user name
   * across LiveMap, Dashboard tables, and Report tables. Per-component
   * overrides (e.g. `<LiveMap memberNameKey="...">`) take precedence.
   */
  memberNameKey?: string
}

export type MemberStatusKind = 'moving' | 'stopped' | 'signal_lost'

export interface SummaryCardsData {
  date: number
  activeUsers: { active: number; total: number }
  totalDistance: { value: number; unit: string }
  totalTravelTime: { totalSeconds: number; formatted: string }
  totalFuelCost: { value: number; currency: string; formatted: string }
  generatedAt: number
}

export interface MemberRow {
  userId: string
  distance: { value: number; unit: string }
  travelTime: { totalSeconds: number; formatted: string }
  fuel: {
    consumedLiters: number
    costVnd: number
    costFormatted: string
    efficiencyKmPerL: number
  }
  status: MemberStatusKind
  statusLabel: string
  lastLocation: {
    lat: number
    lng: number
    address: string | null
    speed: number
    time: number
    /**
     * Stringified JSON map of arbitrary attributes (e.g.
     * `{"userName":"...","userAvatar":"..."}`). Use `resolveMemberName` to
     * extract a display name via `memberNameKey`.
     */
    metadata?: string | null
  } | null
  lastSeenAt: number | null
}

export interface MemberReportData {
  date: number
  summary: { total: number; moving: number; stopped: number; signalLost: number }
  users: MemberRow[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
}

export interface ActivityHeatmapCell {
  /** May arrive as 'Mon', 'monday', 'T2', or absent — use `date` as fallback. */
  dayOfWeek?: string | number | null
  /** Bucket timestamp (ms). Source of truth for day/hour mapping. */
  date: number
  /** 0..23 in local time. May be missing — derive from `date`. */
  hour?: number
  value: number
  label?: string
}

export interface ActivityHeatmapData {
  from: number
  to: number
  metric: 'distance' | 'points'
  resolution: 'hour'
  cells: ActivityHeatmapCell[]
  maxValue: number
  minValue: number
  totalCells: number
}

export type FuelGroupBy = 'day' | 'week' | 'month'

export interface FuelTrackingData {
  from: number
  to: number
  groupBy: FuelGroupBy
  fuelEfficiency: { value: number; unit: string; trend: string }
  series: {
    period: string
    label: string
    distanceKm: number
    fuelLiters: number
    efficiencyKmPerL: number
  }[]
  totals: { totalDistanceKm: number; totalFuelLiters: number; avgEfficiencyKmPerL: number }
}

export interface MonthlyExpensesData {
  from: number
  to: number
  currency: string
  months: {
    month: number
    label: string
    costs: { fuel: number; maintenance: number; insurance: number; other: number; total: number }
  }[]
  totals: { fuel: number; maintenance: number; insurance: number; other: number; grandTotal: number }
  categories: { key: string; label: string; color: string }[]
}

export interface MemberStatus {
  userId: string
  name: string
  avatarUrl?: string | null
  groupName?: string | null
  status: MemberStatusKind
  statusLabel: string
  lat: number
  lng: number
  speed?: number
  lastSeenAt?: number
  lastAddress?: string
}

export interface GpsPoint {
  time: number
  status?: number
  lat: number
  lng: number
  speed: number
  heading: number
  userId?: string | null
  vehicleId?: string | null
  deviceId?: string | null
  /**
   * Compact binary blob (msgpack/base64) shipped by the device — usually
   * unused by consumers, kept for forward compat.
   */
  data?: string | null
  /**
   * Arbitrary key/value attributes from the device. The shape is
   * polymorphic across endpoints:
   * - `/gps-tracking/users` returns it as a JSON string (`"{...}"`).
   * - `/gps-tracking/latest/users/:id` and `/gps-tracking/history` return
   *   it pre-parsed as an object.
   *
   * `resolveMemberName` and `parseMeta` accept both shapes.
   */
  metadata?: string | Record<string, unknown> | null
}

export interface GpsUserRow {
  id: string
  userId?: string | null
  vehicleId?: string | null
  deviceId?: string | null
  status: MemberStatusKind
  statusCode?: number
  lastSeenAt: number
  lastLocation: GpsPoint | null
}

export interface GpsUsersResponse {
  users: GpsUserRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface HistoryRouteResponse {
  trackingData: GpsPoint[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SdkError extends Error {
  status?: number
}

export interface AuthErrorEvent {
  /** HTTP status — 401 or 403. */
  status: 401 | 403
  /** Backend message if present, otherwise a localized default. */
  message: string
  /** Request URL that triggered the error (when available). */
  url?: string
  /** HTTP method (when available). */
  method?: string
  /** Raw response payload from the server, if any. */
  payload?: unknown
}

export interface ReportPagination {
  page: number; pageSize: number; totalItems: number; totalPages: number
}

export interface DurationValue { totalSeconds: number; formatted: string }
export interface LocationPoint { lat: number; lng: number; address: string | null }

export interface TripSummaryRow {
  userId: string; totalDistanceKm: number; travelTime: DurationValue
  stopTime: DurationValue; maxSpeedKmh: number; minSpeedKmh: number; tripDays: number
  metaData?: unknown | null
}
export interface TripSummaryReportData {
  reportType: 'trip_summary'; from: number; to: number
  users: TripSummaryRow[]; pagination: ReportPagination; generatedAt: number
}

export interface TripDetailRow {
  date: number; userId: string; startTime: number; endTime: number
  distanceKm: number; travelTime: DurationValue; stopTime: DurationValue
  maxSpeedKmh: number; minSpeedKmh: number
  startLocation: LocationPoint | null; endLocation: LocationPoint | null
  metaData?: unknown | null
}
export interface TripDetailReportData {
  reportType: 'trip_detail'; trips: TripDetailRow[]; pagination: ReportPagination; generatedAt: number
}

export interface FuelSummaryRow {
  userId: string; distanceKm: number; travelTime: DurationValue
  fuelStandardLiters: number; totalCostVnd: number; totalCostFormatted: string
  metaData?: unknown | null
}
export interface FuelReportTotals { distanceKm: number; fuelStandardLiters: number; totalCostVnd: number; totalCostFormatted: string }
export interface FuelSummaryReportData {
  reportType: 'fuel_summary'; fuelConfig: { efficiencyLper100km: number; pricePerLiterVnd: number }
  users: FuelSummaryRow[]; totals: FuelReportTotals; pagination: ReportPagination; generatedAt: number
}

export interface FuelDetailRow {
  date: number; userId: string; startTime: number; endTime: number; distanceKm: number
  travelTime: DurationValue; fuelStandardLiters: number; fuelPricePerLiterVnd: number
  totalCostVnd: number; totalCostFormatted: string; metaData?: unknown | null
}
export interface FuelDetailReportData {
  reportType: 'fuel_detail'; trips: FuelDetailRow[]; totals: FuelReportTotals
  pagination: ReportPagination; generatedAt: number
}

export interface ActivityTimeRow {
  date: number; hour: number; activeUserCount: number; inactiveUserCount: number; totalDistanceKm: number
}
export interface ActivityTimeReportData {
  reportType: 'activity_time'; totalUsers: number; rows: ActivityTimeRow[]
  totals: { totalDistanceKm: number }; pagination: ReportPagination; generatedAt: number
}
