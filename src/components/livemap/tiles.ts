import type { TileType } from '@/lib/types'

const VIETMAP_BASE = 'https://maps.vietmap.vn'

/** Font stack có thật trên server glyphs của Vietmap — font mặc định của
 *  MapLibre ("Open Sans Regular") trả 400 nên mọi symbol layer PHẢI set
 *  text-font này, nếu không text sẽ không hiển thị. */
export const VIETMAP_TEXT_FONT = ['Noto Sans Regular']
export const VIETMAP_TEXT_FONT_BOLD = ['Noto Sans Bold']

const VIETMAP_STYLE_SLUGS: Record<Exclude<TileType, 'satellite'>, string> = {
  light: 'lm',
  dark: 'dm',
  terrain: 'tm',
}

export function buildTileStyle(tile: TileType, apiKeyTilemap: string): unknown {
  if (tile === 'satellite') {
    return {
      version: 8,
      // Cần cho các symbol layer (initials, label, số đếm cluster) — style
      // raster tự dựng không có glyphs thì text không render được.
      glyphs: `${VIETMAP_BASE}/maps/fonts/{fontstack}/{range}.pbf`,
      sources: {
        google_satellite: {
          type: 'raster',
          tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
          tileSize: 256,
        },
      },
      layers: [{ id: 'google_satellite_layer', type: 'raster', source: 'google_satellite', minzoom: 0, maxzoom: 22 }],
    }
  }
  const slug = VIETMAP_STYLE_SLUGS[tile]
  return `${VIETMAP_BASE}/maps/styles/${slug}/style.json?apikey=${apiKeyTilemap}`
}
