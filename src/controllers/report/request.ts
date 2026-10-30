import { HttpService } from '@/lib/http'
import {
  MAX_USER_IDS,
  chunk,
  cleanIds,
  paginate,
  resolveClient,
  type WithClient,
} from '@/controllers/shared'
import type { DurationValue, FuelReportTotals, ReportPagination } from '@/lib/types'

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

/** Ráp lại response sau khi gộp rows từ nhiều request: `allRows` (đủ, đã sort)
 *  để tính totals, `pagedRows` + `pagination` là trang đang xem. */
export type MergeRows<T, R> = (
  base: T,
  allRows: R[],
  pagedRows: R[],
  pagination: ReportPagination,
) => T

// POST reports/*/summary giới hạn pageSize tối đa 200.
const REPORT_POST_PAGE_SIZE = 200

// GET detail mang userIds trên query string — mỗi request giữ phần userIds
// dưới ngưỡng này để URL không vượt giới hạn ~8KB phổ biến của proxy/server.
const DETAIL_QUERY_BUDGET = 6000

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

// Lấy toàn bộ rows qua mọi trang của một request (một nhóm userIds).
async function fetchAllPages<T, R>(
  fetchPage: (page: number) => Promise<T>,
  rowsOf: (d: T) => R[],
): Promise<{ base: T; rows: R[] }> {
  const first = await fetchPage(1)
  let rows = rowsOf(first)
  const totalPages =
    (first as { pagination?: ReportPagination }).pagination?.totalPages ?? 1
  for (let p = 2; p <= totalPages; p++) {
    rows = rows.concat(rowsOf(await fetchPage(p)))
  }
  return { base: first, rows }
}

// `sortBy` là tên field phía backend; vài key khác tên field trên dòng.
const SORT_FIELD_ALIAS: Record<string, string> = {
  totalDistance: 'totalDistanceKm',
  maxSpeed: 'maxSpeedKmh',
  minSpeed: 'minSpeedKmh',
}

/** Giá trị số của một dòng theo `sortBy` — field thời lượng (`{ totalSeconds }`)
 *  lấy số giây. `undefined` khi dòng không có field đó. */
function sortValueOf(row: unknown, sortBy: string): number | undefined {
  const v = (row as Record<string, unknown>)[SORT_FIELD_ALIAS[sortBy] ?? sortBy]
  if (typeof v === 'number') return v
  const seconds = (v as DurationValue | null | undefined)?.totalSeconds
  return typeof seconds === 'number' ? seconds : undefined
}

/** Kết quả gộp từ nhiều request chỉ được sort trong từng request — sort lại
 *  toàn bộ ở client cho khớp `sortBy`/`sortDesc`. Không có `sortBy` thì giữ thứ tự. */
function sortRows<R>(rows: R[], o: BaseReportOptions): R[] {
  const key = o.sortBy
  if (!key) return rows
  const dir = o.sortDesc ? -1 : 1
  return rows
    .slice()
    .sort((a, b) => ((sortValueOf(a, key) ?? 0) - (sortValueOf(b, key) ?? 0)) * dir)
}

/** Chia ids thành nhóm sao cho phần `userIds=…&` của mỗi nhóm ≤ `budget` ký tự. */
function chunkByQueryLength(ids: string[], budget: number): string[][] {
  const out: string[][] = []
  let cur: string[] = []
  let len = 0
  for (const id of ids) {
    const part = `userIds=${encodeURIComponent(id)}&`.length
    if (cur.length && len + part > budget) {
      out.push(cur)
      cur = []
      len = 0
    }
    cur.push(id)
    len += part
  }
  if (cur.length) out.push(cur)
  return out
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
 * - > 1000 ids: tách chunk ≤1000, lấy hết rows mỗi chunk rồi gộp + sort + phân
 *   trang lại (kết quả trải trên nhiều call). `rowsOf` đọc mảng rows, `merge` ráp lại response.
 */
export async function summaryRequest<T, R extends { userId: string }>(
  o: BaseReportOptions,
  url: string,
  rowsOf: (d: T) => R[],
  merge: MergeRows<T, R>,
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
  const client = resolveClient(o)
  const results = await Promise.all(
    chunk(ids, MAX_USER_IDS).map((chunkIds) =>
      fetchAllPages<T, R>(
        (page) =>
          HttpService.post<T>(
            url,
            { ...summaryBody(o), userIds: chunkIds, page, pageSize: REPORT_POST_PAGE_SIZE },
            client,
          ),
        rowsOf,
      ),
    ),
  )
  const allRows = sortRows(results.flatMap((r) => r.rows), o)
  const { rows, pagination } = paginate(allRows, o.page, o.pageSize)
  return merge(results[0].base, allRows, rows, pagination)
}

/**
 * Báo cáo DETAIL chỉ có bản GET (BE.md) — userIds đi trên query string dạng
 * repeated `userIds=a&userIds=b`. Drill-down dùng `userId` đơn (backend lọc).
 * - Không lọc, hoặc ids vừa một URL: 1 GET, backend lọc + phân trang.
 * - ids quá dài cho một URL: chia nhóm theo độ dài query, lấy hết rows mỗi
 *   nhóm (giữ pageSize của caller) rồi gộp + sort + phân trang lại ở client.
 */
export async function detailRequest<T, R>(
  o: BaseReportOptions,
  url: string,
  rowsOf: (d: T) => R[],
  merge: MergeRows<T, R>,
): Promise<T> {
  const ids = cleanIds(o.userIds)
  const groups = ids ? chunkByQueryLength(ids, DETAIL_QUERY_BUDGET) : []
  if (groups.length <= 1) {
    return HttpService.get<T>(url, buildParams(o), resolveClient(o))
  }
  const client = resolveClient(o)
  const results = await Promise.all(
    groups.map((groupIds) =>
      fetchAllPages<T, R>(
        (page) =>
          HttpService.get<T>(
            url,
            { ...buildParams(o), userIds: groupIds, page },
            client,
          ),
        rowsOf,
      ),
    ),
  )
  const allRows = sortRows(results.flatMap((r) => r.rows), o)
  const { rows, pagination } = paginate(allRows, o.page, o.pageSize)
  return merge(results[0].base, allRows, rows, pagination)
}
