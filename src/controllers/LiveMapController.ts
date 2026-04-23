import type { AxiosInstance } from "axios";
import { getGlobalClient, request } from "@/lib/http";
import type {
  GpsPoint,
  GpsUsersResponse,
  GpsUserRow,
  MemberStatus,
} from "@/lib/types";

export interface GetMembersOptions {
  client?: AxiosInstance;
  /** Key inside lastLocation.metadata to use as member display name */
  nameKey?: string;
}

function parseMeta(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function resolveStatus(code?: number): {
  status: import("@/lib/types").MemberStatusKind;
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

function resolveName(
  meta: Record<string, string>,
  uid: string,
  nameKey?: string,
): string {
  if (nameKey) return or(meta[nameKey]) ?? uid.slice(0, 5);
  return uid;
}

function rowToMember(row: GpsUserRow, nameKey?: string): MemberStatus {
  const meta = parseMeta(row.lastLocation?.metadata);
  const uid = or(row.userId, row.deviceId, row.vehicleId) ?? row.id;
  return {
    userId: uid,
    name: resolveName(meta, uid, nameKey),
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

export const LiveMapController = {
  async getMembers(options: GetMembersOptions = {}): Promise<MemberStatus[]> {
    const data = await request<GpsUsersResponse>(c(options), {
      method: "GET",
      url: "gps-tracking/users",
      params: { pageSize: 1000 },
    });
    return data.users.map((row) => rowToMember(row, options.nameKey));
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
    const raw = await request<{ success: boolean; data: GpsPoint } | GpsPoint>(
      c(options),
      {
        method: "GET",
        url: `gps-tracking/latest/users/${encodeURIComponent(userId)}`,
      },
    );
    if (raw && typeof raw === "object" && "success" in raw) {
      return (raw as { success: boolean; data: GpsPoint }).data ?? null;
    }
    return (raw as GpsPoint) ?? null;
  },

  async getHistoryRoute(
    userId: string,
    startTime: number,
    endTime: number,
    options: { client?: AxiosInstance } = {},
  ): Promise<GpsPoint[]> {
    const res = await request<{ trackingData: GpsPoint[] } | GpsPoint[]>(
      c(options),
      {
        method: "GET",
        url: "gps-tracking/history",
        params: { UserId: userId, FromTime: startTime, ToTime: endTime },
      },
    );
    if (Array.isArray(res)) return res;
    return res.trackingData ?? [];
  },
};
