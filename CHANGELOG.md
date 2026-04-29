# Changelog

All notable changes to `@vietmap/tracking-sdk-react` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.1/).

---

## [1.0.1] — 2026-04-29

### Added

- **LiveMap — GeoJSON clustering** (`cluster: true` source): renders up to 3 000+ markers as GPU-accelerated GL circle layers — no DOM nodes per marker. Clusters show count labels and expand on click.
- **LiveMap — Spiderfy**: clicking 2+ markers sharing the same coordinate fans them out in a radial spoke layout with SVG lines and per-member avatar buttons, so each can be selected individually.
- **LiveMap — `maxUsers` prop** (default `3000`): controls the `pageSize` sent to the API.
- **LiveMap — `clusterRadius` / `clusterMaxZoom` props**: tune clustering behaviour without touching source code.
- **LiveMap — infinite-scroll sidebar**: member list loads 50 rows at a time via `IntersectionObserver`; smooth for large fleets.
- **LiveMap — sidebar sort order**: members sorted moving → stopped → signal lost at all times; stable across poll updates.
- **Report tables — row numbers**: all 5 report views (TripSummary, TripDetail, FuelSummary, FuelDetail, ActivityTime) now have a `#` index column.
- **Report tables — zebra striping**: alternating `bg-muted/30` rows across all report and dashboard tables.
- **Report tables — full pagination**: first/last/prev/next buttons plus numbered page buttons with ellipsis (`getPageNumbers` helper).
- **Dashboard — MemberReport table**: same pagination, row numbers, and zebra improvements.

### Changed

- **LiveMap**: marker rendering switched from DOM portals to VietmapGL native GL layers — significantly lower memory and paint cost at scale.
- **LiveMap**: `fitBounds` only runs on initial load; subsequent polls no longer reset the viewport.
- Branding: removed all "Fleetwork" references from `package.json` description, `homepage`, and `keywords`; README rewritten to use `@vietmap/tracking-sdk-react` throughout.

### Fixed

- **LiveMap sidebar**: poll updates no longer shuffle member positions (sort is stable, applied after filter).
- **LiveMap cluster radius**: reduced default circle sizes (`16/24/32 px`) to eliminate visual impression of double-counting at city cluster boundaries.

---

## [1.0.0] — 2025-12-01

### Added

- Initial release: `FleetworkProvider`, `Dashboard`, `LiveMap`, `Report` components.
- React Query hooks: `useSummaryCards`, `useMemberReport`, `useActivityHeatmap`, `useFuelTracking`, `useMonthlyExpenses`, `useMembers`, `useMember`, `useHistoryRoute`, and all report hooks.
- Framework-agnostic controllers: `DashboardController`, `LiveMapController`, `ReportController`.
- VietmapGL-backed map with real-time member positions, history playback, tile switcher.
- Theming via `ThemeConfig` CSS variable overrides.
- MIT License.
