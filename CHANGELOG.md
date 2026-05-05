# Changelog

All notable changes to `@vietmap/tracking-sdk-react` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.5] - 2026-05-05

### Added

- **`HistoryRouteResponse`** type mới — phản ánh đúng response thực tế của `/gps-tracking/history` (object có `trackingData` + pagination), thay vì union `array | object` cũ (array branch không bao giờ trigger).
- Top-level `dist/index.d.ts` barrel — `package.json#types` từ `./dist/src/index.d.ts` về `./dist/index.d.ts` chuẩn để IDE/TS plugin pick up IntelliSense ổn định hơn.
- **Auto-spider cho overlapping markers (LiveMap)** — các member ở cùng toạ độ (group 2–8) tự động fan out ra spider khi map idle/zoom xong, **không cần click**. Map vẫn pan/zoom tự do (không backdrop). Spider reproject từ lat/lng mỗi animation frame (`map.on('move')` + RAF throttle) → bám đúng vị trí trong khi drag, không bị "đứng im rồi nhảy" như khi chỉ recompute trên `idle`. Group đông hơn 8 vẫn dùng pattern click-to-spider cũ để tránh nghẽn UI. Prop `interactive?: boolean` mới trên `SpiderOverlay` (default `true`); set `false` để dùng auto-spider mode trong custom UI.
- **Selected marker visual indicator (LiveMap)** — marker được chọn giờ có viền xanh dày (4px, `#3b82f6`), kích thước to hơn ~40% (radius 8 → 11), và halo glow ring bên dưới. User nhìn thấy ngay đang select ai khi map có nhiều marker. Trong auto-spider, leaf của member được chọn cũng có viền xanh + scale 1.1. Prop `activeUserId` mới trên `SpiderOverlay` để custom UI tự highlight.
- **Selected member không bao giờ bị cluster** — 2-source architecture: `dc-members` (cluster: true) chứa tất cả trừ `activeUserId`; `dc-selected` (cluster: false) chứa riêng member đang chọn. Selected member luôn hiển thị trên map dù xung quanh có bao nhiêu marker. Thêm `LAYER_SELECTED_HALO` (glow ring) và `LAYER_SELECTED_POINT` (border stroke xanh) cho selected source.

### Performance

- **LiveMap spider recompute O(1)** — xây `Map<userId, member>` một lần thay vì `Array.find` O(n) mỗi member; dùng `Set<string>` per-group để dedup thay vì `Array.includes` O(n); bail-out shallow compare trên `setAutoSpiderGroups` để skip React re-render khi groups không đổi.
- **Spider RAF dedup** — `scheduleRecompute` gộp `idle + moveend` double-fire thành 1 RAF; `map.on('move')` skip RAF hoàn toàn khi `autoSpiderGroups` rỗng (không có spider nào cần reproject).
- **SpiderOverlay positions[] compute once** — `spokePos()` chỉ tính 1 lần per member, dùng chung cho cả SVG line lẫn avatar button (trước đây tính 2 lần).

### Fixed

- **RAF memory leak (LiveMap)** — `recomputeRafId` và `rafId` trước đây khai báo trong `.then()` nên cleanup `useEffect` không cancel được. Đã hoist ra outer scope → `cancelAnimationFrame` trong cleanup hoạt động đúng.
- **`prepublishOnly` build sai target** — trước chạy `npm run build` (demo app), giờ chạy `npm run build:lib` (thư viện).
- **vgl-loader race condition** — nếu script tag đã có trong DOM và đã load xong trước khi listener kịp attach, `onload` không bao giờ fire. Fix bằng check `readyState === 'complete'` và call `ok()` ngay nếu đúng; thêm `error` listener cho cả trường hợp load lỗi.
- **History total duration âm** — endpoint `/gps-tracking/history` trả data descending (mới nhất trước), nhưng `totalMs = pts[last].time - pts[0].time` giả định ascending → kết quả âm. Fix bằng `.sort((a, b) => a.time - b.time)` trong `LiveMapController.getHistoryRoute()`.
- **HTTP timeout 30s → 10s** — giảm timeout axios từ 30s xuống 10s cho phản hồi nhanh hơn khi mạng kém.
- **`queryRenderedFeatures` type error** — type signature yêu cầu `geometry` bắt buộc, nhưng gọi với chỉ `{ layers }` (toàn viewport) là API hợp lệ. Fix bằng `geometry?: PointLike | [PointLike, PointLike]` + overload không có geometry.
- **`tsconfig.build.json` strict disabled** — bật `strict: true` + thêm `"ignoreDeprecations": "6.0"` để suppress TS6 baseUrl deprecation.
- **Popup + selection persists when opening history (LiveMap)** — click marker → popup → "Xem lộ trình" trước đây gọi `closePopup()` riêng, làm `activeUserId` bị clear ngay trước khi `openHistory` set lại → marker mất select 1 frame và đôi khi state inconsistent. Giờ `openHistory` tự xử lý popup teardown và giữ nguyên `activeUserId` → marker luôn highlighted trong suốt session xem history.
- **API contract alignment** — em curl thật từng endpoint với api key thật và phát hiện các mismatch giữa types và backend, đã fix:
  - `reportType` literal × 5 reports: `'trip-summary'`/`'trip-detail'`/`'fuel-summary'`/`'fuel-detail'`/`'activity-time'` → snake_case `'trip_summary'`/`'trip_detail'`/`'fuel_summary'`/`'fuel_detail'`/`'activity_time'`. Discriminated union narrowing trên `reportType` giờ hoạt động đúng.
  - `MemberRow` (`/dashboard/gps-manager/users`): bỏ các field **không tồn tại** trong response (`name`, `avatarUrl`, `groupName`, `metaData` top-level). Real `metadata` nằm trong `lastLocation.metadata` (JSON string) — đã expose. Dashboard `MemberReport` giờ resolve display name từ `user.lastLocation?.metadata` với `memberNameKey`, avatar từ `metadata.userAvatar`.
  - `GpsPoint.metadata`: `string | null` → `string | Record<string, unknown> | null`. Endpoint `/gps-tracking/users` ship `metadata` dạng JSON string, còn `/gps-tracking/latest/users/:id` và `/gps-tracking/history` ship object đã parse — type giờ phản ánh đúng cả 2 shape. Helper `parseMeta` trong `LiveMapController` cũng accept cả 2.
  - `LiveMapController.getLastLocation`: bỏ wrapper branch `{success, data} | GpsPoint` (backend trả thẳng `GpsPoint`, branch wrapper không bao giờ trigger). Type giờ là `GpsPoint | null`.
  - `LiveMapController.getHistoryRoute`: bỏ array fallback (backend luôn trả object), dùng `HistoryRouteResponse` mới.

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
