import type { AxiosInstance } from 'axios'
import { getGlobalClient, request } from '@/lib/http'
import { startOfTodayMs } from '@/lib/utils'
import type {
  ActivityHeatmapData, FuelGroupBy, FuelTrackingData,
  MemberReportData, MemberRow, MemberStatusKind, MonthlyExpensesData, SummaryCardsData,
} from '@/lib/types'

export interface GetSummaryOptions { date?: number; userIds?: string[]; client?: AxiosInstance }
export interface GetMemberReportOptions { page?: number; pageSize?: number; status?: MemberStatusKind; userIds?: string[]; client?: AxiosInstance }
export interface GetActivityHeatmapOptions { metric?: 'distance' | 'points'; userId?: string; userIds?: string[]; client?: AxiosInstance }
export interface GetFuelOptions { groupBy?: FuelGroupBy; userId?: string; userIds?: string[]; client?: AxiosInstance }
export interface GetExpensesOptions { currency?: string; userIds?: string[]; client?: AxiosInstance }

function c(opts?: { client?: AxiosInstance }): AxiosInstance { return opts?.client ?? getGlobalClient() }

// Backend giới hạn tối đa 1000 userId mỗi request → vượt thì tách call.
const MAX_USER_IDS = 1000
function cleanIds(userIds?: string[]): string[] | undefined {
  const ids = userIds?.filter((id) => id != null && id !== '')
  return ids?.length ? ids : undefined
}
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// POST dashboard/gps-manager/users giới hạn pageSize tối đa 100.
const DASHBOARD_POST_PAGE_SIZE = 100

// Lấy toàn bộ rows của 1 chunk userIds (≤1000) qua POST, lặp hết các trang.
async function fetchAllMemberRows(
  client: AxiosInstance,
  body: { date: number; status?: MemberStatusKind; userIds: string[] },
): Promise<MemberRow[]> {
  const first = await request<MemberReportData>(client, {
    method: 'POST', url: 'dashboard/gps-manager/users',
    data: { ...body, page: 1, pageSize: DASHBOARD_POST_PAGE_SIZE },
  })
  let rows = first.users
  const totalPages = first.pagination?.totalPages ?? 1
  for (let p = 2; p <= totalPages; p++) {
    const next = await request<MemberReportData>(client, {
      method: 'POST', url: 'dashboard/gps-manager/users',
      data: { ...body, page: p, pageSize: DASHBOARD_POST_PAGE_SIZE },
    })
    rows = rows.concat(next.users)
  }
  return rows
}

export const DashboardController = {
  async getSummaryCards(options: GetSummaryOptions = {}): Promise<SummaryCardsData> {
    const date = options.date ?? startOfTodayMs()
    return request<SummaryCardsData>(c(options), { method: 'POST', url: 'dashboard/gps-manager/summary', data: { date, userIds: cleanIds(options.userIds) } })
  },

  async getMemberReport(date: number = startOfTodayMs(), options: GetMemberReportOptions = {}): Promise<MemberReportData> {
    const userIds = cleanIds(options.userIds)
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 10

    // ≤ 1000 ids (hoặc không lọc): 1 POST, backend lọc + phân trang server-side.
    if (!userIds || userIds.length <= MAX_USER_IDS) {
      return request<MemberReportData>(c(options), {
        method: 'POST', url: 'dashboard/gps-manager/users',
        data: { date, status: options.status, userIds, page, pageSize },
      })
    }

    // > 1000 ids: tách thành nhiều POST (mỗi call ≤ 1000), lấy hết rows mỗi chunk
    // rồi gộp + tính lại summary/pagination. Các chunk có id rời nhau nên không trùng.
    const parts = await Promise.all(
      chunk(userIds, MAX_USER_IDS).map((ids) =>
        fetchAllMemberRows(c(options), { date, status: options.status, userIds: ids }),
      ),
    )
    const users = parts.flat()
    const summary = {
      total: users.length,
      moving: users.filter((u) => u.status === 'moving').length,
      stopped: users.filter((u) => u.status === 'stopped').length,
      signalLost: users.filter((u) => u.status === 'signal_lost').length,
    }
    const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
    const start = (page - 1) * pageSize
    return {
      date,
      summary,
      users: users.slice(start, start + pageSize),
      pagination: { page, pageSize, totalItems: users.length, totalPages },
    }
  },

  async getActivityHeatmap(from: number, to: number, options: GetActivityHeatmapOptions = {}): Promise<ActivityHeatmapData> {
    return request<ActivityHeatmapData>(c(options), {
      method: 'POST', url: 'dashboard/gps-manager/activity-heatmap',
      data: { from, to, metric: options.metric ?? 'distance', userId: options.userId, userIds: cleanIds(options.userIds) },
    })
  },

  async getFuelTracking(from: number, to: number, options: GetFuelOptions = {}): Promise<FuelTrackingData> {
    return request<FuelTrackingData>(c(options), {
      method: 'POST', url: 'dashboard/gps-manager/fuel-tracking',
      data: { from, to, groupBy: options.groupBy ?? 'month', userId: options.userId, userIds: cleanIds(options.userIds) },
    })
  },

  async getMonthlyExpenses(from: number, to: number, options: GetExpensesOptions = {}): Promise<MonthlyExpensesData> {
    return request<MonthlyExpensesData>(c(options), {
      method: 'POST', url: 'dashboard/gps-manager/monthly-costs',
      data: { from, to, currency: options.currency ?? 'VND', userIds: cleanIds(options.userIds) },
    })
  },
}
