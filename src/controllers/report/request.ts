import type { AxiosInstance } from 'axios'
import { HttpService } from '@/lib/http'
import {
  MAX_USER_IDS,
  chunk,
  cleanIds,
  paginate,
  resolveClient,
  type WithClient,
} from '@/controllers/shared'
import type { FuelReportTotals, ReportPagination } from '@/lib/types'

export interface BaseReportOptions extends WithClient {
  from: number
  to: number
  userId?: string
  userIds?: string[]
  groupId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDesc?: boolean
  format?: 'excel' | 'csv'
}
export type ActivityTimeOptions = Omit<BaseReportOptions, 'sortBy' | 'sortDesc'>

// POST reports/*/summary giới hạn pageSize tối đa 200.
const REPORT_POST_PAGE_SIZE = 200

function buildParams(o: BaseReportOptions): Record<string, unknown> {
  return {
    from: o.from,
    to: o.to,
    userId: o.userId,
    userIds: cleanIds(o.userIds),
    groupId: o.groupId,
    page: o.page,
    pageSize: o.pageSize,
    sortBy: o.sortBy,
    sortDesc: o.sortDesc,
    format: o.format,
  }
}

// Body POST summary (caller tự set page/pageSize).
function summaryBody(o: BaseReportOptions): Record<string, unknown> {
  return {
    from: o.from,
    to: o.to,
    userId: o.userId,
    userIds: cleanIds(o.userIds),
    groupId: o.groupId,
    sortBy: o.sortBy,
    sortDesc: o.sortDesc,
  }
}

// Lấy toàn bộ rows của 1 chunk userIds (≤1000) qua POST, lặp hết các trang.
async function fetchAllSummary<T, R>(
  client: AxiosInstance,
  url: string,
  body: Record<string, unknown>,
  rowsOf: (d: T) => R[],
): Promise<{ base: T; rows: R[] }> {
  const first = await HttpService.post<T>(
    url,
    { ...body, page: 1, pageSize: REPORT_POST_PAGE_SIZE },
    client,
  )
  let rows = rowsOf(first)
  const totalPages =
    (first as { pagination?: ReportPagination }).pagination?.totalPages ?? 1
  for (let p = 2; p <= totalPages; p++) {
    const next = await HttpService.post<T>(
      url,
      { ...body, page: p, pageSize: REPORT_POST_PAGE_SIZE },
      client,
    )
    rows = rows.concat(rowsOf(next))
  }
  return { base: first, rows }
}

export function sumFuelTotals(
  rows: { distanceKm: number; fuelStandardLiters: number; totalCostVnd: number }[],
): FuelReportTotals {
  const distanceKm = rows.reduce((s, r) => s + (r.distanceKm || 0), 0)
  const fuelStandardLiters = rows.reduce(
    (s, r) => s + (r.fuelStandardLiters || 0),
    0,
  )
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
 * - Không lọc: 1 POST, backend lọc + phân trang server-side → trả thẳng.
 * - ≤ 1000 ids: như trên.
 * - > 1000 ids: tách chunk ≤1000, lấy hết rows mỗi chunk rồi gộp + phân trang lại
 *   (kết quả trải trên nhiều call). `rowsOf` đọc mảng rows, `merge` ráp lại response.
 */
export async function summaryRequest<T, R extends { userId: string }>(
  o: BaseReportOptions,
  url: string,
  rowsOf: (d: T) => R[],
  merge: (
    base: T,
    allRows: R[],
    pagedRows: R[],
    pagination: ReportPagination,
  ) => T,
): Promise<T> {
  const ids = cleanIds(o.userIds)
  // ≤ 1000 ids (hoặc không lọc): 1 POST, backend lọc + phân trang server-side.
  if (!ids || ids.length <= MAX_USER_IDS) {
    return HttpService.post<T>(
      url,
      { ...summaryBody(o), page: o.page ?? 1, pageSize: o.pageSize ?? 20 },
      resolveClient(o),
    )
  }
  const results = await Promise.all(
    chunk(ids, MAX_USER_IDS).map((chunkIds) =>
      fetchAllSummary<T, R>(
        resolveClient(o),
        url,
        { ...summaryBody(o), userIds: chunkIds },
        rowsOf,
      ),
    ),
  )
  const allRows = results.flatMap((r) => r.rows)
  const { rows, pagination } = paginate(allRows, o.page, o.pageSize)
  return merge(results[0].base, allRows, rows, pagination)
}

// Detail không có bản POST (BE.md) → GET thuần. Drill-down dùng `userId` đơn
// (backend lọc). Mảng userIds được serializer của client emit dạng repeated
// `userIds=a&userIds=b` — đúng format backend yêu cầu.
export function detailRequest<T>(o: BaseReportOptions, url: string): Promise<T> {
  return HttpService.get<T>(url, buildParams(o), resolveClient(o))
}
