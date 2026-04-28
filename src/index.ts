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
  GetActivityHeatmapOptions,
  GetFuelOptions,
  GetExpensesOptions,
} from './controllers/DashboardController'
export { LiveMapController } from './controllers/LiveMapController'
export type { GetMembersOptions } from './controllers/LiveMapController'
export { ReportController } from './controllers/ReportController'
export type {
  BaseReportOptions,
  ActivityTimeOptions,
} from './controllers/ReportController'

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
  UseReportOptions,
  UseActivityTimeReportOptions,
} from './hooks'

// Report hooks
export {
  useTripSummaryReport,
  useTripDetailReport,
  useFuelSummaryReport,
  useFuelDetailReport,
  useActivityTimeReport,
} from './hooks'

// UI primitives
export { DateRangePicker } from './components/ui/date-range-picker'
export type { DateRangePickerProps } from './components/ui/date-range-picker'
export { DatePicker } from './components/ui/date-picker'

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

// Report
export { Report } from './components/report/Report'
export type { ReportProps } from './components/report/Report'
export {
  TripSummaryReport,
  TripDetailReport,
  FuelSummaryReport,
  FuelDetailReport,
  ActivityTimeReport,
} from './components/report/views'
export type { ReportViewProps, ReportRangeState } from './components/report/views'

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
  // Reports
  TripSummaryReportData,
  TripSummaryRow,
  TripDetailReportData,
  TripDetailRow,
  FuelSummaryReportData,
  FuelSummaryRow,
  FuelDetailReportData,
  FuelDetailRow,
  ActivityTimeReportData,
  ActivityTimeRow,
  FuelReportTotals,
  ReportPagination,
  DurationValue,
  LocationPoint,
} from './lib/types'
