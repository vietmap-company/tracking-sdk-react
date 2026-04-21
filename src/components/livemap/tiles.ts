import type { TileType } from '@/lib/types'

const VIETMAP_BASE = 'https://maps.vietmap.vn'

const VIETMAP_STYLE_SLUGS: Record<Exclude<TileType, 'satellite'>, string> = {
  light: 'lm',
  dark: 'dm',
  terrain: 'tm',
}

export function buildTileStyle(tile: TileType, apiKeyTilemap: string): unknown {
  if (tile === 'satellite') {
    return {
      version: 8,
      sources: {
        google_satellite: {
          type: 'raster',
          tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'google_satellite_layer',
          type: 'raster',
          source: 'google_satellite',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }
  }

  const slug = VIETMAP_STYLE_SLUGS[tile]
  return `${VIETMAP_BASE}/maps/styles/${slug}/style.json?apikey=${apiKeyTilemap}`
}
