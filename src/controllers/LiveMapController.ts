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

export type { GetMembersOptions } from './livemap/members'
export type { GetHistoryOptions } from './livemap/history'
export { mergeSegmentsByIndex } from './livemap/history'

export const LiveMapController = {
  getMembers,
  getMember,
  getLastLocation,
  getHistoryComparison,
  getHistoryRoute,
}
