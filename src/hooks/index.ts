import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardController } from '@/controllers/DashboardController'
import { LiveMapController } from '@/controllers/LiveMapController'
import { ReportController } from '@/controllers/ReportController'
import { startOfTodayMs, startOfYearMs, endOfYearMs, daysAgoMs } from '@/lib/utils'
import type {
  ActivityHeatmapData, ActivityTimeReportData, FuelDetailReportData,
  FuelGroupBy, FuelSummaryReportData, FuelTrackingData, GpsPoint,
  MemberReportData, MemberStatus, MemberStatusKind, MonthlyExpensesData,
  SummaryCardsData, TripDetailReportData, TripSummaryReportData,
} from '@/lib/types'

export interface QueryResult<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Stable default: compute once on mount, never recompute (avoids infinite loops
 * when the caller omits a time-based prop like `from`/`to`/`date`).
 */
function useStableDefault<T>(compute: () => T): T {
  const ref = useRef<T | undefined>(undefined)
  if (ref.current === undefined) ref.current = compute()
  return ref.current
}

/** Delay before showing skeleton — avoids flash for fast responses */
const SKELETON_DELAY_MS = 150

/**
 * Core fetch hook.
 * - Delays isLoading=true by 150ms → no skeleton flash for fast requests
 * - Keeps stale data while refetching → no jarring blank→data transition
 * - On error, stops retrying (no spam). User calls `refetch` manually.
 */
function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
  pollInterval?: number,
): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const hasDataRef = useRef(false)
  // Track latest fetch so stale responses from cancelled calls are ignored
  const fetchIdRef = useRef(0)

  const doFetch = useCallback(async () => {
    if (!enabled) return
    setError(null)

    const fetchId = ++fetchIdRef.current

    let skeletonTimer: ReturnType<typeof setTimeout> | null = null
    if (!hasDataRef.current) {
      skeletonTimer = setTimeout(() => {
        if (fetchId === fetchIdRef.current) setIsLoading(true)
      }, SKELETON_DELAY_MS)
    }

    try {
      const result = await fetcherRef.current()
      // Only commit if this is still the latest fetch
      if (fetchId === fetchIdRef.current) {
        hasDataRef.current = true
        setData(result)
      }
    } catch (e) {
      if (fetchId === fetchIdRef.current) {
        setError(e instanceof Error ? e : new Error(String(e)))
      }
    } finally {
      if (skeletonTimer) clearTimeout(skeletonTimer)
      if (fetchId === fetchIdRef.current) setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(() => { doFetch() }, [doFetch])

  useEffect(() => {
    if (!pollInterval || pollInterval <= 0 || !enabled) return
    const id = setInterval(() => doFetch(), pollInterval)
    return () => clearInterval(id)
  }, [doFetch, pollInterval, enabled])

  return { data, isLoading, error, refetch: doFetch }
}

// ─── Dashboard Hooks ──────────────────────────────────────────────────────────

export interface UseSummaryCardsOptions {
  date?: number
  pollInterval?: number
  enabled?: boolean
}
export function useSummaryCards(options: UseSummaryCardsOptions = {}): QueryResult<SummaryCardsData> {
  const defaultDate = useStableDefault(startOfTodayMs)
  const date = options.date ?? defaultDate
  return useFetch(
    () => DashboardController.getSummaryCards({ date }),
    [date],
    options.enabled,
    options.pollInterval,
  )
}

export interface UseMemberReportOptions {
  date?: number
  page?: number
  pageSize?: number
  status?: MemberStatusKind
  pollInterval?: number
  enabled?: boolean
}
export function useMemberReport(options: UseMemberReportOptions = {}): QueryResult<MemberReportData> {
  const defaultDate = useStableDefault(startOfTodayMs)
  const date = options.date ?? defaultDate
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 10
  const status = options.status
  return useFetch(
    () => DashboardController.getMemberReport(date, { page, pageSize, status }),
    [date, page, pageSize, status],
    options.enabled,
    options.pollInterval,
  )
}

export interface UseActivityHeatmapOptions {
  from?: number
  to?: number
  metric?: 'distance' | 'points'
  userId?: string
  pollInterval?: number
  enabled?: boolean
}
export function useActivityHeatmap(options: UseActivityHeatmapOptions = {}): QueryResult<ActivityHeatmapData> {
  const defaultFrom = useStableDefault(() => daysAgoMs(14))
  const defaultTo = useStableDefault(() => Date.now())
  const from = options.from ?? defaultFrom
  const to = options.to ?? defaultTo
  const metric = options.metric ?? 'distance'
  const userId = options.userId
  return useFetch(
    () => DashboardController.getActivityHeatmap(from, to, { metric, userId }),
    [from, to, metric, userId],
    options.enabled,
    options.pollInterval,
  )
}

export interface UseFuelTrackingOptions {
  from?: number
  to?: number
  groupBy?: FuelGroupBy
  userId?: string
  pollInterval?: number
  enabled?: boolean
}
export function useFuelTracking(options: UseFuelTrackingOptions = {}): QueryResult<FuelTrackingData> {
  const defaultFrom = useStableDefault(startOfYearMs)
  const defaultTo = useStableDefault(endOfYearMs)
  const from = options.from ?? defaultFrom
  const to = options.to ?? defaultTo
  const groupBy = options.groupBy ?? 'month'
  const userId = options.userId
  return useFetch(
    () => DashboardController.getFuelTracking(from, to, { groupBy, userId }),
    [from, to, groupBy, userId],
    options.enabled,
    options.pollInterval,
  )
}

export interface UseMonthlyExpensesOptions {
  from?: number
  to?: number
  currency?: string
  pollInterval?: number
  enabled?: boolean
}
export function useMonthlyExpenses(options: UseMonthlyExpensesOptions = {}): QueryResult<MonthlyExpensesData> {
  const defaultFrom = useStableDefault(startOfYearMs)
  const defaultTo = useStableDefault(endOfYearMs)
  const from = options.from ?? defaultFrom
  const to = options.to ?? defaultTo
  const currency = options.currency ?? 'VND'
  return useFetch(
    () => DashboardController.getMonthlyExpenses(from, to, { currency }),
    [from, to, currency],
    options.enabled,
    options.pollInterval,
  )
}

// ─── LiveMap Hooks ────────────────────────────────────────────────────────────

export interface UseMembersOptions {
  nameKey?: string
  maxUsers?: number
  pollInterval?: number
  enabled?: boolean
  /** Only fetch/display these user ids. Empty or omitted means all users. */
  userIds?: string[]
}
export function useMembers(options: UseMembersOptions = {}): QueryResult<MemberStatus[]> {
  const { nameKey, maxUsers, userIds } = options
  // Stable dep key so a fresh `userIds` array reference each render does not
  // re-trigger the fetch when the ids are unchanged.
  const userIdsKey = userIds?.join(',') ?? ''
  return useFetch(
    () => LiveMapController.getMembers({ nameKey, pageSize: maxUsers, userIds }),
    [nameKey, maxUsers, userIdsKey],
    options.enabled,
    options.pollInterval,
  )
}

export function useMember(userId: string, options: UseMembersOptions = {}): QueryResult<MemberStatus | null> {
  const { nameKey } = options
  const enabled = (options.enabled ?? true) && !!userId
  return useFetch(
    () => LiveMapController.getMember(userId, { nameKey }),
    [userId, nameKey],
    enabled,
    options.pollInterval,
  )
}

export interface UseHistoryRouteOptions {
  userId: string
  startTime: number
  endTime: number
  pollInterval?: number
  enabled?: boolean
}
export function useHistoryRoute(options: UseHistoryRouteOptions): QueryResult<GpsPoint[]> {
  const { userId, startTime, endTime } = options
  const enabled = (options.enabled ?? true) && !!userId
  return useFetch(
    () => LiveMapController.getHistoryRoute(userId, startTime, endTime),
    [userId, startTime, endTime],
    enabled,
    options.pollInterval,
  )
}

// ─── Report Hooks ─────────────────────────────────────────────────────────────

export interface UseReportOptions {
  from: number
  to: number
  userId?: string
  groupId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
  pollInterval?: number
  enabled?: boolean
}
export type UseActivityTimeReportOptions = Omit<UseReportOptions, 'sortBy' | 'sortDesc'>

function reportEnabled(o: { enabled?: boolean; from?: number; to?: number }): boolean {
  return (o.enabled ?? true) && !!o.from && !!o.to
}

export function useTripSummaryReport(options: UseReportOptions): QueryResult<TripSummaryReportData> {
  const { from, to, userId, groupId, page, pageSize, sortBy, sortDesc } = options
  return useFetch(
    () => ReportController.getTripSummary(options),
    [from, to, userId, groupId, page, pageSize, sortBy, sortDesc],
    reportEnabled(options),
    options.pollInterval,
  )
}

export function useTripDetailReport(options: UseReportOptions): QueryResult<TripDetailReportData> {
  const { from, to, userId, groupId, page, pageSize, sortBy, sortDesc } = options
  return useFetch(
    () => ReportController.getTripDetail(options),
    [from, to, userId, groupId, page, pageSize, sortBy, sortDesc],
    reportEnabled(options),
    options.pollInterval,
  )
}

export function useFuelSummaryReport(options: UseReportOptions): QueryResult<FuelSummaryReportData> {
  const { from, to, userId, groupId, page, pageSize, sortBy, sortDesc } = options
  return useFetch(
    () => ReportController.getFuelSummary(options),
    [from, to, userId, groupId, page, pageSize, sortBy, sortDesc],
    reportEnabled(options),
    options.pollInterval,
  )
}

export function useFuelDetailReport(options: UseReportOptions): QueryResult<FuelDetailReportData> {
  const { from, to, userId, groupId, page, pageSize, sortBy, sortDesc } = options
  return useFetch(
    () => ReportController.getFuelDetail(options),
    [from, to, userId, groupId, page, pageSize, sortBy, sortDesc],
    reportEnabled(options),
    options.pollInterval,
  )
}

export function useActivityTimeReport(options: UseActivityTimeReportOptions): QueryResult<ActivityTimeReportData> {
  const { from, to, userId, groupId, page, pageSize } = options
  return useFetch(
    () => ReportController.getActivityTime(options),
    [from, to, userId, groupId, page, pageSize],
    reportEnabled(options),
    options.pollInterval,
  )
}
