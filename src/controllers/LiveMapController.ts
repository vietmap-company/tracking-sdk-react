import type { AxiosInstance } from "axios";
import { getGlobalClient, request } from "@/lib/http";
import type {
  GpsPoint,
  GpsUsersResponse,
  GpsUserRow,
  HistoryRouteResponse,
  MemberStatus,
} from "@/lib/types";

export interface GetMembersOptions {
  client?: AxiosInstance;
  nameKey?: string;
  pageSize?: number;
  /**
   * Restrict the result to these user ids. Sent to the API which filters
   * server-side. An empty array is treated as "no filter" (all users).
   */
  userIds?: string[];
}

function parseMeta(
  raw?: string | Record<string, unknown> | null,
): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "object") {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") out[k] = v;
      else if (typeof v === "number" || typeof v === "boolean")
        out[k] = String(v);
    }
    return out;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function resolveStatus(code?: number): {
  status: MemberStatus["status"];
  statusLabel: string;
} {
  switch (code) {
    case 1:
      return { status: "moving", statusLabel: "Đang di chuyển" };
    case 2:
      return { status: "stopped", statusLabel: "Dừng" };
    default:
      return { status: "signal_lost", statusLabel: "Mất tín hiệu" };
  }
}

function or(...values: (string | null | undefined)[]): string | undefined {
  return values.find((v) => v != null && v !== "") as string | undefined;
}

function rowToMember(row: GpsUserRow, nameKey?: string): MemberStatus {
  const meta = parseMeta(row.lastLocation?.metadata);
  const uid = or(row.userId, row.deviceId, row.vehicleId) ?? row.id;
  const name = nameKey ? (or(meta[nameKey]) ?? uid.slice(0, 5)) : uid;
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
  };
}

function c(opts?: { client?: AxiosInstance }): AxiosInstance {
  return opts?.client ?? getGlobalClient();
}

// Backend giới hạn tối đa 1000 userId mỗi request → vượt thì tách call.
const MAX_USER_IDS = 1000;

export const LiveMapController = {
  async getMembers(options: GetMembersOptions = {}): Promise<MemberStatus[]> {
    const userIds = options.userIds?.filter((id) => id != null && id !== "");
    const pageSize = options.pageSize ?? 3000;
    const client = c(options);

    // Dùng bản POST (body) cho gps-tracking/users — lọc userIds server-side.
    const fetchPage = (ids?: string[]) =>
      request<GpsUsersResponse>(client, {
        method: "POST",
        url: "gps-tracking/users",
        data: { userIds: ids, pageNumber: 1, pageSize },
      });

    // ≤ 1000 ids (hoặc không lọc): 1 POST.
    if (!userIds?.length || userIds.length <= MAX_USER_IDS) {
      const data = await fetchPage(userIds?.length ? userIds : undefined);
      return data.users.map((row) => rowToMember(row, options.nameKey));
    }

    // > 1000 ids: tách chunk ≤1000, gộp users (id rời nhau nên không trùng).
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += MAX_USER_IDS)
      chunks.push(userIds.slice(i, i + MAX_USER_IDS));
    const parts = await Promise.all(chunks.map((ids) => fetchPage(ids)));
    return parts
      .flatMap((d) => d.users)
      .map((row) => rowToMember(row, options.nameKey));
  },

  async getMember(
    userId: string,
    options: GetMembersOptions = {},
  ): Promise<MemberStatus | null> {
    const members = await this.getMembers(options);
    return members.find((m) => m.userId === userId) ?? null;
  },

  async getLastLocation(
    userId: string,
    options: { client?: AxiosInstance } = {},
  ): Promise<GpsPoint | null> {
    return (
      (await request<GpsPoint | null>(c(options), {
        method: "GET",
        url: `gps-tracking/latest/users/${encodeURIComponent(userId)}`,
      })) ?? null
    );
  },

  async getHistoryRoute(
    userId: string,
    startTime: number,
    endTime: number,
    options: { client?: AxiosInstance } = {},
  ): Promise<GpsPoint[]> {
    const res = await request<HistoryRouteResponse>(c(options), {
      method: "GET",
      url: "gps-tracking/history",
      params: { UserId: userId, FromTime: startTime, ToTime: endTime },
    });
    return (res?.trackingData ?? []).sort((a, b) => a.time - b.time);
  },
};
