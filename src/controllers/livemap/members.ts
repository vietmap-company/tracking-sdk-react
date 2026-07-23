import { HttpService } from '@/lib/http'
import {
  MAX_USER_IDS,
  chunk,
  cleanIds,
  resolveClient,
  type WithClient,
} from '@/controllers/shared'
import type {
  GpsPoint,
  GpsUserRow,
  GpsUsersResponse,
  MemberStatus,
} from '@/lib/types'

export interface GetMembersOptions extends WithClient {
  nameKey?: string
  pageSize?: number
  /**
   * Restrict the result to these user ids. Sent to the API which filters
   * server-side. An empty array is treated as "no filter" (all users).
   */
  userIds?: string[]
}

function parseMeta(
  raw?: string | Record<string, unknown> | null,
): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'object') {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === 'string') out[k] = v
      else if (typeof v === 'number' || typeof v === 'boolean')
        out[k] = String(v)
    }
    return out
  }
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {}
  } catch {
    return {}
  }
}

function resolveStatus(code?: number): {
  status: MemberStatus['status']
  statusLabel: string
} {
  switch (code) {
    case 1:
      return { status: 'moving', statusLabel: 'Đang di chuyển' }
    case 2:
      return { status: 'stopped', statusLabel: 'Dừng' }
    default:
      return { status: 'signal_lost', statusLabel: 'Mất tín hiệu' }
  }
}

function or(...values: (string | null | undefined)[]): string | undefined {
  return values.find((v) => v != null && v !== '') as string | undefined
}

function rowToMember(row: GpsUserRow, nameKey?: string): MemberStatus {
  const meta = parseMeta(row.lastLocation?.metadata)
  const uid = or(row.userId, row.deviceId, row.vehicleId) ?? row.id
  const name = nameKey ? (or(meta[nameKey]) ?? uid.slice(0, 30)) : uid
  return {
    userId: uid,
    name,
    avatarUrl: meta.userAvatar ?? null,
    groupName: null,
    ...resolveStatus(row.statusCode),
    lat: row.lastLocation?.lat ?? 0,
    lng: row.lastLocation?.lng ?? 0,
    speed: row.lastLocation?.speed,
    lastSeenAt: row.lastSeenAt,
  }
}

export async function getMembers(
  options: GetMembersOptions = {},
): Promise<MemberStatus[]> {
  const userIds = cleanIds(options.userIds)
  const pageSize = options.pageSize ?? 3000
  const client = resolveClient(options)

  // Dùng bản POST (body) cho gps-tracking/users — lọc userIds server-side.
  const fetchPage = (ids?: string[]) =>
    HttpService.post<GpsUsersResponse>(
      'gps-tracking/users',
      { userIds: ids, pageNumber: 1, pageSize },
      client,
    )

  // ≤ 1000 ids (hoặc không lọc): 1 POST.
  if (!userIds || userIds.length <= MAX_USER_IDS) {
    const data = await fetchPage(userIds)
    return data.users.map((row) => rowToMember(row, options.nameKey))
  }

  // > 1000 ids: tách chunk ≤1000, gộp users (id rời nhau nên không trùng).
  const parts = await Promise.all(
    chunk(userIds, MAX_USER_IDS).map((ids) => fetchPage(ids)),
  )
  return parts
    .flatMap((d) => d.users)
    .map((row) => rowToMember(row, options.nameKey))
}

export async function getMember(
  userId: string,
  options: GetMembersOptions = {},
): Promise<MemberStatus | null> {
  const members = await getMembers(options)
  return members.find((m) => m.userId === userId) ?? null
}

export async function getLastLocation(
  userId: string,
  options: WithClient = {},
): Promise<GpsPoint | null> {
  return (
    (await HttpService.get<GpsPoint | null>(
      `gps-tracking/latest/users/${encodeURIComponent(userId)}`,
      undefined,
      resolveClient(options),
    )) ?? null
  )
}
