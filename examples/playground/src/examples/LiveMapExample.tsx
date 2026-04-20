import { useRef } from 'react'
import {
  LiveMap,
  type LiveMapRef,
} from '@vietmap/fleetwork-tracking-sdk-react'

export function LiveMapExample() {
  const mapRef = useRef<LiveMapRef>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          padding: 12,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
        }}
      >
        <ToolbarButton
          onClick={() =>
            mapRef.current?.fitBounds([
              [105.8, 21.0],
              [106.7, 10.7],
            ])
          }
        >
          Fit all Vietnam
        </ToolbarButton>
        <ToolbarButton
          onClick={() => mapRef.current?.flyTo([106.6, 10.8], 12)}
        >
          Fly to HCMC
        </ToolbarButton>
        <ToolbarButton
          onClick={() => mapRef.current?.flyTo([105.85, 21.03], 12)}
        >
          Fly to Hanoi
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const first = mapRef.current?.getMembers()[0]
            if (first) mapRef.current?.focusMember(first.userId)
            else alert('No members yet.')
          }}
        >
          Focus first member
        </ToolbarButton>
      </div>

      <LiveMap
        ref={mapRef}
        height='calc(100vh - 180px)'
        center={[106.6, 10.8]}
        zoom={11}
        pollInterval={10000}
        onMemberClick={(m) => {
          console.log('[list click]', m.name)
        }}
        onMarkerClick={(m) => {
          console.log('[marker click]', m.name)
        }}
        onMapClick={(lngLat) => console.log('[map click]', lngLat)}
        onMapReady={() => console.log('[map ready]')}
      />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        background: '#0f172a',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
