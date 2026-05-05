import './index.css'

// Provider
export { FleetworkProvider } from '@/provider/FleetworkProvider'
export { useFleetwork, useOptionalFleetwork } from '@/provider/FleetworkProvider'
export type { FleetworkProviderProps } from '@/provider/FleetworkProvider'

// Auth error events (advanced — usually not needed; Provider handles via prop)
export { subscribeAuthError } from '@/lib/auth-events'

// Member name resolution helper
export { resolveMemberName } from '@/lib/member-name'

// Controllers
export { LiveMapController } from '@/controllers/LiveMapController'
export { DashboardController } from '@/controllers/DashboardController'
export { ReportController } from '@/controllers/ReportController'

// Hooks
export * from '@/hooks'

// Components — Dashboard
export { Dashboard } from '@/components/dashboard/Dashboard'
export { SummaryCards } from '@/components/dashboard/SummaryCards'
export { MemberReport } from '@/components/dashboard/MemberReport'
export { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
export { FuelTracking } from '@/components/dashboard/FuelTracking'
export { MonthlyExpenses } from '@/components/dashboard/MonthlyExpenses'

// Components — LiveMap
export { LiveMap } from '@/components/livemap/MapView'
export { MemberList } from '@/components/livemap/MemberList'
export type { LiveMapProps, LiveMapRef } from '@/components/livemap/types'
export type { MapInstance } from '@/components/livemap/types'

// Components — Report
export { Report } from '@/components/report/Report'
export type { ReportProps } from '@/components/report/Report'
export {
  TripSummaryReport, TripDetailReport,
  FuelSummaryReport, FuelDetailReport,
  ActivityTimeReport,
} from '@/components/report/views'
export type { ReportRangeState, ReportViewProps } from '@/components/report/views'
export { ReportShell, PaginationBar, DateRangeBar } from '@/components/report/shared'

// Shared primitives
export * from '@/components/shared'

// HTTP helpers
export { initFleetwork, createHttpClient } from '@/lib/http'

// Types
export type * from '@/lib/types'
