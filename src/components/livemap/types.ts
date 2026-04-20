import type { ReactNode, CSSProperties } from 'react'
import type { MemberStatus, Position, TileType } from '@/lib/types'

/** Minimal map instance surface — opaque to consumers. */
export type MapInstance = {
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void
  fitBounds: (
    bounds: [[number, number], [number, number]],
    opts?: { padding?: number; duration?: number }
  ) => void
  getZoom: () => number
  remove: () => void
  on: (evt: string, handler: (e: unknown) => void) => void
  off: (evt: string, handler: (e: unknown) => void) => void
  setStyle: (style: unknown) => void
}

export interface LiveMapSlotProps {
  list?: {
    position?: 'left' | 'right'
    className?: string
    style?: CSSProperties
  }
  legend?: { position?: Position; className?: string; style?: CSSProperties }
  tileSwitcher?: {
    position?: Position
    className?: string
    style?: CSSProperties
  }
  markers?: { className?: string; style?: CSSProperties }
}

export interface LiveMapProps {
  height?: string
  center?: [number, number]
  zoom?: number
  defaultTile?: TileType
  pollInterval?: number

  showList?: boolean
  showLegend?: boolean
  legendPosition?: Position
  showTileSwitcher?: boolean
  tileSwitcherPosition?: Position

  className?: string
  style?: CSSProperties

  onMemberClick?: (member: MemberStatus) => void | boolean
  onMarkerClick?: (member: MemberStatus) => void | boolean
  onMapClick?: (lngLat: [number, number]) => void
  onMapReady?: (map: MapInstance) => void

  renderMemberItem?: (
    member: MemberStatus,
    defaultRender: ReactNode
  ) => ReactNode
  renderMarkerPopup?: (member: MemberStatus) => ReactNode

  slotProps?: LiveMapSlotProps
}

export interface LiveMapRef {
  flyTo: (center: [number, number], zoom?: number) => void
  fitBounds: (bounds: [[number, number], [number, number]]) => void
  focusMember: (userId: string) => void
  getMembers: () => MemberStatus[]
  getMap: () => MapInstance | null
}

export const POSITION_CLASSES: Record<Position, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}
