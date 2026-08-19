import * as React from 'react'
import type { GpsPoint, MemberStatus } from '@/lib/types'
import type { HistoryRouteColors, MapInstance } from './types'
import type { VGL } from './vgl-loader'

const ROUTE_REM_SRC = 'dc-route-remaining'
const ROUTE_REM_BG = 'dc-route-remaining-bg'
const ROUTE_REM_LINE = 'dc-route-remaining-line'
const ROUTE_TRAV_SRC = 'dc-route-traveled'
const ROUTE_TRAV_LINE = 'dc-route-traveled-line'
const ROUTE_RAW_SRC = 'dc-route-raw'
const ROUTE_RAW_LINE = 'dc-route-raw-line'

const DEFAULT_ROUTE_COLORS: Required<HistoryRouteColors> = {
  traveled: '#3b82f6',
  remaining: '#888888',
  raw: '#ff7f0e',
}

// Distinct colors cycled per segment (already merged by index upstream) so the
// matcher cuts are visible. Keyed on the segment's array position, not the
// server's segmentIndex, which can skip values when some segments fail to match.
const SEGMENT_COLORS = [
  '#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
  '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990',
]
const segColor = (i: number) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]

// Human-readable gap between two segments, e.g. "3m 20s" / "1h 5m".
const fmtGap = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

type LineFeature = {
  type: 'Feature'
  properties: { color: string }
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}
const lineFeature = (coordinates: [number, number][], color: string): LineFeature => ({
  type: 'Feature',
  properties: { color },
  geometry: { type: 'LineString', coordinates },
})

interface UsePlaybackParams {
  mapRef: React.MutableRefObject<unknown>
  vglRef: React.MutableRefObject<VGL | null>
  selectedMemberRef: React.MutableRefObject<MemberStatus | null>
  ready: boolean
  /** Show the 🔄 segment-transition markers. Default off. */
  showTransitionMarkers?: boolean
  /** Màu tuyến lịch sử (đã đi / còn lại / raw). Thiếu field nào dùng mặc định. */
  routeColors?: HistoryRouteColors
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

export function usePlayback({ mapRef, vglRef, selectedMemberRef, ready, showTransitionMarkers = false, routeColors }: UsePlaybackParams): UsePlaybackReturn {
  const colors: Required<HistoryRouteColors> = {
    traveled: routeColors?.traveled ?? DEFAULT_ROUTE_COLORS.traveled,
    remaining: routeColors?.remaining ?? DEFAULT_ROUTE_COLORS.remaining,
    raw: routeColors?.raw ?? DEFAULT_ROUTE_COLORS.raw,
  }
  // Ref để các callback (useCallback deps tối thiểu) luôn đọc màu mới nhất.
  const colorsRef = React.useRef(colors)
  colorsRef.current = colors
  const colorsKey = `${colors.traveled}|${colors.remaining}|${colors.raw}`

  const [historyPoints, setHistoryPoints] = React.useState<GpsPoint[]>([])
  const [enrichedSegments, setEnrichedSegments] = React.useState<GpsPoint[][] | null>(null)
  const [rawPoints, setRawPoints] = React.useState<GpsPoint[]>([])
  const [playIndex, setPlayIndex] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playSpeed, setPlaySpeed] = React.useState<1 | 2 | 4>(1)
  const [autoFollow, setAutoFollow] = React.useState(true)

  const historyPointsRef = React.useRef<GpsPoint[]>([])
  const historyMarkerRef = React.useRef<unknown>(null)
  const enrichedSegmentsRef = React.useRef<GpsPoint[][] | null>(null)
  const transitionMarkersRef = React.useRef<{ remove: () => void }[]>([])
  const playTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const autoFollowRef = React.useRef(autoFollow)

  const playIndexRef = React.useRef(0)
  React.useEffect(() => { historyPointsRef.current = historyPoints }, [historyPoints])
  React.useEffect(() => { enrichedSegmentsRef.current = enrichedSegments }, [enrichedSegments])
  React.useEffect(() => { autoFollowRef.current = autoFollow }, [autoFollow])
  React.useEffect(() => { playIndexRef.current = playIndex }, [playIndex])

  const drawHistoryRoute = React.useCallback((pts: GpsPoint[], playIdx: number) => {
    const map = mapRef.current as MapInstance | null
    if (!map || pts.length < 2) return
    const ci = Math.max(0, Math.min(playIdx, pts.length - 1))
    const segs = enrichedSegmentsRef.current

    // Draw one polyline per (already index-merged) segment. Both the traveled
    // and remaining tracks are cut at segment boundaries, so neither bridges
    // across a matcher gap (the classic bird-flight line). All segments share a
    // single color — traveled blue (playback progress), remaining grey. Within a
    // segment the two share the cursor point, so they meet seamlessly.
    const travFeatures: LineFeature[] = []
    const remFeatures: LineFeature[] = []

    if (segs && segs.length > 0) {
      let offset = 0
      for (let si = 0; si < segs.length; si++) {
        const seg = segs[si]
        const cut = ci - offset // cursor position within this segment
        if (cut >= 1) {
          const end = Math.min(cut, seg.length - 1)
          const coords = seg.slice(0, end + 1).map((p): [number, number] => [p.lng, p.lat])
          if (coords.length >= 2) travFeatures.push(lineFeature(coords, colorsRef.current.traveled))
        }
        if (cut <= seg.length - 1) {
          const from = Math.max(0, cut)
          const coords = seg.slice(from).map((p): [number, number] => [p.lng, p.lat])
          if (coords.length >= 2) remFeatures.push(lineFeature(coords, colorsRef.current.remaining))
        }
        offset += seg.length
      }
    } else {
      // No segment data — one continuous track, still split at the cursor.
      const travCoords = pts.slice(0, ci + 1).map((p): [number, number] => [p.lng, p.lat])
      if (travCoords.length >= 2) travFeatures.push(lineFeature(travCoords, colorsRef.current.traveled))
      const remCoords = pts.slice(ci).map((p): [number, number] => [p.lng, p.lat])
      if (remCoords.length >= 2) remFeatures.push(lineFeature(remCoords, colorsRef.current.remaining))
    }

    const travGeo = { type: 'FeatureCollection', features: travFeatures }
    const remGeo = { type: 'FeatureCollection', features: remFeatures }

    try {
      const remSrc = map.getSource(ROUTE_REM_SRC)
      if (remSrc) { remSrc.setData(remGeo) }
      else {
        map.addSource(ROUTE_REM_SRC, { type: 'geojson', data: remGeo } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_REM_BG, type: 'line', source: ROUTE_REM_SRC, paint: { 'line-color': ['get', 'color'], 'line-width': 7, 'line-opacity': 0.18 } } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_REM_LINE, type: 'line', source: ROUTE_REM_SRC, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.85 } } as Record<string, unknown>)
      }
      const travSrc = map.getSource(ROUTE_TRAV_SRC)
      if (travSrc) { travSrc.setData(travGeo) }
      else {
        map.addSource(ROUTE_TRAV_SRC, { type: 'geojson', data: travGeo } as Record<string, unknown>)
        map.addLayer({ id: ROUTE_TRAV_LINE, type: 'line', source: ROUTE_TRAV_SRC, paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.9 } } as Record<string, unknown>)
      }
    } catch (e) { console.warn('[LiveMap] drawHistoryRoute', e) }
  }, [mapRef])

  // Transition markers (🔄) at each segment boundary. They don't move with the
  // playback cursor, so they're drawn once per route (not per seek). The gap
  // between the previous segment's last point and this segment's first point is
  // why the matcher cut here — surfaced as a hover tooltip.
  const removeTransitionMarkers = React.useCallback(() => {
    transitionMarkersRef.current.forEach((m) => { try { m.remove() } catch { /* ignore */ } })
    transitionMarkersRef.current = []
  }, [])

  const drawTransitionMarkers = React.useCallback(() => {
    const map = mapRef.current as MapInstance | null
    const VGL = vglRef.current
    removeTransitionMarkers()
    if (!map || !VGL) return
    const segs = enrichedSegmentsRef.current
    if (!segs || segs.length < 2) return
    type MarkerInst = { setLngLat: (ll: [number, number]) => MarkerInst; addTo: (m: unknown) => void; remove: () => void }
    const MarkerCtor = (VGL as unknown as { Marker: new (o: Record<string, unknown>) => MarkerInst }).Marker
    for (let si = 1; si < segs.length; si++) {
      const prev = segs[si - 1]
      const curr = segs[si]
      if (!prev.length || !curr.length) continue
      const prevLast = prev.at(-1)!
      const currFirst = curr[0]
      const gap = fmtGap((currFirst.time ?? 0) - (prevLast.time ?? 0))
      const el = document.createElement('div')
      el.title = `Ngắt tuyến: đoạn ${si} → ${si + 1}\nGap thời gian: ${gap}`
      el.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:11px;background:linear-gradient(135deg, ${segColor(si - 1)}, ${segColor(si)});">🔄</div>`
      const marker = new MarkerCtor({ element: el, anchor: 'center' }).setLngLat([currFirst.lng, currFirst.lat])
      marker.addTo(map)
      transitionMarkersRef.current.push(marker)
    }
  }, [mapRef, vglRef, removeTransitionMarkers])

  // Raw GPS track drawn as a dashed comparison line on top of the (enriched)
  // main route. Pass an empty/short array to remove it.
  const lastRawRef = React.useRef<GpsPoint[]>([])
  const drawRawRoute = React.useCallback((pts: GpsPoint[]) => {
    const map = mapRef.current as MapInstance | null
    if (!map) return
    lastRawRef.current = pts?.length >= 2 ? pts : []
    const removeRaw = () => {
      try {
        if (map.getLayer(ROUTE_RAW_LINE)) map.removeLayer(ROUTE_RAW_LINE)
        if (map.getSource(ROUTE_RAW_SRC)) map.removeSource(ROUTE_RAW_SRC)
      } catch { /* ignore */ }
    }
    if (!pts || pts.length < 2) { removeRaw(); return }
    const rawGeo = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts.map((p) => [p.lng, p.lat]) } }
    try {
      // Luôn add lại layer (thay vì chỉ setData) để đổi `routeColors.raw` áp dụng ngay.
      removeRaw()
      map.addSource(ROUTE_RAW_SRC, { type: 'geojson', data: rawGeo } as Record<string, unknown>)
      map.addLayer({ id: ROUTE_RAW_LINE, type: 'line', source: ROUTE_RAW_SRC, paint: { 'line-color': colorsRef.current.raw, 'line-width': 3, 'line-opacity': 0.85, 'line-dasharray': [2, 2] } } as Record<string, unknown>)
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
    removeTransitionMarkers()
  }, [mapRef, removeTransitionMarkers])

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

  // Re-draw once segment data settles (the ref syncs async; segments and route
  // points arrive together).
  React.useEffect(() => {
    if (!ready || historyPoints.length < 2) return
    drawHistoryRoute(historyPoints, 0)
  }, [enrichedSegments, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Đổi routeColors khi đang xem → vẽ lại ngay với màu mới, giữ nguyên vị trí
  // playback. Raw chỉ vẽ lại nếu đang hiển thị (lastRawRef rỗng khi đã ẩn).
  React.useEffect(() => {
    if (!ready) return
    if (historyPointsRef.current.length >= 2)
      drawHistoryRoute(historyPointsRef.current, playIndexRef.current)
    if (lastRawRef.current.length >= 2) drawRawRoute(lastRawRef.current)
  }, [colorsKey, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Transition markers are opt-in. Toggling the flag adds/removes them without
  // re-fetching; they also re-place when segment data changes.
  React.useEffect(() => {
    if (showTransitionMarkers && ready) drawTransitionMarkers()
    else removeTransitionMarkers()
  }, [showTransitionMarkers, enrichedSegments, ready]) // eslint-disable-line react-hooks/exhaustive-deps

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
