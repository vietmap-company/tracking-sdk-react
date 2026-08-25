/**
 * LiveMapController — facade gọn. Logic thật nằm trong:
 *   - `livemap/members.ts` — danh sách member, vị trí mới nhất
 *   - `livemap/history.ts` — tuyến lịch sử, map-matching segments
 * Public API (import path + method signatures) giữ nguyên.
 */
import {
  getLastLocation,
  getMember,
  getMembers,
} from './livemap/members'
import {
  getHistoryComparison,
  getHistoryRoute,
} from './livemap/history'
import {
  downloadMembersExport,
  exportMembers,
} from './livemap/export'

export type { GetMembersOptions } from './livemap/members'
export type { GetHistoryOptions } from './livemap/history'
export type { ExportMembersOptions } from './livemap/export'
export { mergeSegmentsByIndex } from './livemap/history'
export { buildMembersWorkbook } from './livemap/export'

export const LiveMapController = {
  getMembers,
  getMember,
  getLastLocation,
  getHistoryComparison,
  getHistoryRoute,
  /** Xuất danh sách member ra Excel (Blob) — lọc theo `statuses`, bỏ trống = tất cả. */
  exportMembers,
  /** Như `exportMembers` nhưng tải thẳng file .xlsx về máy (browser). */
  downloadMembersExport,
}
