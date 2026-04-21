// ─── SDK config ─────────────────────────────────────────────────────────────
// Set these in .env.local:
//   VITE_FLEETWORK_API_KEY=your_api_token
//   VITE_FLEETWORK_TILEMAP_KEY=your_tilemap_key
//   VITE_FLEETWORK_BASE_URL=https://your-api.example.com

export const SDK_CONFIG = {
  apiKey: import.meta.env.VITE_FLEETWORK_API_KEY ?? '',
  apiKeyTilemap: import.meta.env.VITE_FLEETWORK_TILEMAP_KEY ?? '',
  baseUrl: import.meta.env.VITE_FLEETWORK_BASE_URL ?? 'https://tracking.fleetwork.vn',
  locale: 'vi' as const,
}
