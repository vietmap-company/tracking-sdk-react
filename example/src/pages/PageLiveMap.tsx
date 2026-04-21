import { useRef, useState } from 'react'
import { LiveMap } from '@vietmap/fleetwork-tracking-sdk-react'
import type { LiveMapRef, MemberStatus } from '@vietmap/fleetwork-tracking-sdk-react'

/**
 * Page 2 — Live Map
 * Demo đầy đủ LiveMap với member list, legend, tile switcher, history playback.
 * Có imperative API để fly-to / focusMember từ ngoài component.
 */
export function PageLiveMap() {
  const mapRef = useRef<LiveMapRef>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>🗺️ Live Map</span>
        <button
          style={btnStyle}
          onClick={() => {
            mapRef.current?.flyTo([106.7, 10.8], 12)
            addLog('flyTo([106.7, 10.8], 12)')
          }}
        >
          Fly to HCM
        </button>
        <button
          style={btnStyle}
          onClick={() => {
            const members = mapRef.current?.getMembers() ?? []
            addLog(`getMembers() → ${members.length} members`)
          }}
        >
          Log members
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
          {log[0] ?? 'Click vào marker để xem popup + lộ trình'}
        </span>
      </div>

      {/* Map fills remaining height */}
      <div style={{ flex: 1, minHeight: 0, padding: 12 }}>
        <LiveMap
          ref={mapRef}
          height='100%'
          center={[106.6297, 10.8231]}
          zoom={11}
          defaultTile='terrain'
          pollInterval={10_000}
          showList
          showLegend
          showTileSwitcher
          legendPosition='top-right'
          tileSwitcherPosition='bottom-right'
          onMapReady={(map) => addLog(`onMapReady — zoom ${map.getZoom().toFixed(1)}`)}
          onMapClick={([lng, lat]) => addLog(`onMapClick → ${lat.toFixed(4)}, ${lng.toFixed(4)}`)}
          onMemberClick={(m: MemberStatus) => {
            addLog(`onMemberClick → ${m.name}`)
            return false // suppress default fly-to; handled manually below
          }}
          onMarkerClick={(m: MemberStatus) => {
            addLog(`onMarkerClick → ${m.name} (${m.status})`)
          }}
        />
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--foreground)',
  fontSize: 12,
  cursor: 'pointer',
  fontWeight: 500,
}
