import type { AxiosInstance } from "axios";
import { getGlobalClient, request } from "@/lib/http";
import type {
  EnrichedSegment,
  GpsPoint,
  GpsUsersResponse,
  GpsUserRow,
  HistoryDataSource,
  HistoryRoute,
  HistoryRouteResponse,
  MemberStatus,
  RouteSummary,
} from "@/lib/types";

const sortByTime = (arr: GpsPoint[] | null | undefined): GpsPoint[] =>
  (arr ?? []).slice().sort((a, b) => a.time - b.time);

/**
 * Merge enriched segments that share the same `segmentIndex` into a single
 * segment, concatenating their points in the order they appear. The backend can
 * split one logical segment across several entries carrying the same index;
 * grouping them yields one continuous polyline per index.
 *
 * Point order is preserved, never sorted by time — map-matched sequences can
 * carry several points at the same timestamp (raw + snapped), and sorting would
 * reshuffle them into a zigzag. The array order is the spatial order.
 *
 * Groups keep first-appearance order; the color a segment gets downstream is
 * keyed on this array position, not on `segmentIndex` (which may skip values
 * when some segments fail to match).
 */
export function mergeSegmentsByIndex(
  segments: EnrichedSegment[],
): EnrichedSegment[] {
  const groups = new Map<number, GpsPoint[]>();
  const order: number[] = [];
  for (const seg of segments) {
    let bucket = groups.get(seg.segmentIndex);
    if (!bucket) {
      bucket = [];
      groups.set(seg.segmentIndex, bucket);
      order.push(seg.segmentIndex);
    }
    bucket.push(...seg.points);
  }
  return order.map((segmentIndex) => ({
    segmentIndex,
    points: groups.get(segmentIndex)!,
  }));
}

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

export interface GetHistoryOptions {
  client?: AxiosInstance;
  /**
   * Which track the backend should build. Omit it (or pass `null`) to send no
   * `DataSource` and let the backend prefer enriched, falling back to raw.
   * See {@link HistoryDataSource}.
   */
  dataSource?: HistoryDataSource | null;
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
  const name = nameKey ? (or(meta[nameKey]) ?? uid.slice(0, 30)) : uid;
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

  /**
   * Fetch the history route for a user. `dataSource` selects which track the
   * backend builds:
   *
   * - omitted / `null` — no `DataSource` is sent; the backend prefers the
   *   enriched route and falls back to raw for windows it has not matched yet.
   * - `raw` — no map-matching is run; `trackingData` is the untouched GPS trace.
   * - `both` — enriched route in `trackingData` + `enrichedSegments` (for correct
   *   multi-polyline rendering), plus `rawData` / `enrichedData` for a
   *   side-by-side comparison overlay.
   * - `merged` — enriched backbone with raw points spliced into the segments the
   *   matcher could not match, yielding one unbroken track in `trackingData`.
   */
  async getHistoryComparison(
    userId: string,
    startTime: number,
    endTime: number,
    options: GetHistoryOptions = {},
  ): Promise<HistoryRoute> {
    const dataSource = options.dataSource ?? null;

    const res = await request<HistoryRouteResponse>(c(options), {
      method: "GET",
      url: "gps-tracking/history",
      params: {
        UserId: userId,
        FromTime: startTime,
        ToTime: endTime,
        // Omitted entirely when null — sending `DataSource=` would not mean
        // "let the backend decide".
        ...(dataSource ? { DataSource: dataSource } : {}),
      },
    });

    const trackingPoints = sortByTime(res?.trackingData);
    const enrichedPoints = res?.enrichedData != null ? sortByTime(res.enrichedData) : null;

    // Under `raw` the backend sends the GPS trace as `trackingData` and omits
    // `rawData`; surface it as `rawPoints` too so callers see the raw track in
    // the same field regardless of mode.
    let rawPoints: GpsPoint[] | null = null;
    if (res?.rawData != null) rawPoints = sortByTime(res.rawData);
    else if (dataSource === "raw") rawPoints = trackingPoints;

    // Each segment is one continuous map-matched polyline — draw separately to
    // avoid bird-flight lines at matcher-cut gaps. Entries sharing a
    // `segmentIndex` are merged first so each index becomes one polyline; point
    // order is preserved (see `mergeSegmentsByIndex`), not sorted by time.
    const enrichedSegments: GpsPoint[][] | null =
      res?.enrichedSegments?.length
        ? mergeSegmentsByIndex(res.enrichedSegments).map((s) => s.points)
        : null;

    // Flat list for playback/timeline/marker. `both` and the backend default
    // prefer the segments — they are the canonical enriched route. `merged`
    // must not: its gap-filled `trackingData` is the canonical track, and
    // flattening the enriched segments instead would drop the spliced-in raw
    // points and reopen the gaps. Under `raw` there are no segments at all.
    const flatSegments = enrichedSegments?.flat() ?? [];
    const preferSegments = dataSource === "both" || dataSource === null;
    const candidates = preferSegments
      ? [flatSegments, trackingPoints, rawPoints]
      : [trackingPoints, flatSegments, rawPoints];
    const points = candidates.find((p) => p?.length) ?? [];

    const routeSummary: RouteSummary | null = res?.routeSummary ?? null;

    return {
      points,
      rawPoints,
      enrichedPoints,
      enrichedSegments,
      enriched: !!res?.enriched,
      routeSummary,
      dataSource,
    };
  },

  async getHistoryRoute(
    userId: string,
    startTime: number,
    endTime: number,
    options: GetHistoryOptions = {},
  ): Promise<GpsPoint[]> {
    const route = await this.getHistoryComparison(
      userId,
      startTime,
      endTime,
      options,
    );
    return route.points;
  },
};
