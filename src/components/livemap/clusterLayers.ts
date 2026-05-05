import type { MemberStatus } from "@/lib/types";
import type { MapInstance } from "./types";

export const MEMBERS_SOURCE = "dc-members";
export const SELECTED_SOURCE = "dc-selected";
export const LAYER_CLUSTERS = "dc-clusters";
export const LAYER_CLUSTER_COUNT = "dc-cluster-count";
export const LAYER_POINTS = "dc-points";
export const LAYER_POINT_BADGE = "dc-point-badge";
export const LAYER_SELECTED_HALO = "dc-selected-halo";
export const LAYER_SELECTED_POINT = "dc-selected-point";

/**
 * Group members (excluding the active/selected user) at the same lat/lng
 * (rounded to ~1m) into a single "stack" feature. The active member is
 * intentionally omitted so it is never swallowed by a cluster and always
 * renders via its own dedicated source (see `toSelectedGeoJSON`).
 *
 * Each stack ships:
 *   - `userId`: primary member (first in group) — used as the key for
 *     opening a popup or matching click handlers.
 *   - `stackCount`: total members at this coord. Drives the "+N" badge
 *     and is summed up by the cluster aggregation so cluster counts
 *     reflect actual member totals, not stack counts.
 *   - `userIds`: pipe-separated list of all userIds in this stack
 *     (Mapbox feature properties don't support arrays, so we encode
 *     it as a string and split on the consumer side).
 */
export function toGeoJSON(
  members: MemberStatus[],
  activeUserId?: string | null,
): unknown {
  const groups = new Map<string, MemberStatus[]>();
  for (const m of members) {
    if (!m.lat || !m.lng) continue;
    // Active member is rendered by the selected layer — exclude it here
    // so it is never absorbed into a cluster or a stack dot.
    if (activeUserId != null && m.userId === activeUserId) continue;
    const key = `${m.lng.toFixed(5)},${m.lat.toFixed(5)}`;
    let g = groups.get(key);
    if (!g) {
      g = [];
      groups.set(key, g);
    }
    g.push(m);
  }

  const features: unknown[] = [];
  groups.forEach((gs) => {
    const repr = gs[0];
    const stackCount = gs.length;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [repr.lng, repr.lat] },
      properties: {
        userId: repr.userId,
        userIds: gs.map((m) => m.userId).join("|"),
        stackCount,
        status: repr.status,
      },
    });
  });

  return { type: "FeatureCollection", features };
}

/** Returns a single-feature GeoJSON for the currently selected member.
 *  Used by the dedicated `SELECTED_SOURCE` (no clustering) so the member
 *  is always visible with its highlight ring regardless of zoom level. */
export function toSelectedGeoJSON(
  members: MemberStatus[],
  activeUserId?: string | null,
): unknown {
  const empty = { type: "FeatureCollection", features: [] };
  if (!activeUserId) return empty;
  const m = members.find((x) => x.userId === activeUserId);
  if (!m || !m.lat || !m.lng) return empty;
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: { userId: m.userId, status: m.status },
      },
    ],
  };
}

export function addClusterLayers(
  map: MapInstance,
  data: unknown,
  selectedData: unknown,
  clusterRadius: number,
  clusterMaxZoom: number,
) {
  map.addSource(MEMBERS_SOURCE, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius,
    clusterMaxZoom,
    // Sum each stack's member count so cluster totals reflect real
    // members, not stack-feature counts.
    clusterProperties: {
      member_count: ["+", ["get", "stackCount"]],
    },
  } as Record<string, unknown>);

  // Cluster bubbles — color/radius keyed off the aggregated member_count.
  map.addLayer({
    id: LAYER_CLUSTERS,
    type: "circle",
    source: MEMBERS_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "member_count"],
        "#3b82f6",
        100,
        "#f59e0b",
        500,
        "#ef4444",
      ],
      "circle-radius": ["step", ["get", "member_count"], 16, 100, 24, 500, 32],
      "circle-opacity": 0.85,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  } as Record<string, unknown>);

  map.addLayer({
    id: LAYER_CLUSTER_COUNT,
    type: "symbol",
    source: MEMBERS_SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["to-string", ["get", "member_count"]],
      "text-size": 13,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff" },
  } as Record<string, unknown>);

  // Unclustered points (a single stack = a single dot, regardless of how
  // many members are on top of each other).
  map.addLayer({
    id: LAYER_POINTS,
    type: "circle",
    source: MEMBERS_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "match",
        ["get", "status"],
        "moving",
        "#10b981",
        "stopped",
        "#f59e0b",
        "#94a3b8",
      ],
      // Stacks (count > 1) render slightly larger so they look "fatter" than singletons.
      "circle-radius": ["case", [">", ["get", "stackCount"], 1], 11, 8],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.95,
    },
  } as Record<string, unknown>);

  // "+N" badge over unclustered stacks. Same family as cluster count text
  // so the visual language is consistent.
  map.addLayer({
    id: LAYER_POINT_BADGE,
    type: "symbol",
    source: MEMBERS_SOURCE,
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      [">", ["get", "stackCount"], 1],
    ],
    layout: {
      "text-field": ["to-string", ["get", "stackCount"]],
      "text-size": 11,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "#0f172a",
      "text-halo-width": 1.2,
    },
  } as Record<string, unknown>);

  // ── Selected member — never clustered, always rendered on top ────────────
  // A separate non-clustering source ensures the active member is always
  // visible with its blue ring regardless of zoom level or nearby density.
  map.addSource(SELECTED_SOURCE, {
    type: "geojson",
    data: selectedData,
  } as Record<string, unknown>);

  // Soft halo glow behind the selected dot.
  map.addLayer({
    id: LAYER_SELECTED_HALO,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-color": "#3b82f6",
      "circle-radius": 20,
      "circle-opacity": 0.25,
      "circle-stroke-width": 0,
    },
  } as Record<string, unknown>);

  // The selected dot itself — same colour logic as regular points but with
  // a stronger blue stroke so it stands out from any overlapping members.
  map.addLayer({
    id: LAYER_SELECTED_POINT,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-color": [
        "match",
        ["get", "status"],
        "moving",
        "#10b981",
        "stopped",
        "#f59e0b",
        "#94a3b8",
      ],
      "circle-radius": 12,
      "circle-stroke-width": 4,
      "circle-stroke-color": "#3b82f6",
      "circle-opacity": 0.95,
    },
  } as Record<string, unknown>);
}
