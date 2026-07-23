import type { MemberStatus } from "@/lib/types";
import type { MapInstance } from "./types";
import { VIETMAP_TEXT_FONT, VIETMAP_TEXT_FONT_BOLD } from "./tiles";

export const MEMBERS_SOURCE = "dc-members";
export const SELECTED_SOURCE = "dc-selected";
export const LAYER_CLUSTERS = "dc-clusters";
export const LAYER_CLUSTER_COUNT = "dc-cluster-count";
export const LAYER_POINTS = "dc-points";
export const LAYER_POINT_BADGE = "dc-point-badge";
export const LAYER_POINT_INITIALS = "dc-point-initials";
export const LAYER_POINT_LABEL = "dc-point-label";
export const LAYER_SELECTED_HALO = "dc-selected-halo";
export const LAYER_SELECTED_RING = "dc-selected-ring";
export const LAYER_SELECTED_POINT = "dc-selected-point";

/** Màu marker theo trạng thái — dùng chung cho marker thường + selected. */
const STATUS_COLOR_EXPR = [
  "match",
  ["get", "status"],
  "moving",
  "#10b981",
  "stopped",
  "#f59e0b",
  "#94a3b8",
];
export const LAYER_SELECTED_INITIALS = "dc-selected-initials";
export const LAYER_SELECTED_LABEL = "dc-selected-label";

/** 2 chữ cái đầu của tên (fallback userId) — hiển thị trong marker
 *  như avatar initials. */
function initialsOf(m: MemberStatus): string {
  return (m.name ?? m.userId).trim().slice(0, 2).toUpperCase();
}

/** Tên hiển thị dưới marker — cắt ngắn để label không tràn map. */
function labelOf(m: MemberStatus): string {
  const name = (m.name ?? m.userId).trim();
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

/** Pill trắng bo góc làm nền cho label tên. GL không vẽ được
 *  background cho text nên dùng stretchable image (9-slice) + icon-text-fit
 *  để pill tự giãn theo độ dài tên. Vẽ ở pixelRatio 2 cho sắc nét. */
export const LABEL_PILL_IMAGE = "dc-label-pill";

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ensureLabelPillImage(map: MapInstance) {
  if (!map.addImage || map.hasImage?.(LABEL_PILL_IMAGE)) return;
  // 64×36 @2x → hiển thị 32×18, bo góc 7px. Vùng giữa co giãn theo text.
  const w = 64;
  const h = 36;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  roundedRectPath(ctx, 1, 1, w - 2, h - 2, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
  map.addImage(LABEL_PILL_IMAGE, ctx.getImageData(0, 0, w, h), {
    pixelRatio: 2,
    // Vùng kéo giãn (px ảnh gốc) — tránh 4 góc bo.
    stretchX: [[20, 44]],
    stretchY: [[14, 22]],
    // Hộp chứa text — inset mỏng (2-3px hiển thị) cho pill ôm sát chữ.
    content: [6, 4, 58, 32],
  });
}

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
        initials: initialsOf(repr),
        label: stackCount > 1 ? `${labelOf(repr)} +${stackCount - 1}` : labelOf(repr),
        // Thứ tự vẽ ổn định: circle-sort-key (z cao vẽ trên) + symbol-sort-key
        // (đảo dấu — chữ của marker trên cùng được đặt trước, chữ của marker
        // bị đè thua collision → tự ẩn thay vì nổi lên trên marker đè nó).
        z: features.length,
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
        properties: {
          userId: m.userId,
          status: m.status,
          initials: initialsOf(m),
          label: labelOf(m),
        },
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
  // Đăng ký lại mỗi lần add layers — setStyle() xoá sạch images đã đăng ký,
  // và addClusterLayers được gọi lại qua "styledata" nên pill luôn có sẵn.
  ensureLabelPillImage(map);

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
      "text-font": VIETMAP_TEXT_FONT_BOLD,
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
    layout: {
      // z cao vẽ trên — khớp với symbol-sort-key của initials/label bên dưới.
      "circle-sort-key": ["get", "z"],
    },
    paint: {
      "circle-color": STATUS_COLOR_EXPR,
      // Rộng để chứa 2 chữ cái initials bên trong (kiểu avatar).
      // Stacks (count > 1) render slightly larger so they look "fatter" than singletons.
      "circle-radius": ["case", [">", ["get", "stackCount"], 1], 15, 14],
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
      "text-font": VIETMAP_TEXT_FONT_BOLD,
      "text-size": 12,
      // Tham gia collision (padding ≈ bán kính circle) — marker bị đè thì
      // badge tự ẩn. Sort-key đảo dấu: marker trên cùng giữ chữ.
      "symbol-sort-key": ["*", ["get", "z"], -1],
      "text-padding": 6,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "#0f172a",
      "text-halo-width": 1.2,
    },
  } as Record<string, unknown>);

  // Initials (2 chữ cái đầu) bên trong marker đơn — stack đã có badge "+N".
  map.addLayer({
    id: LAYER_POINT_INITIALS,
    type: "symbol",
    source: MEMBERS_SOURCE,
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "stackCount"], 1],
    ],
    layout: {
      "text-field": ["get", "initials"],
      "text-font": VIETMAP_TEXT_FONT_BOLD,
      "text-size": 11,
      // Tham gia collision (padding ≈ bán kính circle) — marker bị đè thì
      // initials tự ẩn thay vì nổi lên trên marker đang đè nó.
      "symbol-sort-key": ["*", ["get", "z"], -1],
      "text-padding": 6,
    },
    paint: { "text-color": "#ffffff" },
  } as Record<string, unknown>);

  // Label tên dưới marker (pill trắng — GL không vẽ được nền
  // nên dùng halo trắng dày). Không allow-overlap → tự ẩn khi chen chúc.
  map.addLayer({
    id: LAYER_POINT_LABEL,
    type: "symbol",
    source: MEMBERS_SOURCE,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": ["get", "label"],
      "text-font": VIETMAP_TEXT_FONT,
      "text-size": 10.5,
      "text-anchor": "top",
      // ~20px dưới tâm marker (r=14) → hở ~4px giữa mép marker và pill.
      "text-offset": [0, 1.9],
      // Cùng độ ưu tiên với initials — label của marker trên cùng thắng.
      "symbol-sort-key": ["*", ["get", "z"], -1],
      // Pill trắng làm nền — tự giãn ôm theo text. Khi chen chúc, cả
      // pill lẫn text cùng ẩn (collision mặc định).
      "icon-image": LABEL_PILL_IMAGE,
      "icon-text-fit": "both",
      "icon-text-fit-padding": [1, 4, 1, 4],
    },
    paint: { "text-color": "#0f172a" },
  } as Record<string, unknown>);

  // ── Selected member — never clustered, always rendered on top ────────────
  // A separate non-clustering source ensures the active member is always
  // visible with its blue ring regardless of zoom level or nearby density.
  map.addSource(SELECTED_SOURCE, {
    type: "geojson",
    data: selectedData,
  } as Record<string, unknown>);

  // Glow mềm cùng màu status phía sau — thay cho halo xanh bẹt cũ.
  map.addLayer({
    id: LAYER_SELECTED_HALO,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-color": STATUS_COLOR_EXPR,
      "circle-radius": 24,
      "circle-opacity": 0.18,
      "circle-stroke-width": 0,
    },
  } as Record<string, unknown>);

  // Vòng ring mảnh màu status, hở một khe với chấm chính — kiểu "focus ring",
  // thay cho viền xanh dày cũ.
  map.addLayer({
    id: LAYER_SELECTED_RING,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-color": "#000000",
      "circle-opacity": 0,
      "circle-radius": 19,
      "circle-stroke-width": 2,
      "circle-stroke-color": STATUS_COLOR_EXPR,
      "circle-stroke-opacity": 0.9,
    },
  } as Record<string, unknown>);

  // Chấm chính — cùng ngôn ngữ với marker thường (viền trắng), chỉ to hơn.
  map.addLayer({
    id: LAYER_SELECTED_POINT,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-color": STATUS_COLOR_EXPR,
      "circle-radius": 15,
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 1,
    },
  } as Record<string, unknown>);

  // Initials trong marker được chọn.
  map.addLayer({
    id: LAYER_SELECTED_INITIALS,
    type: "symbol",
    source: SELECTED_SOURCE,
    layout: {
      "text-field": ["get", "initials"],
      "text-font": VIETMAP_TEXT_FONT_BOLD,
      "text-size": 11.5,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff" },
  } as Record<string, unknown>);

  // Label tên dưới marker được chọn — luôn hiện (marker đang active).
  map.addLayer({
    id: LAYER_SELECTED_LABEL,
    type: "symbol",
    source: SELECTED_SOURCE,
    layout: {
      "text-field": ["get", "label"],
      "text-font": VIETMAP_TEXT_FONT,
      "text-size": 11,
      "text-anchor": "top",
      // Marker selected to hơn (r=15 + stroke 4) nên đẩy label xa hơn chút.
      "text-offset": [0, 2.3],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
      "icon-image": LABEL_PILL_IMAGE,
      "icon-text-fit": "both",
      "icon-text-fit-padding": [1, 4, 1, 4],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: { "text-color": "#0f172a" },
  } as Record<string, unknown>);
}
