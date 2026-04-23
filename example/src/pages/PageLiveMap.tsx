import { useRef, useState } from 'react'
import { LiveMap } from '@vietmap/tracking-sdk-react'
import type { LiveMapRef, MemberStatus } from '@vietmap/tracking-sdk-react'

export function PageLiveMap() {
  const mapRef = useRef<LiveMapRef>(null)
  const [lastEvent, setLastEvent] = useState<string>('')

  const log = (msg: string) => setLastEvent(`[${new Date().toLocaleTimeString()}] ${msg}`)

  return (
    <div className='flex h-[calc(100vh-52px)] flex-col'>
      {/* Toolbar */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border bg-card px-4 py-2'>
        <span className='mr-2 text-sm font-semibold text-foreground'>Live Map</span>

        <button className={toolbarBtn} onClick={() => { mapRef.current?.flyTo([105.85, 21.03], 12); log('flyTo Hà Nội') }}>
          Hà Nội
        </button>
        <button className={toolbarBtn} onClick={() => { mapRef.current?.flyTo([106.7, 10.8], 12); log('flyTo TP.HCM') }}>
          TP.HCM
        </button>
        <button className={toolbarBtn} onClick={() => { mapRef.current?.fitBounds([[102, 8], [110, 23]]); log('fitBounds Vietnam') }}>
          Toàn quốc
        </button>
        <button className={toolbarBtn} onClick={() => {
          const members = mapRef.current?.getMembers() ?? []
          log(`getMembers → ${members.length} members`)
        }}>
          Log members
        </button>

        <div className='ml-auto'>
          {lastEvent ? (
            <span className='rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground'>
              {lastEvent}
            </span>
          ) : (
            <span className='text-xs text-muted-foreground'>Click marker để xem popup</span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className='min-h-0 flex-1 p-3'>
        <LiveMap
          ref={mapRef}
          height='100%'
          center={[106.6297, 10.8231]}
          zoom={11}
          defaultTile='terrain'
          pollInterval={10_000}
          memberNameKey='userName'
          showList
          showLegend
          showTileSwitcher
          legendPosition='top-right'
          tileSwitcherPosition='bottom-right'
          onMapReady={(map) => log(`Map ready — zoom ${map.getZoom().toFixed(1)}`)}
          onMapClick={([lng, lat]) => log(`click ${lat.toFixed(4)}, ${lng.toFixed(4)}`)}
          onMarkerClick={(m: MemberStatus) => log(`marker: ${m.name} (${m.statusLabel})`)}
        />
      </div>
    </div>
  )
}

const toolbarBtn =
  'rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted'
