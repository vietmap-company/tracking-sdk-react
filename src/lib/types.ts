export type Locale = 'vi' | 'en'

export type TileType = 'light' | 'dark' | 'terrain' | 'satellite'

export type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface ThemeConfig {
  colors?: {
    primary?: string
    success?: string
    warning?: string
    danger?: string
    background?: string
    text?: string
    border?: string
  }
  borderRadius?: number
  fontFamily?: string
}

export interface FleetworkConfig {
  apiKey: string
  baseUrl?: string
  locale?: Locale
  theme?: ThemeConfig
}

export type MemberStatusKind = 'moving' | 'stopped' | 'signal_lost'

export interface SummaryCardsData {
  date: number
  activeEmployees: { active: number; total: number }
  totalDistance: { value: number; unit: string }
  totalTravelTime: { totalSeconds: number; formatted: string }
  totalFuelCost: { value: number; currency: string; formatted: string }
  generatedAt: number
}

export interface MemberRow {
  userId: string
  name: string
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
    timestamp: number
  } | null
  lastSeenAt: number
}

export interface MemberReportData {
  date: number
  summary: {
    total: number
    moving: number
    stopped: number
    signalLost: number
  }
  members: MemberRow[]
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
  lat: number
  lng: number
  speed: number
  heading: number
  altitude?: number
  accuracy?: number
  timestamp: number
}

export interface SdkError extends Error {
  status?: number
}
