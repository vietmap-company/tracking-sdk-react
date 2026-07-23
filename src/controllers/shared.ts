import type { AxiosInstance } from 'axios'
import { getGlobalClient } from '@/lib/http'
import type { ReportPagination } from '@/lib/types'

/** Option chung cho mọi controller — cho phép truyền client riêng khi test
 *  hoặc multi-tenant; mặc định dùng global client của FleetworkProvider. */
export interface WithClient {
  client?: AxiosInstance
}

export function resolveClient(opts?: WithClient): AxiosInstance {
  return opts?.client ?? getGlobalClient()
}

/** Backend giới hạn tối đa 1000 userId mỗi request → vượt thì tách call. */
export const MAX_USER_IDS = 1000

/** Bỏ id rỗng/null; trả undefined khi không còn gì (= không lọc). */
export function cleanIds(userIds?: string[]): string[] | undefined {
  const ids = userIds?.filter((id) => id != null && id !== '')
  return ids?.length ? ids : undefined
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Phân trang client-side cho kết quả đã gộp từ nhiều chunk request. */
export function paginate<T>(
  rows: T[],
  page = 1,
  pageSize = 50,
): { rows: T[]; pagination: ReportPagination } {
  const totalItems = rows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize
  return {
    rows: rows.slice(start, start + pageSize),
    pagination: { page, pageSize, totalItems, totalPages },
  }
}
