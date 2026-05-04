import type { CSSProperties, ReactNode } from 'react'
import type { MemberStatus, TileType } from '@/lib/types'

export type MapInstance = {
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void
  jumpTo: (opts: { center: [number, number]; zoom?: number }) => void
  fitBounds: (bounds: [[number, number], [number, number]], opts?: { padding?: number; duration?: number; maxZoom?: number }) => void
  getZoom: () => number
  remove: () => void
  on: (evt: string, handler: (e: unknown) => void) => void
  off: (evt: string, handler: (e: unknown) => void) => void
  setStyle: (style: unknown) => void
  addSource: (id: string, source: Record<string, unknown>) => void
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined
  removeSource: (id: string) => void
  addLayer: (layer: Record<string, unknown>) => void
  getLayer: (id: string) => unknown | undefined
  removeLayer: (id: string) => void
  easeTo: (opts: { center: [number, number]; zoom?: number; duration?: number }) => void
  queryRenderedFeatures?: (
    geometry: [number, number] | [[number, number], [number, number]],
    options?: { layers?: string[] }
  ) => Array<{ layer: { id: string }; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> }>
  project?: (lngLat: [number, number]) => { x: number; y: number }
  getCanvas?: () => HTMLCanvasElement
  getBounds: () => { contains: (lngLat: [number, number]) => boolean }
}

export interface LiveMapProps {
  height?: string
  center?: [number, number]
  zoom?: number
  defaultTile?: TileType
  /** VietMap API key for tile styles */
  apiKeyTilemap: string
  pollInterval?: number
  maxUsers?: number
  clusterRadius?: number
  clusterMaxZoom?: number
  members?: MemberStatus[]
  memberNameKey?: string
  showList?: boolean
  className?: string
  style?: CSSProperties
  onMemberClick?: (member: MemberStatus) => void | boolean
  onMarkerClick?: (member: MemberStatus) => void | boolean
  onMapClick?: (lngLat: [number, number]) => void
  onMapReady?: (map: MapInstance) => void
  renderMemberItem?: (member: MemberStatus, defaultRender: ReactNode) => ReactNode
  renderMarkerPopup?: (member: MemberStatus) => ReactNode
}

export interface LiveMapRef {
  flyTo: (center: [number, number], zoom?: number) => void
  fitBounds: (bounds: [[number, number], [number, number]]) => void
  focusMember: (userId: string) => void
  getMembers: () => MemberStatus[]
  getMap: () => MapInstance | null
}
