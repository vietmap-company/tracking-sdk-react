import { HttpService } from '@/lib/http'
import { resolveClient, type WithClient } from '@/controllers/shared'
import type {
  EnrichedSegment,
  GpsPoint,
  HistoryDataSource,
  HistoryRoute,
  HistoryRouteResponse,
  RouteSummary,
} from '@/lib/types'

export interface GetHistoryOptions extends WithClient {
  /**
   * Which track the backend should build. Omit it (or pass `null`) to send no
   * `DataSource` and let the backend prefer enriched, falling back to raw.
   * See {@link HistoryDataSource}.
   */
  dataSource?: HistoryDataSource | null
}

const sortByTime = (arr: GpsPoint[] | null | undefined): GpsPoint[] =>
  (arr ?? []).slice().sort((a, b) => a.time - b.time)

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
  const groups = new Map<number, GpsPoint[]>()
  const order: number[] = []
  for (const seg of segments) {
    let bucket = groups.get(seg.segmentIndex)
    if (!bucket) {
      bucket = []
      groups.set(seg.segmentIndex, bucket)
      order.push(seg.segmentIndex)
    }
    bucket.push(...seg.points)
  }
  return order.map((segmentIndex) => ({
    segmentIndex,
    points: groups.get(segmentIndex)!,
  }))
}

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
export async function getHistoryComparison(
  userId: string,
  startTime: number,
  endTime: number,
  options: GetHistoryOptions = {},
): Promise<HistoryRoute> {
  const dataSource = options.dataSource ?? null

  const res = await HttpService.get<HistoryRouteResponse>(
    'gps-tracking/history',
    {
      UserId: userId,
      FromTime: startTime,
      ToTime: endTime,
      // Omitted entirely when null — sending `DataSource=` would not mean
      // "let the backend decide".
      ...(dataSource ? { DataSource: dataSource } : {}),
    },
    resolveClient(options),
  )

  const trackingPoints = sortByTime(res?.trackingData)
  const enrichedPoints =
    res?.enrichedData != null ? sortByTime(res.enrichedData) : null

  // Under `raw` the backend sends the GPS trace as `trackingData` and omits
  // `rawData`; surface it as `rawPoints` too so callers see the raw track in
  // the same field regardless of mode.
  let rawPoints: GpsPoint[] | null = null
  if (res?.rawData != null) rawPoints = sortByTime(res.rawData)
  else if (dataSource === 'raw') rawPoints = trackingPoints

  // Each segment is one continuous map-matched polyline — draw separately to
  // avoid bird-flight lines at matcher-cut gaps. Entries sharing a
  // `segmentIndex` are merged first so each index becomes one polyline; point
  // order is preserved (see `mergeSegmentsByIndex`), not sorted by time.
  const enrichedSegments: GpsPoint[][] | null = res?.enrichedSegments?.length
    ? mergeSegmentsByIndex(res.enrichedSegments).map((s) => s.points)
    : null

  // Flat list for playback/timeline/marker. `both` and the backend default
  // prefer the segments — they are the canonical enriched route. `merged`
  // must not: its gap-filled `trackingData` is the canonical track, and
  // flattening the enriched segments instead would drop the spliced-in raw
  // points and reopen the gaps. Under `raw` there are no segments at all.
  const flatSegments = enrichedSegments?.flat() ?? []
  const preferSegments = dataSource === 'both' || dataSource === null
  const candidates = preferSegments
    ? [flatSegments, trackingPoints, rawPoints]
    : [trackingPoints, flatSegments, rawPoints]
  const points = candidates.find((p) => p?.length) ?? []

  const routeSummary: RouteSummary | null = res?.routeSummary ?? null

  return {
    points,
    rawPoints,
    enrichedPoints,
    enrichedSegments,
    enriched: !!res?.enriched,
    routeSummary,
    dataSource,
  }
}

export async function getHistoryRoute(
  userId: string,
  startTime: number,
  endTime: number,
  options: GetHistoryOptions = {},
): Promise<GpsPoint[]> {
  const route = await getHistoryComparison(userId, startTime, endTime, options)
  return route.points
}
