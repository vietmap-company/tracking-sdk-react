import type { AxiosInstance } from 'axios'
import { getGlobalClient, request } from '@/lib/http'
import type {
  ActivityTimeReportData, FuelDetailReportData, FuelReportTotals,
  FuelSummaryReportData, FuelSummaryRow, ReportPagination,
  TripDetailReportData, TripSummaryReportData, TripSummaryRow,
} from '@/lib/types'

export interface BaseReportOptions {
  from: number; to: number; userId?: string; userIds?: string[]; groupId?: string
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean
  format?: 'excel' | 'csv'; client?: AxiosInstance
}
export type ActivityTimeOptions = Omit<BaseReportOptions, 'sortBy' | 'sortDesc'>

// Lọc nhiều user: API yêu cầu repeated `userIds=a&userIds=b` (không dùng ngoặc `[]`).
const ARRAY_PARAMS = { indexes: null } as const
// Backend giới hạn tối đa 1000 userId mỗi request → vượt thì tách call.
const MAX_USER_IDS = 1000

function c(opts?: { client?: AxiosInstance }): AxiosInstance { return opts?.client ?? getGlobalClient() }

function cleanIds(userIds?: string[]): string[] | undefined {
  const ids = userIds?.filter((id) => id != null && id !== '')
  return ids?.length ? ids : undefined
}
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function buildParams(o: BaseReportOptions): Record<string, unknown> {
  return { from: o.from, to: o.to, userId: o.userId, userIds: cleanIds(o.userIds), groupId: o.groupId, page: o.page, pageSize: o.pageSize, sortBy: o.sortBy, sortDesc: o.sortDesc, format: o.format }
}

// POST reports/*/summary giới hạn pageSize tối đa 200.
const REPORT_POST_PAGE_SIZE = 200

// Body POST summary (caller tự set page/pageSize).
function summaryBody(o: BaseReportOptions): Record<string, unknown> {
  return { from: o.from, to: o.to, userId: o.userId, userIds: cleanIds(o.userIds), groupId: o.groupId, sortBy: o.sortBy, sortDesc: o.sortDesc }
}

// Lấy toàn bộ rows của 1 chunk userIds (≤1000) qua POST, lặp hết các trang.
async function fetchAllSummary<T, R>(
  client: AxiosInstance, url: string, body: Record<string, unknown>, rowsOf: (d: T) => R[],
): Promise<{ base: T; rows: R[] }> {
  const first = await request<T>(client, { method: 'POST', url, data: { ...body, page: 1, pageSize: REPORT_POST_PAGE_SIZE } })
  let rows = rowsOf(first)
  const totalPages = (first as { pagination?: ReportPagination }).pagination?.totalPages ?? 1
  for (let p = 2; p <= totalPages; p++) {
    const next = await request<T>(client, { method: 'POST', url, data: { ...body, page: p, pageSize: REPORT_POST_PAGE_SIZE } })
    rows = rows.concat(rowsOf(next))
  }
  return { base: first, rows }
}

function paginate<T>(rows: T[], page = 1, pageSize = 50): { rows: T[]; pagination: ReportPagination } {
  const totalItems = rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize
  return { rows: rows.slice(start, start + pageSize), pagination: { page, pageSize, totalItems, totalPages } }
}

function sumFuelTotals(rows: { distanceKm: number; fuelStandardLiters: number; totalCostVnd: number }[]): FuelReportTotals {
  const distanceKm = rows.reduce((s, r) => s + (r.distanceKm || 0), 0)
  const fuelStandardLiters = rows.reduce((s, r) => s + (r.fuelStandardLiters || 0), 0)
  const totalCostVnd = rows.reduce((s, r) => s + (r.totalCostVnd || 0), 0)
  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    fuelStandardLiters: Math.round(fuelStandardLiters * 100) / 100,
    totalCostVnd,
    totalCostFormatted: `${totalCostVnd.toLocaleString('vi-VN')} VND`,
  }
}

/**
 * Lọc nhiều user cho báo cáo SUMMARY qua bản POST (BE.md).
 * - Không lọc: GET như cũ.
 * - ≤ 1000 ids: 1 POST, backend lọc + phân trang server-side → trả thẳng.
 * - > 1000 ids: tách chunk ≤1000, lấy hết rows mỗi chunk rồi gộp + phân trang lại
 *   (kết quả trải trên nhiều call). `rowsOf` đọc mảng rows, `merge` ráp lại response.
 */
async function summaryRequest<T, R extends { userId: string }>(
  o: BaseReportOptions,
  url: string,
  rowsOf: (d: T) => R[],
  merge: (base: T, allRows: R[], pagedRows: R[], pagination: ReportPagination) => T,
): Promise<T> {
  const ids = cleanIds(o.userIds)
  // ≤ 1000 ids (hoặc không lọc): 1 POST, backend lọc + phân trang server-side.
  if (!ids || ids.length <= MAX_USER_IDS) {
    return request<T>(c(o), { method: 'POST', url, data: { ...summaryBody(o), page: o.page ?? 1, pageSize: o.pageSize ?? 20 } })
  }
  const results = await Promise.all(
    chunk(ids, MAX_USER_IDS).map((chunkIds) =>
      fetchAllSummary<T, R>(c(o), url, { ...summaryBody(o), userIds: chunkIds }, rowsOf),
    ),
  )
  const allRows = results.flatMap((r) => r.rows)
  const { rows, pagination } = paginate(allRows, o.page, o.pageSize)
  return merge(results[0].base, allRows, rows, pagination)
}

// Detail không có bản POST (BE.md) → GET thuần. Drill-down dùng `userId` đơn (backend lọc).
function detailRequest<T>(o: BaseReportOptions, url: string): Promise<T> {
  return request<T>(c(o), { method: 'GET', url, params: buildParams(o), paramsSerializer: ARRAY_PARAMS })
}

export const ReportController = {
  getTripSummary(options: BaseReportOptions): Promise<TripSummaryReportData> {
    return summaryRequest<TripSummaryReportData, TripSummaryRow>(
      options, 'reports/trip/summary',
      (d) => d.users,
      (base, _all, paged, pagination) => ({ ...base, users: paged, pagination }),
    )
  },
  getTripDetail(options: BaseReportOptions): Promise<TripDetailReportData> {
    return detailRequest<TripDetailReportData>(options, 'reports/trip/detail')
  },
  getFuelSummary(options: BaseReportOptions): Promise<FuelSummaryReportData> {
    return summaryRequest<FuelSummaryReportData, FuelSummaryRow>(
      options, 'reports/fuel/summary',
      (d) => d.users,
      (base, all, paged, pagination) => ({ ...base, users: paged, totals: sumFuelTotals(all), pagination }),
    )
  },
  getFuelDetail(options: BaseReportOptions): Promise<FuelDetailReportData> {
    return detailRequest<FuelDetailReportData>(options, 'reports/fuel/detail')
  },
  async getActivityTime(options: ActivityTimeOptions): Promise<ActivityTimeReportData> {
    return request<ActivityTimeReportData>(c(options), {
      method: 'GET', url: 'reports/activity-time',
      params: { from: options.from, to: options.to, userId: options.userId, groupId: options.groupId, page: options.page, pageSize: options.pageSize, format: options.format },
    })
  },
}
