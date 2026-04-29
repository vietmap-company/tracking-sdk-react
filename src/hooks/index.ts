import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { DashboardController } from '@/controllers/DashboardController'
import { LiveMapController } from '@/controllers/LiveMapController'
import { ReportController } from '@/controllers/ReportController'
import { useFleetwork } from '@/provider/FleetworkProvider'
import {
  daysAgoMs,
  endOfYearMs,
  startOfTodayMs,
  startOfYearMs,
} from '@/lib/utils'
import type {
  ActivityHeatmapData,
  ActivityTimeReportData,
  FuelDetailReportData,
  FuelGroupBy,
  FuelSummaryReportData,
  FuelTrackingData,
  GpsPoint,
  MemberReportData,
  MemberStatus,
  MonthlyExpensesData,
  SummaryCardsData,
  TripDetailReportData,
  TripSummaryReportData,
} from '@/lib/types'

interface BaseOptions {
  pollInterval?: number
  enabled?: boolean
}

function refetch(pollInterval?: number) {
  return pollInterval && pollInterval > 0 ? pollInterval : false
}

type QueryResult<T> = Pick<
  UseQueryResult<T, Error>,
  'data' | 'isLoading' | 'error' | 'refetch' | 'isFetching'
>

function toResult<T>(q: UseQueryResult<T, Error>): QueryResult<T> {
  return {
    data: q.data,
    isLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
    isFetching: q.isFetching,
  }
}

export interface UseSummaryCardsOptions extends BaseOptions {
  date?: number
}

export function useSummaryCards(
  options: UseSummaryCardsOptions = {}
): QueryResult<SummaryCardsData> {
  const { apiKey } = useFleetwork()
  const date = options.date ?? startOfTodayMs()
  const q = useQuery({
    queryKey: ['fw', apiKey, 'summary', date],
    queryFn: () => DashboardController.getSummaryCards({ date }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseMemberReportOptions extends BaseOptions {
  date?: number
  page?: number
  pageSize?: number
  status?: 'moving' | 'stopped' | 'signal_lost'
}

export function useMemberReport(
  options: UseMemberReportOptions = {}
): QueryResult<MemberReportData> {
  const { apiKey } = useFleetwork()
  const date = options.date ?? startOfTodayMs()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  const status = options.status
  const q = useQuery({
    queryKey: ['fw', apiKey, 'memberReport', date, page, pageSize, status],
    queryFn: () =>
      DashboardController.getMemberReport(date, { page, pageSize, status }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseActivityHeatmapOptions extends BaseOptions {
  from?: number
  to?: number
  metric?: 'distance' | 'points'
  userId?: string
}

export function useActivityHeatmap(
  options: UseActivityHeatmapOptions = {}
): QueryResult<ActivityHeatmapData> {
  const { apiKey } = useFleetwork()
  const to = options.to ?? Date.now()
  const from = options.from ?? daysAgoMs(14)
  const metric = options.metric ?? 'distance'
  const userId = options.userId
  const q = useQuery({
    queryKey: ['fw', apiKey, 'heatmap', from, to, metric, userId],
    queryFn: () => DashboardController.getActivityHeatmap(from, to, { metric, userId }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseFuelTrackingOptions extends BaseOptions {
  from?: number
  to?: number
  groupBy?: FuelGroupBy
  userId?: string
}

export function useFuelTracking(
  options: UseFuelTrackingOptions = {}
): QueryResult<FuelTrackingData> {
  const { apiKey } = useFleetwork()
  const from = options.from ?? startOfYearMs()
  const to = options.to ?? endOfYearMs()
  const groupBy = options.groupBy ?? 'month'
  const userId = options.userId
  const q = useQuery({
    queryKey: ['fw', apiKey, 'fuel', from, to, groupBy, userId],
    queryFn: () =>
      DashboardController.getFuelTracking(from, to, { groupBy, userId }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseMonthlyExpensesOptions extends BaseOptions {
  from?: number
  to?: number
  currency?: string
}

export function useMonthlyExpenses(
  options: UseMonthlyExpensesOptions = {}
): QueryResult<MonthlyExpensesData> {
  const { apiKey } = useFleetwork()
  const from = options.from ?? startOfYearMs()
  const to = options.to ?? endOfYearMs()
  const currency = options.currency ?? 'VND'
  const q = useQuery({
    queryKey: ['fw', apiKey, 'expenses', from, to, currency],
    queryFn: () =>
      DashboardController.getMonthlyExpenses(from, to, { currency }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

/* ---------- LiveMap hooks ---------- */

export interface UseMembersOptions extends BaseOptions {
  /** Key inside lastLocation.metadata to use as member display name */
  nameKey?: string
  /** Maximum number of users to fetch (maps to API pageSize). Default: 3000 */
  maxUsers?: number
}

export function useMembers(
  options: UseMembersOptions = {}
): QueryResult<MemberStatus[]> {
  const { apiKey } = useFleetwork()
  const { nameKey, maxUsers } = options
  const q = useQuery({
    queryKey: ['fw', apiKey, 'members', nameKey, maxUsers],
    queryFn: () => LiveMapController.getMembers({ nameKey, pageSize: maxUsers }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export function useMember(
  userId: string,
  options: UseMembersOptions = {}
): QueryResult<MemberStatus | null> {
  const { apiKey } = useFleetwork()
  const { nameKey } = options
  const q = useQuery({
    queryKey: ['fw', apiKey, 'member', userId, nameKey],
    queryFn: () => LiveMapController.getMember(userId, { nameKey }),
    enabled: (options.enabled ?? true) && !!userId,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseHistoryRouteOptions extends BaseOptions {
  userId: string
  startTime: number
  endTime: number
}

export function useHistoryRoute(
  options: UseHistoryRouteOptions
): QueryResult<GpsPoint[]> {
  const { apiKey } = useFleetwork()
  const { userId, startTime, endTime } = options
  const q = useQuery({
    queryKey: ['fw', apiKey, 'history', userId, startTime, endTime],
    queryFn: () =>
      LiveMapController.getHistoryRoute(userId, startTime, endTime),
    enabled: (options.enabled ?? true) && !!userId,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

/* ---------- Report hooks ---------- */

export interface UseReportOptions extends BaseOptions {
  from: number
  to: number
  userId?: string
  groupId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
}

export type UseActivityTimeReportOptions = Omit<UseReportOptions, 'sortBy' | 'sortDesc'>

const reportEnabled = (options: { enabled?: boolean; from?: number; to?: number }) =>
  (options.enabled ?? true) && !!options.from && !!options.to

export function useTripSummaryReport(
  options: UseReportOptions
): QueryResult<TripSummaryReportData> {
  const { apiKey } = useFleetwork()
  const q = useQuery({
    queryKey: [
      'fw', apiKey, 'report/trip/summary',
      options.from, options.to, options.userId, options.groupId,
      options.page, options.pageSize, options.sortBy, options.sortDesc,
    ],
    queryFn: () => ReportController.getTripSummary(options),
    enabled: reportEnabled(options),
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export function useTripDetailReport(
  options: UseReportOptions
): QueryResult<TripDetailReportData> {
  const { apiKey } = useFleetwork()
  const q = useQuery({
    queryKey: [
      'fw', apiKey, 'report/trip/detail',
      options.from, options.to, options.userId, options.groupId,
      options.page, options.pageSize, options.sortBy, options.sortDesc,
    ],
    queryFn: () => ReportController.getTripDetail(options),
    enabled: reportEnabled(options),
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export function useFuelSummaryReport(
  options: UseReportOptions
): QueryResult<FuelSummaryReportData> {
  const { apiKey } = useFleetwork()
  const q = useQuery({
    queryKey: [
      'fw', apiKey, 'report/fuel/summary',
      options.from, options.to, options.userId, options.groupId,
      options.page, options.pageSize, options.sortBy, options.sortDesc,
    ],
    queryFn: () => ReportController.getFuelSummary(options),
    enabled: reportEnabled(options),
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export function useFuelDetailReport(
  options: UseReportOptions
): QueryResult<FuelDetailReportData> {
  const { apiKey } = useFleetwork()
  const q = useQuery({
    queryKey: [
      'fw', apiKey, 'report/fuel/detail',
      options.from, options.to, options.userId, options.groupId,
      options.page, options.pageSize, options.sortBy, options.sortDesc,
    ],
    queryFn: () => ReportController.getFuelDetail(options),
    enabled: reportEnabled(options),
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export function useActivityTimeReport(
  options: UseActivityTimeReportOptions
): QueryResult<ActivityTimeReportData> {
  const { apiKey } = useFleetwork()
  const q = useQuery({
    queryKey: [
      'fw', apiKey, 'report/activity-time',
      options.from, options.to, options.userId, options.groupId,
      options.page, options.pageSize,
    ],
    queryFn: () => ReportController.getActivityTime(options),
    enabled: reportEnabled(options),
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}
