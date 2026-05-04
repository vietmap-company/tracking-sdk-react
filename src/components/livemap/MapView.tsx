import * as React from 'react'
import { createPortal } from 'react-dom'
import { useMembers } from '@/hooks'
import { loadVietmapGL, type VGL } from './vgl-loader'
import { buildTileStyle } from './tiles'
import { MEMBERS_SOURCE, LAYER_CLUSTERS, LAYER_POINTS, toGeoJSON, addClusterLayers } from './clusterLayers'
import type { LiveMapProps, LiveMapRef, MapInstance } from './types'
import type { MemberStatus, TileType } from '@/lib/types'
import { MemberList } from './MemberList'
import { TileSwitcher } from './TileSwitcher'
import { Legend } from './Legend'
import { DefaultPopup } from './Marker'
import { HistoryPanel } from './HistoryPanel'
import { PlaybackControls } from './PlaybackControls'
import { SpiderOverlay } from './SpiderOverlay'
import { usePlayback } from './usePlayback'

export const LiveMap = React.forwardRef<LiveMapRef, LiveMapProps>(function LiveMap(props, ref) {
  const {
    height = '100dvh',
    center = [106.6, 10.8],
    zoom = 11,
    defaultTile = 'terrain',
    apiKeyTilemap,
    pollInterval = 10_000,
    maxUsers = 3000,
    clusterRadius = 50,
    clusterMaxZoom = 14,
    members: membersProp,
    memberNameKey,
    showList = true,
    className,
    style,
    onMemberClick,
    onMarkerClick,
    onMapClick,
    onMapReady,
    renderMarkerPopup,
  } = props

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<MapInstance | null>(null)
  const vglRef = React.useRef<VGL | null>(null)
  const popupRef = React.useRef<{ remove: () => void } | null>(null)
  const popupContainerRef = React.useRef<HTMLDivElement | null>(null)
  const membersRef = React.useRef<MemberStatus[]>([])
  const selectedMemberRef = React.useRef<MemberStatus | null>(null)
  const hasFitRef = React.useRef(false)
  const onMarkerClickRef = React.useRef(onMarkerClick)
  const onMapClickRef = React.useRef(onMapClick)
  const renderPopupRef = React.useRef(renderMarkerPopup)
  React.useEffect(() => { onMarkerClickRef.current = onMarkerClick }, [onMarkerClick])
  React.useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])
  React.useEffect(() => { renderPopupRef.current = renderMarkerPopup }, [renderMarkerPopup])

  const [tile, setTile] = React.useState<TileType>(defaultTile)
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null)
  const [popupMember, setPopupMember] = React.useState<MemberStatus | null>(null)
  const [selectedMember, setSelectedMember] = React.useState<MemberStatus | null>(null)
  const [spiderState, setSpiderState] = React.useState<{ centerPx: { x: number; y: number }; members: MemberStatus[] } | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => { selectedMemberRef.current = selectedMember }, [selectedMember])

  const { data: apiMembers = [], isLoading: apiLoading } = useMembers({
    pollInterval, nameKey: memberNameKey, maxUsers, enabled: !membersProp,
  })
  const members = membersProp ?? apiMembers
  const isLoading = membersProp != null ? false : apiLoading
  React.useEffect(() => { membersRef.current = members }, [members])

  const {
    historyPoints, setHistoryPoints, historyPointsRef,
    playIndex, setPlayIndex, isPlaying, setIsPlaying,
    playSpeed, setPlaySpeed, autoFollow, setAutoFollow,
    seekHistory, clearHistoryRoute,
  } = usePlayback({ mapRef, vglRef, selectedMemberRef, ready })

  // ── Open popup ──────────────────────────────────────────────────────────────
  const openPopup = React.useCallback((m: MemberStatus) => {
    if (!mapRef.current || !vglRef.current) return
    if (!popupContainerRef.current) popupContainerRef.current = document.createElement('div')
    popupRef.current?.remove()
    type PopupInst = { setLngLat: (ll: [number, number]) => PopupInst; setDOMContent: (el: HTMLElement) => PopupInst; addTo: (m: unknown) => PopupInst; remove: () => void; on: (evt: string, h: () => void) => void }
    const popup = new (vglRef.current as unknown as { Popup: new (o: object) => PopupInst }).Popup({ closeButton: false, closeOnClick: false, offset: 15 })
    popup.setLngLat([m.lng, m.lat]).setDOMContent(popupContainerRef.current!).addTo(mapRef.current)
    popup.on('close', () => setPopupMember(null))
    popupRef.current = popup
    setPopupMember(m)
  }, [])

  const closePopup = React.useCallback(() => {
    popupRef.current?.remove(); popupRef.current = null; setPopupMember(null); setActiveUserId(null)
  }, [])

  const openHistory = React.useCallback((m: MemberStatus) => {
    setSelectedMember(m); setActiveUserId(m.userId)
    setHistoryPoints([]); setPlayIndex(0); setIsPlaying(false); clearHistoryRoute()
    mapRef.current?.jumpTo({ center: [m.lng, m.lat], zoom: 14 })
  }, [clearHistoryRoute, setHistoryPoints, setPlayIndex, setIsPlaying])

  const closeHistory = React.useCallback(() => {
    setSelectedMember(null); setHistoryPoints([]); setPlayIndex(0); setIsPlaying(false); setActiveUserId(null); clearHistoryRoute()
  }, [clearHistoryRoute, setHistoryPoints, setPlayIndex, setIsPlaying])

  const handleHistoryLoaded = React.useCallback((pts: typeof historyPoints) => {
    historyPointsRef.current = pts; setHistoryPoints(pts); setPlayIndex(0); setIsPlaying(false); seekHistory(0)
    if (pts.length >= 2) {
      const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng)
      mapRef.current?.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, duration: 800 })
    }
  }, [historyPointsRef, seekHistory, setHistoryPoints, setPlayIndex, setIsPlaying])

  // ── Sync popup position + data when members poll update ─────────────────
  React.useEffect(() => {
    if (!popupMember) return
    const updated = members.find((m) => m.userId === popupMember.userId)
    if (!updated) return
    // Update popup lngLat if member moved
    if (updated.lat !== popupMember.lat || updated.lng !== popupMember.lng) {
      ;(popupRef.current as { setLngLat?: (ll: [number, number]) => void } | null)
        ?.setLngLat?.([updated.lng, updated.lat])
    }
    // Always refresh popup content (speed, status may change)
    setPopupMember(updated)
  }, [members]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync selectedMember (HistoryPanel header) when members poll update ────
  React.useEffect(() => {
    if (!selectedMember) return
    const updated = members.find((m) => m.userId === selectedMember.userId)
    if (updated) setSelectedMember(updated)
  }, [members]) // eslint-disable-line react-hooks/exhaustive-deps

  // Init map
  React.useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false, map: MapInstance | null = null
    loadVietmapGL().then((VGL) => {
      if (cancelled || !containerRef.current) return
      vglRef.current = VGL
      map = new (VGL as unknown as { Map: new (o: object) => MapInstance }).Map({ container: containerRef.current, style: buildTileStyle(tile, apiKeyTilemap), center, zoom })
      mapRef.current = map
      map.on('load', () => { if (!cancelled) { setReady(true); onMapReady?.(map as MapInstance) } })
      map.on('click', (e: unknown) => {
        const ev = e as { lngLat?: { lng: number; lat: number }; point?: { x: number; y: number } }
        const m = mapRef.current
        if (ev.point && m?.queryRenderedFeatures) {
          const features = m.queryRenderedFeatures([ev.point.x, ev.point.y], { layers: [LAYER_CLUSTERS, LAYER_POINTS] })
          if (features && features.length > 0) {
            const f = features[0]
            if (f.layer.id === LAYER_CLUSTERS) { m.easeTo({ center: f.geometry.coordinates as [number, number], zoom: m.getZoom() + 3, duration: 500 }); return }
            if (f.layer.id === LAYER_POINTS) {
              const px = ev.point as { x: number; y: number }
              const clickedCoord = f.geometry.coordinates as [number, number]

              // Check for overlapping points → spiderfy
              const nearby = m.queryRenderedFeatures?.(
                [[px.x - 12, px.y - 12], [px.x + 12, px.y + 12]] as [[number, number], [number, number]],
                { layers: [LAYER_POINTS] }
              ) ?? []
              const overlapping = nearby.filter((feat) => {
                const c = feat.geometry.coordinates as [number, number]
                return Math.abs(c[0] - clickedCoord[0]) < 0.00002 && Math.abs(c[1] - clickedCoord[1]) < 0.00002
              })

              if (overlapping.length > 1) {
                const spiderMembers = overlapping
                  .map(feat => membersRef.current.find(x => x.userId === feat.properties.userId as string))
                  .filter((x): x is MemberStatus => x != null)
                const centerPx = m.project?.(clickedCoord) ?? { x: px.x, y: px.y }
                popupRef.current?.remove(); popupRef.current = null; setPopupMember(null)
                setSpiderState({ centerPx, members: spiderMembers })
                return
              }

              const member = membersRef.current.find((x) => x.userId === f.properties.userId as string)
              if (member && (onMarkerClickRef.current ? onMarkerClickRef.current(member) !== false : true)) {
                if (selectedMemberRef.current) {
                  openHistory(member)
                } else {
                  setActiveUserId(member.userId); openPopup(member)
                  m.jumpTo({ center: [member.lng, member.lat], zoom: Math.max(14, m.getZoom()) })
                }
              }
              return
            }
          }
        }
        if (ev.lngLat) {
          setSpiderState(null)
          onMapClickRef.current?.([ev.lngLat.lng, ev.lngLat.lat])
        }
      })
      map.on('mousemove', (e: unknown) => {
        const ev = e as { point?: { x: number; y: number } }
        const canvas = mapRef.current?.getCanvas?.()
        if (!canvas || !ev.point || !mapRef.current?.queryRenderedFeatures) return
        const features = mapRef.current.queryRenderedFeatures([ev.point.x, ev.point.y], { layers: [LAYER_CLUSTERS, LAYER_POINTS] })
        canvas.style.cursor = features && features.length > 0 ? 'pointer' : ''
      })
      map.on('styledata', () => {
        const m = mapRef.current; if (!m || m.getSource(MEMBERS_SOURCE)) return
        try { addClusterLayers(m, toGeoJSON(membersRef.current), clusterRadius, clusterMaxZoom) } catch { /* retry */ }
      })
    }).catch((err) => { if (!cancelled) console.error('[LiveMap] VietmapGL load failed:', err) })
    return () => {
      cancelled = true; popupRef.current?.remove(); popupRef.current = null
      try { map?.remove() } catch { /* ignore */ }
      mapRef.current = null; setReady(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKeyTilemap])

  React.useEffect(() => { if (!ready || !mapRef.current) return; mapRef.current.setStyle(buildTileStyle(tile, apiKeyTilemap)) }, [tile, apiKeyTilemap, ready])

  React.useEffect(() => {
    if (!ready || !mapRef.current) return
    const map = mapRef.current, data = toGeoJSON(members)
    try {
      const src = map.getSource(MEMBERS_SOURCE)
      if (src) src.setData(data); else addClusterLayers(map, data, clusterRadius, clusterMaxZoom)
    } catch (e) { console.warn('[LiveMap] sync members:', e) }
    if (!hasFitRef.current) {
      const pts = members.filter((m) => m.lat && m.lng)
      if (pts.length >= 2) {
        hasFitRef.current = true
        const lats = pts.map((m) => m.lat), lngs = pts.map((m) => m.lng)
        map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 60, duration: 0 })
      } else if (pts.length === 1) { hasFitRef.current = true; map.fitBounds([[pts[0].lng, pts[0].lat], [pts[0].lng, pts[0].lat]], { padding: 60, duration: 0, maxZoom: 14 }) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, ready])

  React.useImperativeHandle(ref, () => ({
    flyTo: (c, z) => mapRef.current?.jumpTo({ center: c, zoom: z ?? mapRef.current.getZoom() }),
    fitBounds: (bounds) => mapRef.current?.fitBounds(bounds, { padding: 48, duration: 600 }),
    focusMember: (userId) => { const m = membersRef.current.find((x) => x.userId === userId); if (!m) return; setActiveUserId(userId); mapRef.current?.jumpTo({ center: [m.lng, m.lat], zoom: 15 }); openPopup(m) },
    getMembers: () => membersRef.current,
    getMap: () => mapRef.current,
  }), [openPopup])

  const popupContent = popupMember
    ? renderPopupRef.current
      ? renderPopupRef.current(popupMember)
      : <DefaultPopup member={popupMember} onClose={closePopup} onViewHistory={() => { openHistory(popupMember); closePopup() }} />
    : null

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 ${className ?? ''}`} style={{ height, ...style }}>
      <div ref={containerRef} className="h-full w-full" />
      {showList && (
        <MemberList
          members={members} isLoading={isLoading} activeUserId={activeUserId}
          onItemClick={(m) => {
            if (onMemberClick ? onMemberClick(m) === false : false) return
            // If history panel is open → switch to history of new member
            if (selectedMember) {
              closePopup()
              openHistory(m)
              return
            }
            setActiveUserId(m.userId)
            popupRef.current?.remove(); popupRef.current = null; setPopupMember(null)
            const map = mapRef.current; if (!map) return
            map.jumpTo({ center: [m.lng, m.lat], zoom: Math.max(14, map.getZoom()) }); openPopup(m)
          }}
          position="left"
        />
      )}
      <Legend position="top-right" />
      <TileSwitcher value={tile} onChange={setTile} position="bottom-right" />
      {popupMember && popupContainerRef.current && createPortal(popupContent, popupContainerRef.current)}
      {spiderState && (
        <SpiderOverlay
          centerPx={spiderState.centerPx}
          members={spiderState.members}
          onSelect={(m) => {
            setSpiderState(null)
            setActiveUserId(m.userId)
            openPopup(m)
          }}
          onClose={() => setSpiderState(null)}
        />
      )}
      {selectedMember && (
        <HistoryPanel key={selectedMember.userId} member={selectedMember} onClose={closeHistory} onHistoryLoaded={handleHistoryLoaded} playIndex={playIndex} onSeek={seekHistory} />
      )}
      {selectedMember && historyPoints.length > 1 && (
        <PlaybackControls
          points={historyPoints} index={playIndex} isPlaying={isPlaying} speed={playSpeed} autoFollow={autoFollow}
          onSeek={seekHistory} onPlayToggle={() => setIsPlaying((v) => !v)}
          onSpeedCycle={() => setPlaySpeed((sp) => sp === 1 ? 2 : sp === 2 ? 4 : 1)}
          onAutoFollowToggle={() => setAutoFollow((v) => !v)}
        />
      )}
    </div>
  )
})
