import * as React from 'react'
import type { GpsPoint, MemberStatus } from '@/lib/types'
import type { MapInstance } from './types'
import type { VGL } from './vgl-loader'

const ROUTE_REM_SRC = 'dc-route-remaining'
const ROUTE_REM_BG = 'dc-route-remaining-bg'
const ROUTE_REM_LINE = 'dc-route-remaining-line'
const ROUTE_TRAV_SRC = 'dc-route-traveled'
const ROUTE_TRAV_LINE = 'dc-route-traveled-line'
const ROUTE_RAW_SRC = 'dc-route-raw'
const ROUTE_RAW_LINE = 'dc-route-raw-line'

interface UsePlaybackParams {
  mapRef: React.MutableRefObject<unknown>
  vglRef: React.MutableRefObject<VGL | null>
  selectedMemberRef: React.MutableRefObject<MemberStatus | null>
  ready: boolean
}

export interface UsePlaybackReturn {
  historyPoints: GpsPoint[]
  setHistoryPoints: React.Dispatch<React.SetStateAction<GpsPoint[]>>
  historyPointsRef: React.MutableRefObject<GpsPoint[]>
  enrichedSegments: GpsPoint[][] | null
  setEnrichedSegments: React.Dispatch<React.SetStateAction<GpsPoint[][] | null>>
  rawPoints: GpsPoint[]
  setRawPoints: React.Dispatch<React.SetStateAction<GpsPoint[]>>
  playIndex: number
  setPlayIndex: React.Dispatch<React.SetStateAction<number>>
  isPlaying: boolean
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
  playSpeed: 1 | 2 | 4
  setPlaySpeed: React.Dispatch<React.SetStateAction<1 | 2 | 4>>
  autoFollow: boolean
  setAutoFollow: React.Dispatch<React.SetStateAction<boolean>>
  historyMarkerRef: React.MutableRefObject<unknown>
  seekHistory: (idx: number) => void
  drawHistoryRoute: (pts: GpsPoint[], playIdx: number) => void
  drawRawRoute: (pts: GpsPoint[]) => void
  clearHistoryRoute: () => void
}

export function usePlayback({ mapRef, vglRef, selectedMemberRef, ready }: UsePlaybackParams): UsePlaybackReturn {
  const [historyPoints, setHistoryPoints] = React.useState<GpsPoint[]>([])
  const [enrichedSegments, setEnrichedSegments] = React.useState<GpsPoint[][] | null>(null)
  const [rawPoints, setRawPoints] = React.useState<GpsPoint[]>([])
  const enrichedSegmentsRef = React.useRef<GpsPoint[][] | null>(null)
  const [playIndex, setPlayIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playSpeed, setPlaySpeed] = React.useState<1 | 2 | 4>(1)
  const [autoFollow, setAutoFollow] = React.useState(true)

  const historyPointsRef = React.useRef<GpsPoint[]>([])
  const historyMarkerRef = React.useRef<unknown>(null)
  const playTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const autoFollowRef = React.useRef(autoFollow)

  React.useEffect(() => { historyPointsRef.current = historyPoints }, [historyPoints])
  React.useEffect(() => { enrichedSegmentsRef.current = enrichedSegments }, [enrichedSegments])
  React.useEffect(() => { autoFollowRef.current = autoFollow }, [autoFollow])

  const drawHistoryRoute = React.useCallback((pts: GpsPoint[], playIdx: number) => {
    const map = mapRef.current as MapInstance | null
    if (!map || pts.length < 2) return
    const ci = Math.max(0, Math.min(playIdx, pts.length - 1))
    const segs = enrichedSegmentsRef.current

    // Traveled: flat 0..ci as a single LineString (blue playback overlay).
    const travGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.slice(0, ci + 1).map((p) => [p.lng, p.lat]) } }

    // Remaining: MultiLineString per segment to avoid bird-flight across gaps.
    // Falls back to a single LineString when no segment data is available.
    let remGeo: object
    if (segs && segs.length > 0) {
      const coords: [number, number][][] = []
      let offset = 0
      for (const seg of segs) {
        const segEnd = offset + seg.length - 1
        if (segEnd >= ci) {
          const from = Math.max(0, ci - offset)
          const segCoords = seg.slice(from).map((p): [number, number] => [p.lng, p.lat])
          if (segCoords.length >= 1) coords.push(segCoords)
        }
        offset += seg.length
      }
      remGeo = { type: 'Feature', geometry: { type: 'MultiLineString', coordinates: coords } }
    } else {
      remGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.slice(ci).map((p) => [p.lng, p.lat]) } }
    }

    try {
      const remSrc = map.getSource(ROUTE_REM_SRC)
      if (remSrc) { remSrc.setData(remGeo) }
      else {
        map.addSource(ROUTE_REM_SRC, { type: 'geojson', data: remGeo } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_REM_BG, type: 'line', source: ROUTE_REM_SRC, paint: { 'line-color': '#888888', 'line-width': 6, 'line-opacity': 0.1 } } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_REM_LINE, type: 'line', source: ROUTE_REM_SRC, paint: { 'line-color': '#888888', 'line-width': 3, 'line-opacity': 0.6 } } as Record<string, unknown>)
      }
      const travSrc = map.getSource(ROUTE_TRAV_SRC)
      if (travSrc) { travSrc.setData(travGeo) }
      else {
        map.addSource(ROUTE_TRAV_SRC, { type: 'geojson', data: travGeo } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_TRAV_LINE, type: 'line', source: ROUTE_TRAV_SRC, paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.9 } } as Record<string, unknown>)
      }
    } catch (e) { console.warn('[LiveMap] drawHistoryRoute', e) }
  }, [mapRef])

  // Raw GPS track drawn as a dashed comparison line on top of the (enriched)
  // main route. Pass an empty/short array to remove it.
  const drawRawRoute = React.useCallback((pts: GpsPoint[]) => {
    const map = mapRef.current as MapInstance | null
    if (!map) return
    const removeRaw = () => {
      try {
        if (map.getLayer(ROUTE_RAW_LINE)) map.removeLayer(ROUTE_RAW_LINE)
        if (map.getSource(ROUTE_RAW_SRC)) map.removeSource(ROUTE_RAW_SRC)
      } catch { /* ignore */ }
    }
    if (!pts || pts.length < 2) { removeRaw(); return }
    const rawGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.map((p) => [p.lng, p.lat]) } }
    try {
      const rawSrc = map.getSource(ROUTE_RAW_SRC)
      if (rawSrc) { rawSrc.setData(rawGeo) }
      else {
        map.addSource(ROUTE_RAW_SRC, { type: 'geojson', data: rawGeo } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_RAW_LINE, type: 'line', source: ROUTE_RAW_SRC, paint: { 'line-color': '#ff7f0e', 'line-width': 3, 'line-opacity': 0.85, 'line-dasharray': [2, 2] } } as Record<string, unknown>)
      }
    } catch (e) { console.warn('[LiveMap] drawRawRoute', e) }
  }, [mapRef])

  const clearHistoryRoute = React.useCallback(() => {
    const map = mapRef.current as MapInstance | null
    if (!map) return
    try {
      if (map.getLayer(ROUTE_TRAV_LINE)) map.removeLayer(ROUTE_TRAV_LINE)
      if (map.getLayer(ROUTE_REM_LINE)) map.removeLayer(ROUTE_REM_LINE)
      if (map.getLayer(ROUTE_REM_BG)) map.removeLayer(ROUTE_REM_BG)
      if (map.getLayer(ROUTE_RAW_LINE)) map.removeLayer(ROUTE_RAW_LINE)
      if (map.getSource(ROUTE_TRAV_SRC)) map.removeSource(ROUTE_TRAV_SRC)
      if (map.getSource(ROUTE_REM_SRC)) map.removeSource(ROUTE_REM_SRC)
      if (map.getSource(ROUTE_RAW_SRC)) map.removeSource(ROUTE_RAW_SRC)
    } catch { /* ignore */ }
    ;(historyMarkerRef.current as { remove: () => void } | null)?.remove()
    historyMarkerRef.current = null
  }, [mapRef])

  const seekHistory = React.useCallback((idx: number) => {
    const pts = historyPointsRef.current
    if (!pts.length) return
    const clamped = Math.max(0, Math.min(idx, pts.length - 1))
    setPlayIndex(clamped)
    const p = pts[clamped]
    const VGL = vglRef.current
    const map = mapRef.current as MapInstance | null
    if (!VGL || !map) return
    const isMoving = (p.speed ?? 0) > 0
    const heading = p.heading ?? 0
    const memberName = selectedMemberRef.current?.name ?? selectedMemberRef.current?.userId ?? ''
    const bg = isMoving ? '#16a34a' : '#f97316'
    const icon = isMoving
      ? `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M12 2L6 20l6-4 6 4L12 2z"/></svg>`
      : `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><rect x="6" y="6" width="12" height="12"/></svg>`
    const markerHtml = `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);color:white;background:${bg};transform:rotate(${heading}deg);">${icon}</div><div style="margin-top:4px;background:white;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:500;white-space:nowrap;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.15);">${memberName}</div></div>`
    type MarkerInst = { setLngLat: (ll: [number, number]) => MarkerInst; addTo: (m: unknown) => void; getElement: () => HTMLElement }
    if (!historyMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = markerHtml
      const marker = new (VGL as unknown as { Marker: new (o: Record<string, unknown>) => MarkerInst }).Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat])
      marker.addTo(map)
      historyMarkerRef.current = marker
    } else {
      ;(historyMarkerRef.current as MarkerInst).getElement().innerHTML = markerHtml
      ;(historyMarkerRef.current as MarkerInst).setLngLat([p.lng, p.lat])
    }
    if (pts.length >= 2) drawHistoryRoute(pts, clamped)
    if (autoFollowRef.current) {
      try {
        const bounds = map.getBounds()
        if (!bounds.contains([p.lng, p.lat])) map.jumpTo({ center: [p.lng, p.lat] })
      } catch { /* ignore */ }
    }
  }, [mapRef, vglRef, selectedMemberRef, drawHistoryRoute])

  // Play timer
  React.useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null }
      return
    }
    const intervalMs = Math.round(500 / playSpeed)
    playTimerRef.current = setInterval(() => {
      const pts = historyPointsRef.current
      setPlayIndex((prev) => {
        const next = prev + 1
        if (next >= pts.length) { setIsPlaying(false); return pts.length - 1 }
        seekHistory(next)
        return next
      })
    }, intervalMs)
    return () => { if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null } }
  }, [isPlaying, playSpeed, seekHistory])

  // Draw route when historyPoints changes
  React.useEffect(() => {
    if (!ready) return
    if (historyPoints.length >= 2) drawHistoryRoute(historyPoints, 0)
    else clearHistoryRoute()
  }, [historyPoints, ready, drawHistoryRoute, clearHistoryRoute])

  // Raw route drawing is intentionally NOT triggered here — MapView owns the
  // showRawRoute toggle and calls drawRawRoute(pts | []) directly so the user
  // can show/hide it without re-fetching data.

  // Re-draw when segments arrive (ref syncs async; fire after ref is updated).
  React.useEffect(() => {
    if (!ready || historyPoints.length < 2) return
    drawHistoryRoute(historyPoints, 0)
  }, [enrichedSegments, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    historyPoints, setHistoryPoints, historyPointsRef,
    enrichedSegments, setEnrichedSegments,
    rawPoints, setRawPoints,
    playIndex, setPlayIndex,
    isPlaying, setIsPlaying,
    playSpeed, setPlaySpeed,
    autoFollow, setAutoFollow,
    historyMarkerRef,
    seekHistory, drawHistoryRoute, drawRawRoute, clearHistoryRoute,
  }
}
