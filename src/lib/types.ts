export type Locale = 'vi' | 'en'

export type TileType = 'light' | 'dark' | 'terrain' | 'satellite'

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface ThemeConfig {
  colors?: {
    /** Maps to shadcn --primary */
    primary?: string
    /** Maps to shadcn --destructive */
    destructive?: string
    /** Maps to shadcn --background */
    background?: string
    /** Maps to shadcn --foreground */
    text?: string
    /** Maps to shadcn --border */
    border?: string
  }
  /** Maps to shadcn --radius (in pixels) */
  borderRadius?: number
  fontFamily?: string
}

export interface FleetworkConfig {
  /** API token for backend requests */
  apiKey: string
  /** API key for VietMap tile styles */
  apiKeyTilemap: string
  baseUrl?: string
  locale?: Locale
  theme?: ThemeConfig
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
  name?: string
  avatarUrl?: string | null
  groupName?: string | null
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
    address: string
    speed: number
    time: number
  } | null
  lastSeenAt: number
  metadata?: Record<string, unknown>
}

export interface MemberReportData {
  date: number
  summary: {
    total: number
    moving: number
    stopped: number
    signalLost: number
  }
  users: MemberRow[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export interface ActivityHeatmapCell {
  dayOfWeek: string
  date: number
  hour: number
  value: number
  label: string
}

export interface ActivityHeatmapData {
  from: number
  to: number
  metric: 'distance' | 'points'
  resolution: 'hour' | '30min'
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
  totals: {
    totalDistanceKm: number
    totalFuelLiters: number
    avgEfficiencyKmPerL: number
  }
}

export interface MonthlyExpensesData {
  from: number
  to: number
  currency: string
  months: {
    month: number
    label: string
    costs: {
      fuel: number
      maintenance: number
      insurance: number
      other: number
      total: number
    }
  }[]
  totals: {
    fuel: number
    maintenance: number
    insurance: number
    other: number
    grandTotal: number
  }
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
  lastAddress?: string
  speed?: number
  lastSeenAt?: number
}

export interface GpsPoint {
  time: number
  status?: number
  lat: number
  lng: number
  speed: number
  heading: number
  userId?: string
  vehicleId?: string
  deviceId?: string
  /** JSON-encoded string from the server, e.g. '{"userName":"...","userAvatar":"..."}' */
  metadata?: string | null
  data?: string | null
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

export interface SdkError extends Error {
  status?: number
}
