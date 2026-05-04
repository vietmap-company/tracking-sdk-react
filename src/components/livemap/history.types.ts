import type { GpsPoint } from '@/lib/types'

export const GPS_LOST_MS = 5 * 60 * 1000

export interface Segment {
  type: 'moving' | 'stopped' | 'lostGps'
  startTs: number
  endTs: number
  durationMs: number
}

export interface MoveGroup {
  type: 'moving'
  idx: number
  pt: GpsPoint
}

export interface StopGroup {
  type: 'stopped'
  startIdx: number
  endIdx: number
  pts: GpsPoint[]
  durationMs: number
}

export interface LostGroup {
  type: 'lostGps'
  startTs: number
  endTs: number
  durationMs: number
}

export type HistoryGroup = MoveGroup | StopGroup | LostGroup
