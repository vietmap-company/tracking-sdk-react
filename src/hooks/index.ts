import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { DashboardController } from '@/controllers/DashboardController'
import { LiveMapController } from '@/controllers/LiveMapController'
import { useFleetwork } from '@/provider/FleetworkProvider'
import {
  daysAgoMs,
  endOfYearMs,
  startOfTodayMs,
  startOfYearMs,
} from '@/lib/utils'
import type {
  ActivityHeatmapData,
  FuelGroupBy,
  FuelTrackingData,
  GpsPoint,
  MemberReportData,
  MemberStatus,
  MonthlyExpensesData,
  SummaryCardsData,
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
}

export function useMemberReport(
  options: UseMemberReportOptions = {}
): QueryResult<MemberReportData> {
  const { apiKey } = useFleetwork()
  const date = options.date ?? startOfTodayMs()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  const q = useQuery({
    queryKey: ['fw', apiKey, 'memberReport', date, page, pageSize],
    queryFn: () =>
      DashboardController.getMemberReport(date, { page, pageSize }),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseActivityHeatmapOptions extends BaseOptions {
  from?: number
  to?: number
}

export function useActivityHeatmap(
  options: UseActivityHeatmapOptions = {}
): QueryResult<ActivityHeatmapData> {
  const { apiKey } = useFleetwork()
  const to = options.to ?? Date.now()
  const from = options.from ?? daysAgoMs(14)
  const q = useQuery({
    queryKey: ['fw', apiKey, 'heatmap', from, to],
    queryFn: () => DashboardController.getActivityHeatmap(from, to),
    enabled: options.enabled ?? true,
    refetchInterval: refetch(options.pollInterval),
  })
  return toResult(q)
}

export interface UseFuelTrackingOptions extends BaseOptions {
  from?: number
  to?: number
  groupBy?: FuelGroupBy
}

export function useFuelTracking(
  options: UseFuelTrackingOptions = {}
): QueryResult<FuelTrackingData> {
  const { apiKey } = useFleetwork()
  const from = options.from ?? startOfYearMs()
  const to = options.to ?? endOfYearMs()
  const groupBy = options.groupBy ?? 'month'
  const q = useQuery({
    queryKey: ['fw', apiKey, 'fuel', from, to, groupBy],
    queryFn: () =>
      DashboardController.getFuelTracking(from, to, { groupBy }),
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
}

export function useMembers(
  options: UseMembersOptions = {}
): QueryResult<MemberStatus[]> {
  const { apiKey } = useFleetwork()
  const { nameKey } = options
  const q = useQuery({
    queryKey: ['fw', apiKey, 'members', nameKey],
    queryFn: () => LiveMapController.getMembers({ nameKey }),
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
