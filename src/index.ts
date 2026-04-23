import './styles.css'

// Provider
export {
  FleetworkProvider,
  useFleetwork,
  useOptionalFleetwork,
  useFleetworkQueryClient,
} from './provider/FleetworkProvider'
export type { FleetworkProviderProps } from './provider/FleetworkProvider'

// Controllers (also usable outside React)
export { DashboardController } from './controllers/DashboardController'
export type {
  GetSummaryOptions,
  GetMemberReportOptions,
  GetFuelOptions,
  GetExpensesOptions,
} from './controllers/DashboardController'
export { LiveMapController } from './controllers/LiveMapController'
export type { GetMembersOptions } from './controllers/LiveMapController'

// HTTP / init
export { initFleetwork, createHttpClient } from './lib/http'

// Hooks
export {
  useSummaryCards,
  useMemberReport,
  useActivityHeatmap,
  useFuelTracking,
  useMonthlyExpenses,
  useMembers,
  useMember,
  useHistoryRoute,
} from './hooks'
export type {
  UseSummaryCardsOptions,
  UseMemberReportOptions,
  UseActivityHeatmapOptions,
  UseFuelTrackingOptions,
  UseMonthlyExpensesOptions,
  UseHistoryRouteOptions,
  UseMembersOptions,
} from './hooks'

// Dashboard components
export { Dashboard } from './components/dashboard/Dashboard'
export type { DashboardProps } from './components/dashboard/Dashboard'
export { SummaryCards } from './components/dashboard/SummaryCards'
export type { SummaryCardsProps } from './components/dashboard/SummaryCards'
export { MemberReport } from './components/dashboard/MemberReport'
export type { MemberReportProps } from './components/dashboard/MemberReport'
export { ActivityHeatmap } from './components/dashboard/ActivityHeatmap'
export type { ActivityHeatmapProps } from './components/dashboard/ActivityHeatmap'
export { FuelTracking } from './components/dashboard/FuelTracking'
export type { FuelTrackingProps } from './components/dashboard/FuelTracking'
export { MonthlyExpenses } from './components/dashboard/MonthlyExpenses'
export type { MonthlyExpensesProps } from './components/dashboard/MonthlyExpenses'

// LiveMap
export { LiveMap } from './components/livemap/LiveMap'
export type {
  LiveMapProps,
  LiveMapRef,
  LiveMapSlotProps,
  MapInstance,
} from './components/livemap/types'

// Types
export type {
  // Config
  FleetworkConfig,
  Locale,
  ThemeConfig,
  Position,
  TileType,
  SdkError,
  // Dashboard
  SummaryCardsData,
  MemberReportData,
  MemberRow,
  ActivityHeatmapData,
  ActivityHeatmapCell,
  FuelTrackingData,
  FuelGroupBy,
  MonthlyExpensesData,
  // LiveMap
  MemberStatus,
  MemberStatusKind,
  GpsPoint,
  GpsUserRow,
  GpsUsersResponse,
} from './lib/types'
