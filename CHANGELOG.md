# Changelog

All notable changes to `@vietmap/tracking-sdk-react` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.8] - 2026-06-24

### Fixed

- **LiveMap không còn đè pan/zoom của người dùng** — auto-fit chỉ chạy 1 lần ở lần tải đầu và tự khoá ngay khi người dùng pan/zoom/xoay bản đồ, nên các lần poll members sau không kéo viewport về fit-all nữa. Thêm prop `autoFit` (mặc định `true`) để tắt hẳn nếu muốn giữ `center`/`zoom`.
- **LiveMap hết lỗi `The layer 'dc-clusters' does not exist`** — mọi `queryRenderedFeatures` (click/hover/recompute spider) đi qua helper chỉ truy vấn layer đang tồn tại trong style; tránh crash khi tương tác lúc cluster layer chưa kịp add (ngay sau đổi tile/`setStyle` hoặc trước khi members tải xong).

### Added

- **Lọc `userIds` cho Dashboard & Report** — prop `userIds` trên `<Dashboard>` (Member report) và `<Report>`; option `userIds` cho `useMemberReport`, `useTripSummaryReport`, `useFuelSummaryReport` và `DashboardController.getMemberReport`, `ReportController.getTripSummary`/`getFuelSummary`. Lọc nhiều user server-side; vượt 1000 id tự tách call rồi gộp.
- **Drill-down báo cáo theo user** — bảng Tổng hợp (Hành trình/Nhiên liệu) có cột "Thao tác" với nút Xem chi tiết (👁); click 1 user mở trang chi tiết riêng của user đó. `TripDetailReport`/`FuelDetailReport` nhận thêm `userId`, `userName`; summary view nhận `onUserClick`.

### Changed

- **Dùng bản POST cho lọc nhiều user** — `gps-tracking/users`, `dashboard/gps-manager/users`, `reports/trip/summary`, `reports/fuel/summary` chuyển sang gọi POST (body) theo API mới của backend. Báo cáo chi tiết (`trip/detail`, `fuel/detail`) vẫn GET, lọc 1 user qua `userId`.
- **Report bỏ 2 tab Tổng hợp/Chi tiết** — thay bằng drill-down theo user (trang chi tiết riêng có phân trang/sort/đổi khoảng ngày, ẩn cột nhân viên).

---

## [1.0.7] - 2026-06-22

### Added

- **Lọc LiveMap theo `userIds`** — prop mới `userIds?: string[]` trên `<LiveMap>`, option `userIds` cho hook `useMembers` và `LiveMapController.getMembers()`. Khi truyền, chỉ fetch/hiển thị các user trong danh sách (API lọc server-side); bỏ trống = tất cả như cũ. Hữu ích khi khách hàng chỉ muốn theo dõi một nhóm user nhất định.

### Changed

- **`getMembers` bỏ `pageSize` khi lọc `userIds`** — kết quả đã bị giới hạn bởi danh sách id nên không gửi kèm cap phân trang. Khi không lọc vẫn dùng `pageSize` (mặc định 3000) như cũ.
- **Serialize `userIds` không dùng `[]`** — request thêm `paramsSerializer: { indexes: null }` để sinh `userIds=a&userIds=b` (định dạng API yêu cầu) thay vì `userIds[]=a` mặc định của axios (API bỏ qua dạng có ngoặc).

---

## [1.0.6] - 2026-05-12

### Added

- **`HistoryPanel` tích hợp playback controls** — props mới: `isPlaying`, `playSpeed`, `autoFollow`, `onPlayToggle`, `onSpeedCycle`, `onAutoFollowToggle`. Trên mobile, `PlaybackBar` (seek track, play/pause, speed, auto-follow) được nhúng trực tiếp vào bottom sheet thay vì float riêng bên ngoài. Desktop vẫn dùng floating `PlaybackControls` (`sm:hidden` trên `PlaybackBar` để tránh trùng).
- **`MemberList` prop `collapseOnSelect`** — khi `true`, click chọn member tự collapse sidebar; `MapView` tự truyền `true` khi `window.innerWidth < 640`.

### Changed

- **Status label đồng nhất toàn SDK** — `moving` → "Đang di chuyển", `stopped` → "Dừng", `signal_lost` → "Mất tín hiệu". Trước đây mỗi component hardcode nhãn khác nhau ("Hoạt động", "Đang dừng", "Đang hoạt động").
- **`HistoryPanel` bottom sheet (mobile)** — thay layout full-screen bằng bottom sheet trượt lên từ dưới:
  - Mini state `min-h-[180px] max-h-[320px]`: map vẫn thấy phía trên, hiển thị member header + date picker + timeline + playback controls.
  - Expanded state `h-[68dvh]`: thêm danh sách điểm GPS. Toggle bằng drag handle hoặc nút chevron.
  - Desktop: giữ nguyên right panel `w-[300px]`.
- **Stats (distance + time) di chuyển vào member header** — hiển thị dưới status badge, tiết kiệm 1 row riêng trong sheet.
- **Attribution VietMap ẩn** — `attributionControl: false` khi khởi tạo Map.

### Fixed

- **Popup z-index** — hạ từ `z-index: 100` xuống `10`, không còn đè lên `MemberList` và `HistoryPanel` (`z-20`).
- **`MemberList` tự collapse trên mobile** — `collapsed` state khởi tạo `true` khi `window.innerWidth < 640`; width mở rộng full container (`max-sm:w-[calc(100%-24px)]`) thay vì fixed `268px`.
- **Legend ẩn trên mobile** — `max-sm:hidden`; status badge trong MemberList đã đủ thông tin.
- **Desktop duplicate playback bar** — `PlaybackBar` trong `HistoryPanel` bọc trong `sm:hidden`, tránh render 2 thanh seek cùng lúc trên desktop.

### Responsive — Example App

- **`AppShell`** — desktop sidebar `w-52` / mobile: top bar + bottom tab nav (4 tabs) + slide drawer (☰ → backdrop + close).
- **Pages** — `h-full overflow-auto` để mỗi page tự scroll nội bộ; `p-4 sm:p-6` padding responsive.
- **`PageLiveMap`** — fill đúng chiều cao còn lại bằng flex `h-full`, không hardcode `100dvh`.
- **Page description** — ẩn hoàn toàn (`hidden`) để tiết kiệm space.

### Responsive — Dashboard & Report

- **Tables** — `min-w-[420–540px]` + `overflow-x-auto` → scroll ngang đúng, không bị squeeze trên mobile.
- **Column hiding** — `MemberReport`: ẩn TG di chuyển + Nhiên liệu trên `max-sm`. `TripDetail`: ẩn Start/End time trên `max-sm`, Start/End location trên `max-md`.
- **Pagination** — numbered page buttons `hidden sm:flex`; mobile chỉ giữ `<<` `<` `trang X / tổng` `>` `>>`.
- **`ReportShell` header** — title + DateRangePicker xếp dọc trên mobile thay vì wrap xấu.

---

## [1.0.5] - 2026-05-05

### Added

- **`HistoryRouteResponse`** type mới — phản ánh đúng response thực tế của `/gps-tracking/history` (object có `trackingData` + pagination), thay vì union `array | object` cũ.
- **Top-level `dist/index.d.ts` barrel** — `package.json#types` từ `./dist/src/index.d.ts` về `./dist/index.d.ts` chuẩn để IDE/TS plugin pick up IntelliSense ổn định hơn.
- **Auto-spider cho overlapping markers** — các member ở cùng toạ độ (group 2–8) tự động fan out ra spider khi map idle/zoom xong, không cần click. Spider reproject từ lat/lng mỗi animation frame (`map.on('move')` + RAF throttle). Group > 8 vẫn dùng click-to-spider cũ. Prop `interactive?: boolean` mới trên `SpiderOverlay` (default `true`).
- **Selected marker visual indicator** — marker được chọn có viền xanh dày (4px), kích thước to hơn ~40%, halo glow ring bên dưới. Prop `activeUserId` mới trên `SpiderOverlay`.
- **Selected member không bị cluster** — 2-source architecture: `dc-members` (cluster: true) chứa tất cả trừ `activeUserId`; `dc-selected` (cluster: false) chứa riêng member đang chọn.

### Performance

- **LiveMap spider recompute O(1)** — dùng `Map<userId, member>` thay vì `Array.find` O(n); `Set<string>` per-group để dedup; bail-out shallow compare trên `setAutoSpiderGroups`.
- **Spider RAF dedup** — `scheduleRecompute` gộp `idle + moveend` thành 1 RAF; `map.on('move')` skip RAF khi không có spider groups.
- **SpiderOverlay positions[] compute once** — `spokePos()` tính 1 lần per member, dùng chung cho SVG line lẫn avatar button.

### Fixed

- **RAF memory leak** — `recomputeRafId` và `rafId` hoist ra outer scope → `cancelAnimationFrame` trong cleanup hoạt động đúng.
- **`prepublishOnly` build sai target** — từ `npm run build` (demo app) → `npm run build:lib` (thư viện).
- **vgl-loader race condition** — check `readyState === 'complete'` và call `ok()` ngay nếu script đã load; thêm `error` listener.
- **History total duration âm** — `.sort((a, b) => a.time - b.time)` trong `LiveMapController.getHistoryRoute()`.
- **HTTP timeout** — 30s → 10s.
- **`queryRenderedFeatures` type error** — `geometry` thành optional.
- **`tsconfig.build.json`** — bật `strict: true` + `"ignoreDeprecations": "6.0"`.
- **Popup + selection persists when opening history** — `openHistory` tự xử lý popup teardown, giữ `activeUserId` xuyên suốt.
- **API contract alignment** — fix `reportType` literals (snake_case), `MemberRow` fields, `GpsPoint.metadata` polymorphic type, `getLastLocation` wrapper branch, `getHistoryRoute` array fallback.

---

## [1.0.4] - 2026-05-05

### Added

- **Auth error overlay (401/403)** — axios interceptor bắt 401/403, emit qua event bus; `FleetworkProvider` render overlay block UI với message từ backend (priority: `message` → `status` → `detail` → `error` → `errors[0]`). Đóng bằng × / Esc / click backdrop. 401 có nút "Tải lại trang". 3 props customize: `onAuthError(event)`, `disableAuthErrorOverlay`, `renderAuthError(event, dismiss)`. Export `subscribeAuthError` + type `AuthErrorEvent`.
- **`memberNameKey` provider-level** — promote từ per-component lên `<FleetworkProvider memberNameKey="...">` để Dashboard MemberReport, Report tables, LiveMap markers tất cả đồng nhất hiển thị tên từ `metaData[key]`. Per-component prop vẫn override Provider. Helper `resolveMemberName(metaData, key, fallback)` exported.

---

## [1.0.3] - 2026-05-05

### Rewrite — shadcn/ui + Tailwind CSS v4, no TanStack Query

#### Added

- **shadcn/ui** full component set — Tailwind CSS v4, CSS variable theming
- **Dashboard** — `SummaryCards`, `MemberReport`, `ActivityHeatmap` (24×7 grid, 6-step gradient), `FuelTracking` (LineChart), `MonthlyExpenses` (BarChart stacked)
- **LiveMap** — VietmapGL CDN lazy loader, React popup portalled, HistoryPanel redesign (stats 2 cột, timeline bar, date nav, collapsible stop groups), history auto-switch khi click member khác
- **Report** — home screen 3 cards, sticky header/footer, `DateRangePicker` 2 tháng song song với confirm button, `DatePicker`, `ReportShell`, `PaginationBar` với ellipsis, `DateRangeBar`
- **Hooks** — thuần `useState/useEffect`, `useStableDefault` fix infinite loop, skeleton delay 150ms, giữ stale data khi refetch
- **i18n** — tiếng Việt đầy đủ, bao gồm `history.*`, `expenses.*`, `reports.*`
- **AuthErrorOverlay** component, `auth-events.ts` event bus, `AuthErrorEvent` type
- **`vite-plugin-dts`** — TypeScript declaration generation, `dist/styles.css.d.ts` stub, `tsconfig.build.json`

#### Changed

- Bỏ TanStack Query — không cần `QueryClientProvider`
- `FleetworkProvider` không có `apiKeyTilemap` — truyền trực tiếp vào `<LiveMap>`
- Externalize tất cả runtime deps trong vite config — tránh `require()` polyfill inject từ Rolldown
- Bundle size: ESM ~32 KB gzip, CSS ~12 KB gzip
- `DateRangePicker` bỏ step indicator, dùng Calendar `mode="range"` trực quan hơn
- Default base URL: `https://app.fleetwork.vn/api/v1`

#### Fixed

- `require("react")` lỗi ở consumer browser — externalize toàn bộ runtime deps
- CSS không output — thêm `import './index.css'` vào lib entry
- Types empty `export {}` — tắt `rollupTypes`/`insertTypesEntry`
- `import.meta.env.DEV` type error trong dts — thêm `"types": ["vite/client"]`
- `TS2882` styles.css module not found — emit `dist/styles.css.d.ts` stub
- Popup double border/rounded — strip VietmapGL native CSS chrome
- Infinite API spam khi mount — `useStableDefault` cho time-based defaults
- HistoryPanel không reload khi switch member — fix `useEffect` deps + `key={member.userId}`
- Report duplicate constants gây parse error

---

## [1.0.2] - 2026-04-29

### Changed

- Bump version, cập nhật CHANGELOG.

---

## [1.0.1] - 2026-04-29

### Added

- **LiveMap** — GeoJSON clustering (3000+ markers, GL circle layers, không DOM nodes)
- **LiveMap** — Spiderfy: click 2+ markers cùng toạ độ fan out radial với SVG lines
- **LiveMap** — `maxUsers`, `clusterRadius`, `clusterMaxZoom` props
- **LiveMap** — Infinite-scroll sidebar (50 rows/batch, IntersectionObserver), sort by status (moving → stopped → signal lost)
- **LiveMap** — `SpiderOverlay` component với circular member layout
- **Report** — Pagination bar đầy đủ (first/last/prev/next + numbered pages với ellipsis)
- **Report** — Row numbers (`#` index column), zebra striping, sticky totals row
- **Report** — `getPageNumbers` utility với ellipsis logic

### Changed

- LiveMap: DOM portal markers → VietmapGL native GL layers (lower memory + paint cost)
- `fitBounds` chỉ chạy lần đầu load, poll updates không reset viewport
- Consistent number formatting cho distance, time, cost trong report tables

### Fixed

- Sidebar poll update không shuffle vị trí member (sort stable sau filter)
- `MapInstance` type: thêm `queryRenderedFeatures` và `project` methods
- `GetMembersOptions` pageSize customizable

---

## [1.0.0] - 2025-12-01

### Added

- Initial release: `FleetworkProvider`, `Dashboard`, `LiveMap`, `Report`
- Framework-agnostic controllers: `LiveMapController`, `DashboardController`, `ReportController`
- Hooks: `useSummaryCards`, `useMemberReport`, `useActivityHeatmap`, `useFuelTracking`, `useMonthlyExpenses`, `useMembers`, `useMember`, `useHistoryRoute` và tất cả report hooks
- VietmapGL-backed map với real-time member positions, history playback, tile switcher
- Theming qua `ThemeConfig` CSS variable overrides
- i18n: `vi` + `en` locales
- MIT License
