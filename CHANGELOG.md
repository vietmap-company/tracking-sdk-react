# Changelog

All notable changes to `@vietmap/tracking-sdk-react` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.4] - 2026-05-05

### Added

- **Auth error overlay (401/403)** — axios interceptor tự bắt response 401/403 và emit qua event bus; `FleetworkProvider` render overlay block UI với message từ backend (priority `message` → `status` → `detail` → `error` → `errors[0]`). Đóng bằng × / Esc / click backdrop. 401 có thêm nút "Tải lại trang". Consumer customize qua 3 props: `onAuthError(event)` callback song song, `disableAuthErrorOverlay` để tắt, `renderAuthError(event, dismiss)` để render UI riêng. Export `subscribeAuthError` cho advanced use cases ngoài React tree. Type `AuthErrorEvent` exposed.
- **`memberNameKey` provider-level** — promote từ `<LiveMap memberNameKey="...">` lên `<FleetworkProvider memberNameKey="...">` để Dashboard MemberReport, Report tables (TripSummary/TripDetail/FuelSummary/FuelDetail), LiveMap markers tất cả đồng nhất hiển thị tên từ `metaData[key]`. Per-component prop vẫn override Provider (backward compat). Fallback chain: `metaData[key]` → `row.name` → `row.userId`. Helper `resolveMemberName(metaData, key, fallback)` exposed cho consumer dùng ngoài (custom render). Hỗ trợ `metaData` cả dạng object lẫn JSON-stringified.

---

## [1.0.3] - 2026-05-05

### Rewrite — shadcn/ui + Tailwind CSS v4, no TanStack Query

#### Added

- **shadcn/ui** full component set — Tailwind CSS v4, CSS variable theming, tất cả base components
- **Dashboard**
  - `SummaryCards`: border-left accent riêng mỗi card, fade-in animation khi data load
  - `MemberReport`: dùng `ReportShell` + `PaginationBar` từ report/shared, đồng nhất với report tables
  - `ActivityHeatmap`: cell 24×7, label ngày tiếng Việt (T2–CN), 6-step gradient, date range display, hover scale effect
  - `FuelTracking`: recharts LineChart, theme-aware colors qua CSS variables
  - `MonthlyExpenses`: recharts BarChart stacked, theme-aware colors
- **LiveMap**
  - VietmapGL CDN lazy loader (không bundle vào dist)
  - Popup: React component portalled vào VietmapGL container, native CSS chrome bị strip hoàn toàn — không bị double border/rounded
  - Popup + MemberList + HistoryPanel dùng chung `STATUS_BADGE`, `STATUS_AVATAR_BG`, `STATUS_DOT_PLAIN` từ `shared/constants`
  - **HistoryPanel redesign**: stats 2 cột (quãng đường / thời gian), timeline bar với chip legend (rounded, hover opacity), date picker với confirm button, date nav prev/next, nhóm điểm dừng collapsible
  - Khi đang xem history, click member khác trong sidebar hoặc trên bản đồ → tự switch history sang member mới
  - Popup lngLat + data tự cập nhật theo poll interval
  - `history.types.ts`: tách types `Segment`, `HistoryGroup`, `MoveGroup`, `StopGroup`, `LostGroup` ra file riêng
- **Report**
  - Home screen với 3 cards (Hành trình / Nhiên liệu / Giờ hoạt động) có hover lift effect
  - Sticky header (`thead`, `top-0 z-20`) + sticky totals row (`tfoot`, `bottom-0`) khi scroll dọc
  - Scroll ngang giữ header đồng bộ
  - `DateRangePicker`: Calendar `mode="range"` 2 tháng song song, chọn xong nhấn "Áp dụng" — không cần step indicator
  - `DatePicker`: calendar mở đúng tháng đang chọn, confirm/cancel buttons
  - `ReportShell`, `PaginationBar` (first/last/prev/next + numbered pages với ellipsis), `DateRangeBar` tái sử dụng cho cả Dashboard MemberReport
- **Hooks** — thuần `useState/useEffect`, không TanStack Query
  - `useStableDefault`: fix infinite loop khi default values như `Date.now()` tính lại mỗi render
  - Skeleton delay 150ms — không flash skeleton nếu request nhanh
  - Giữ data cũ khi refetch/poll — không blank trong lúc refresh
- **i18n** hoàn toàn tiếng Việt, bao gồm `history.*`, `expenses.subtitle`, `reports.activity.subtitle`

#### Changed

- **Peer React**: giữ `>=16.8.0` (match 1.0.x). Source code không dùng React 18+ APIs (`useId`, `useSyncExternalStore`, `useTransition`, etc.); tất cả runtime deps đều declare peer ≥16.8. Khuyên React ≥18 cho production: Radix UI và Recharts test chủ yếu trên 18+; SSR `useId` của Radix có hành vi khác giữa 16/17 và 18+.
- **Bundle**: ESM ~32 KB gzip (148 KB raw), CSS ~12 KB gzip — externalize toàn bộ runtime deps thay vì inline Radix/Recharts/axios. Consumer bundler tree-shake và pre-bundle riêng các deps này.
- Bỏ TanStack Query — không cần `QueryClientProvider` wrap ngoài
- `FleetworkProvider` không có `apiKeyTilemap` — tile key truyền trực tiếp vào `<LiveMap apiKeyTilemap="..." />`
- Header table: bỏ `uppercase tracking-wide` — chữ hoa chữ cái đầu tự nhiên (sentence case)
- Table wrapper: `overflow-x-auto` để scroll ngang khi bảng rộng
- `DateRangePicker`: bỏ step indicator phức tạp, dùng Calendar `mode="range"` trực quan hơn
- HistoryPanel: bỏ section "Số điểm GPS", giữ 2 stats chính quãng đường và thời gian
- `package.json#types`: trỏ tới `./dist/src/index.d.ts` (TypeScript) — declarations preserve cấu trúc thư mục `src/`
- `exports['./styles.css']`: chuyển từ string đơn → conditional object với `types` + `default`
- API endpoint mặc định: `https://live.fleetwork.vn/api/v1` (đồng nhất giữa Provider, controllers, http client)

#### Fixed

- **`Calling require for "react" in an environment that doesn't expose the require function`** ở consumer browser — Rolldown (Vite 8) inject `require()` polyfill khi externalize `react` mà CJS deps (Radix `use-sync-external-store/shim`, Recharts) gọi `require("react")` nội bộ. Fix bằng cách externalize **tất cả** runtime deps trong vite config, để Vite/bundler của consumer pre-bundle CJS deps đúng cách.
- **CSS không output**: lib entry `src/index.ts` không import CSS, build chỉ có JS. Thêm `import './index.css'` vào entry để Tailwind+Vite emit `dist/tracking-sdk-react.css`.
- **Types empty (`export {}`)**: `vite-plugin-dts` `rollupTypes: true` fail im lặng do API Extractor (TS 5.9.3) không tương thích với TS 6 trong project. Tắt `rollupTypes`/`insertTypesEntry`, point `package.json#types` → `./dist/src/index.d.ts`.
- **`import.meta.env.DEV` type error** trong dts generation — thêm `"types": ["vite/client"]` vào `tsconfig.build.json`.
- **`TS2882: Cannot find module ... styles.css`** ở consumer dùng `moduleResolution: bundler` — emit `dist/styles.css.d.ts` stub qua plugin nhỏ trong `vite.config.ts`, thêm `types` vào `exports['./styles.css']`.
- Typo URL fallback `https://https://...` → `https://live.fleetwork.vn/api/v1` trong `src/lib/http.ts`.
- Popup bị double border/rounded corner — fix bằng strip toàn bộ VietmapGL native CSS chrome
- Infinite API spam khi component mount — fix bằng `useStableDefault` cho time-based default values
- Skeleton flash on fast responses — delay 150ms trước khi show skeleton
- HistoryPanel không reload khi switch sang member mới — fix `useEffect` deps + `key={member.userId}`
- PlaybackControls không hiện khi switch member — fix `openHistory` clear state đúng thứ tự
- Report duplicate constants (`NUM`, `TH`, `IDX_H`...) gây parse error — đã cleanup

#### Notes

- Còn warning API Extractor về TS version mismatch (5.9.3 bundled vs 6.0.3 project) — không gây hại, sẽ resolve khi `vite-plugin-dts` upgrade.

---

## [1.0.1] - 2026-04-29

### Added

- **LiveMap** — GeoJSON clustering (3000+ markers, GL circle layers, không DOM nodes)
- **LiveMap** — Spiderfy: click 2+ markers cùng tọa độ fan out radial với SVG lines
- **LiveMap** — `maxUsers`, `clusterRadius`, `clusterMaxZoom` props
- **LiveMap** — Infinite-scroll sidebar (50 rows/batch, IntersectionObserver)
- **LiveMap** — Sidebar sort: moving → stopped → signal lost, stable qua poll updates
- **Report tables** — Row numbers (`#` index column)
- **Report tables** — Zebra striping (`bg-muted/30`)
- **Report tables** — Full pagination: first/last/prev/next + numbered pages với ellipsis
- **Dashboard MemberReport** — Pagination, row numbers, zebra improvements

### Changed

- LiveMap: DOM portal markers → VietmapGL native GL layers (thấp memory + paint cost hơn)
- `fitBounds` chỉ chạy lần đầu load, poll updates không reset viewport

### Fixed

- Sidebar poll update không shuffle vị trí member (sort stable sau filter)
- Cluster circle sizes giảm xuống tránh visual double-count ở cluster boundaries

---

## [1.0.0] - 2025-12-01

### Added

- Initial release: `FleetworkProvider`, `Dashboard`, `LiveMap`, `Report`
- React Query hooks: `useSummaryCards`, `useMemberReport`, `useActivityHeatmap`, `useFuelTracking`, `useMonthlyExpenses`, `useMembers`, `useMember`, `useHistoryRoute`, và tất cả report hooks
- Framework-agnostic controllers: `DashboardController`, `LiveMapController`, `ReportController`
- VietmapGL-backed map với real-time member positions, history playback, tile switcher
- Theming qua `ThemeConfig` CSS variable overrides
- MIT License
