import type { ReactNode, CSSProperties } from "react";
import type { MemberStatus, Position, TileType } from "@/lib/types";

/** Minimal map instance surface — opaque to consumers. */
export type MapInstance = {
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void;
  jumpTo: (opts: { center: [number, number]; zoom?: number }) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    opts?: { padding?: number; duration?: number; maxZoom?: number },
  ) => void;
  getZoom: () => number;
  remove: () => void;
  on: (evt: string, handler: (e: unknown) => void) => void;
  off: (evt: string, handler: (e: unknown) => void) => void;
  setStyle: (style: unknown) => void;
  // Route drawing
  addSource: (id: string, source: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  removeSource: (id: string) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  getLayer: (id: string) => unknown | undefined;
  removeLayer: (id: string) => void;
  getBounds: () => { contains: (lngLat: [number, number]) => boolean };
  easeTo: (opts: { center: [number, number]; zoom?: number; duration?: number }) => void;
  queryRenderedFeatures?: (
    geometry: [number, number] | [[number, number], [number, number]],
    options?: { layers?: string[] },
  ) => Array<{
    layer: { id: string };
    geometry: { type: string; coordinates: unknown };
    properties: Record<string, unknown>;
  }>;
  project?: (lngLat: [number, number]) => { x: number; y: number };
  getCanvas?: () => HTMLCanvasElement;
};

export interface LiveMapSlotProps {
  list?: {
    position?: "left" | "right";
    className?: string;
    style?: CSSProperties;
  };
  legend?: { position?: Position; className?: string; style?: CSSProperties };
  tileSwitcher?: {
    position?: Position;
    className?: string;
    style?: CSSProperties;
  };
  markers?: { className?: string; style?: CSSProperties };
}

export interface LiveMapProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  defaultTile?: TileType;
  pollInterval?: number;
  /** Maximum number of users to fetch from the API. Default: 3000 */
  maxUsers?: number;
  /** Cluster radius in pixels. Default: 50 */
  clusterRadius?: number;
  /** Maximum zoom level at which clustering is applied. Default: 14 */
  clusterMaxZoom?: number;

  /** Override members with local/mock data — skips API polling */
  members?: MemberStatus[];

  /** Key inside lastLocation.metadata to use as member display name. Fallback: first 5 chars of userId. */
  memberNameKey?: string;

  showList?: boolean;
  showLegend?: boolean;
  legendPosition?: Position;
  showTileSwitcher?: boolean;
  tileSwitcherPosition?: Position;

  className?: string;
  style?: CSSProperties;

  onMemberClick?: (member: MemberStatus) => void | boolean;
  onMarkerClick?: (member: MemberStatus) => void | boolean;
  onMapClick?: (lngLat: [number, number]) => void;
  onMapReady?: (map: MapInstance) => void;

  renderMemberItem?: (
    member: MemberStatus,
    defaultRender: ReactNode,
  ) => ReactNode;
  renderMarkerPopup?: (member: MemberStatus) => ReactNode;

  slotProps?: LiveMapSlotProps;
}

export interface LiveMapRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  focusMember: (userId: string) => void;
  getMembers: () => MemberStatus[];
  getMap: () => MapInstance | null;
}

export const POSITION_CLASSES: Record<Position, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};
