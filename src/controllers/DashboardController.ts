/**
 * DashboardController — API cho các widget Dashboard.
 * Helpers chung (client, cleanIds, chunk, paginate) nằm trong `shared.ts`.
 */
import type { AxiosInstance } from 'axios'
import { HttpService } from '@/lib/http'
import { startOfTodayMs } from '@/lib/utils'
import {
  MAX_USER_IDS,
  chunk,
  cleanIds,
  paginate,
  resolveClient,
  type WithClient,
} from './shared'
import type {
  ActivityHeatmapData,
  FuelGroupBy,
  FuelTrackingData,
  MemberReportData,
  MemberRow,
  MemberStatusKind,
  MonthlyExpensesData,
  SummaryCardsData,
} from '@/lib/types'

export interface GetSummaryOptions extends WithClient {
  date?: number
  userIds?: string[]
}
export interface GetMemberReportOptions extends WithClient {
  page?: number
  pageSize?: number
  status?: MemberStatusKind
  userIds?: string[]
}
export interface GetActivityHeatmapOptions extends WithClient {
  metric?: 'distance' | 'points'
  userId?: string
  userIds?: string[]
}
export interface GetFuelOptions extends WithClient {
  groupBy?: FuelGroupBy
  userId?: string
  userIds?: string[]
}
export interface GetExpensesOptions extends WithClient {
  currency?: string
  userIds?: string[]
}

// POST dashboard/gps-manager/users giới hạn pageSize tối đa 100.
const DASHBOARD_POST_PAGE_SIZE = 100

// Lấy toàn bộ rows của 1 chunk userIds (≤1000) qua POST, lặp hết các trang.
async function fetchAllMemberRows(
  client: AxiosInstance,
  body: { date: number; status?: MemberStatusKind; userIds: string[] },
): Promise<MemberRow[]> {
  const first = await HttpService.post<MemberReportData>(
    'dashboard/gps-manager/users',
    { ...body, page: 1, pageSize: DASHBOARD_POST_PAGE_SIZE },
    client,
  )
  let rows = first.users
  const totalPages = first.pagination?.totalPages ?? 1
  for (let p = 2; p <= totalPages; p++) {
    const next = await HttpService.post<MemberReportData>(
      'dashboard/gps-manager/users',
      { ...body, page: p, pageSize: DASHBOARD_POST_PAGE_SIZE },
      client,
    )
    rows = rows.concat(next.users)
  }
  return rows
}

export const DashboardController = {
  async getSummaryCards(
    options: GetSummaryOptions = {},
  ): Promise<SummaryCardsData> {
    const date = options.date ?? startOfTodayMs()
    return HttpService.post<SummaryCardsData>(
      'dashboard/gps-manager/summary',
      { date, userIds: cleanIds(options.userIds) },
      resolveClient(options),
    )
  },

  async getMemberReport(
    date: number = startOfTodayMs(),
    options: GetMemberReportOptions = {},
  ): Promise<MemberReportData> {
    const userIds = cleanIds(options.userIds)
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 10

    // ≤ 1000 ids (hoặc không lọc): 1 POST, backend lọc + phân trang server-side.
    if (!userIds || userIds.length <= MAX_USER_IDS) {
      return HttpService.post<MemberReportData>(
        'dashboard/gps-manager/users',
        { date, status: options.status, userIds, page, pageSize },
        resolveClient(options),
      )
    }

    // > 1000 ids: tách thành nhiều POST (mỗi call ≤ 1000), lấy hết rows mỗi chunk
    // rồi gộp + tính lại summary/pagination. Các chunk có id rời nhau nên không trùng.
    const parts = await Promise.all(
      chunk(userIds, MAX_USER_IDS).map((ids) =>
        fetchAllMemberRows(resolveClient(options), {
          date,
          status: options.status,
          userIds: ids,
        }),
      ),
    )
    const users = parts.flat()
    const summary = {
      total: users.length,
      moving: users.filter((u) => u.status === 'moving').length,
      stopped: users.filter((u) => u.status === 'stopped').length,
      signalLost: users.filter((u) => u.status === 'signal_lost').length,
    }
    const { rows, pagination } = paginate(users, page, pageSize)
    return { date, summary, users: rows, pagination }
  },

  async getActivityHeatmap(
    from: number,
    to: number,
    options: GetActivityHeatmapOptions = {},
  ): Promise<ActivityHeatmapData> {
    return HttpService.post<ActivityHeatmapData>(
      'dashboard/gps-manager/activity-heatmap',
      {
        from,
        to,
        metric: options.metric ?? 'distance',
        userId: options.userId,
        userIds: cleanIds(options.userIds),
      },
      resolveClient(options),
    )
  },

  async getFuelTracking(
    from: number,
    to: number,
    options: GetFuelOptions = {},
  ): Promise<FuelTrackingData> {
    return HttpService.post<FuelTrackingData>(
      'dashboard/gps-manager/fuel-tracking',
      {
        from,
        to,
        groupBy: options.groupBy ?? 'month',
        userId: options.userId,
        userIds: cleanIds(options.userIds),
      },
      resolveClient(options),
    )
  },

  async getMonthlyExpenses(
    from: number,
    to: number,
    options: GetExpensesOptions = {},
  ): Promise<MonthlyExpensesData> {
    return HttpService.post<MonthlyExpensesData>(
      'dashboard/gps-manager/monthly-costs',
      { from, to, currency: options.currency ?? 'VND', userIds: cleanIds(options.userIds) },
      resolveClient(options),
    )
  },
}
