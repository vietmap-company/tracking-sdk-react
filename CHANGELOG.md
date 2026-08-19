# Changelog

All notable changes to `@vietmap/tracking-sdk-react` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.11] - 2026-08-19

### Added

- **Prop `routeColors` trên `<LiveMap>`** — tuỳ chỉnh màu tuyến lịch sử: `{ traveled?, remaining?, raw? }` (mặc định xanh `#3b82f6` / xám `#888888` / cam `#ff7f0e`). Đổi giá trị khi đang xem sẽ vẽ lại tuyến ngay với màu mới, giữ nguyên vị trí playback; lớp raw chỉ vẽ lại khi đang bật. Type mới `HistoryRouteColors` được export.

---

## [1.0.10] - 2026-07-23

### Added

- **Theme mới — shadcn slate (oklch)** cho cả light lẫn dark, chart palette 5 màu chuẩn. **Dark mode class-based**: app chỉ cần toggle class `.dark` trên `<html>` (`@custom-variant dark`) là toàn bộ SDK components + charts đổi theo. Thêm `tw-animate-css` để các animation `animate-in`/`fade-in` hoạt động thực sự trên Tailwind v4.
- **Marker LiveMap kiểu avatar** — hiện **2 chữ cái đầu tên** trong circle (to hơn: r=14/15) + **label tên trong pill trắng** bên dưới (canvas 9-slice + `icon-text-fit`, tự giãn theo độ dài tên). Marker được chọn: glow + ring mảnh **cùng màu status** + viền trắng (thay viền xanh dày cũ), label luôn hiện.
- **`HttpService`** (export mới) — `get/post/put/delete` trả thẳng `data`, dùng client đã có sẵn API key + error handling; cho consumer gọi endpoint tuỳ chỉnh.
- **Chọn nguồn tuyến lịch sử — option `dataSource`** trên `LiveMapController.getHistoryComparison()` / `getHistoryRoute()` (qua `GetHistoryOptions`): `"raw"` (bỏ map-matching), `"both"` (đối chiếu raw vs enriched), `"merged"` (ghép liền không hở), hoặc bỏ trống/`null` để **không gửi** `DataSource` cho backend tự chọn (ưu tiên enriched, fallback raw). `HistoryRoute` thêm field `dataSource` echo lại mode đã dùng. Type mới `HistoryDataSource`.
- **Prop `dataSource` trên `<LiveMap>`** — truyền thẳng xuống panel lịch sử; đổi giá trị sẽ tự fetch lại tuyến, giữ nguyên ngày đang chọn.
- **`mergeSegmentsByIndex(segments)`** — helper thuần được export, gộp các `enrichedSegments` trùng `segmentIndex` thành một segment (nối điểm theo thứ tự mảng, không sort theo thời gian). SDK tự gộp trước khi vẽ.
- **Vẽ lịch sử theo segment** — cả tuyến "đã đi" (xanh) lẫn "còn lại" (xám) cắt theo ranh giới segment nên không có đường "chim bay"; các segment dùng **một màu thống nhất**.
- **Marker chuyển tiếp 🔄** ở ranh giới segment (hover hiện time-gap) — **mặc định ẩn**, bật qua prop `showTransitionMarkers` trên `<LiveMap>`.
- **Lọc LiveMap theo status** — prop `statusFilter?: MemberStatusKind[]` (controlled) và method imperative `LiveMapRef.setStatusFilter()` / `getStatusFilter()` (uncontrolled). Filter áp lên cả marker, sidebar và `getMembers()`.
- **`QueryResult.isFetching`** — `true` mỗi khi có request đang chạy, kể cả refetch nền (đổi trang/sort/filter/khoảng ngày) khi data cũ vẫn hiển thị. `isLoading` vẫn chỉ báo lần tải đầu.

### Changed

- **HTTP layer tách module `lib/http/`** — `axios-client.ts` (factory + interceptors: dev tracing có seq/timing/cảnh báo request **DUP**, normalize lỗi, phát auth event 401/403), `registry.ts` (global client), `service.ts` (HttpService). Import path `@/lib/http` và mọi export cũ giữ nguyên.
- **Controllers tách file, khử trùng lặp** — `controllers/shared.ts` (resolveClient, cleanIds, chunk, paginate dùng chung), `livemap/members.ts` + `livemap/history.ts`, `report/request.ts`; `LiveMapController`/`ReportController`/`DashboardController` thành facade mỏng. **Public API không đổi.**
- **Skeleton loading bảng nhất quán** — refetch (đổi trang/sort/filter) hiện lại **skeleton giống lần tải đầu** trên cả 5 bảng report lẫn `MemberReport`; spinner cạnh tiêu đề khi có request chạy (`ReportShell` nhận prop `loading`). Cờ `skeletonOnRefetch` phân biệt refetch do người dùng với **poll tick** (giữ data cũ, không nháy mỗi nhịp). Số skeleton rows **khớp số dòng đang hiển thị** (fallback `pageSize`) thay vì hardcode.
- **`enrichedSegments` không còn sort theo thời gian** — giữ nguyên thứ tự mảng (thứ tự không gian) để tránh zigzag ở dữ liệu map-matching có nhiều điểm cùng timestamp.
- `useChartColors` đọc `--border`/`--muted-foreground`/`--popover` thay vì hardcode màu light — lưới/trục/tooltip của chart tự theo dark mode.
- Prop `theme.fontFamily` (`--dc-font`) giờ thực sự áp vào `.fleetwork-root` (trước đây set var nhưng không nơi nào dùng).

### Fixed

- **Text trên map không render** — font mặc định của MapLibre (`Open Sans`) trả 400 trên font server Vietmap nên số đếm cluster / badge "+N" trước giờ không hiển thị; mọi symbol layer chuyển sang `Noto Sans Regular/Bold` (đã verify). Style **satellite** thiếu `glyphs` cũng đã bổ sung — text hiện được trên mọi tile.
- **Marker đè nhau nhưng chữ của marker bị đè nổi lên trên** — đồng bộ thứ tự vẽ bằng `circle-sort-key`/`symbol-sort-key` + cho initials/badge tham gia collision: marker bị đè thì chữ + label **tự ẩn**, marker trên cùng giữ đủ chữ.
- **Label ẩn rồi fade lại từ từ khi chọn/bỏ chọn marker** — tắt `fadeDuration` (300ms mặc định) của symbol placement; label giờ hiện tức thì.
- `refetch` từ hooks được bọc lại — gắn thẳng vào `onClick` không còn làm event object lọt vào tham số nội bộ.

---

## [1.0.9] - 2026-06-30

### Added

- **So sánh quỹ đạo gốc vs đã làm mượt trên LiveMap** — request `gps-tracking/history` tự thêm `DataSource=both`. Nếu backend trả cả hai, LiveMap vẽ 2 đường: xám `#888` nét liền (enriched / map-matched, dùng cho playback) + cam `#ff7f0e` nét đứt (GPS gốc), kèm legend góc trên-trái.
- **Vẽ route đúng cách — tránh đường "chim bay"** — đường enriched được vẽ qua `enrichedSegments[]` (GeoJSON `MultiLineString`), mỗi segment là một polyline độc lập; các khoảng trống do matcher cắt không bị nối thẳng.
- **`LiveMapController.getHistoryComparison()`** — method mới trả về `HistoryRoute` (`points` / `rawPoints` / `enrichedPoints` / `enrichedSegments` / `enriched`). Fallback: ưu tiên flatten segments → `enrichedData` → `trackingData` → `rawData`. `getHistoryRoute()` cũ giữ nguyên chữ ký.
- **Nút bật/tắt GPS gốc (RAW) trên thanh playback** — khi lịch sử có kèm dữ liệu raw, hiện nút `RAW` để ẩn/hiện lớp GPS gốc (cam nét đứt) chồng lên đường đã map-matched; mặc định hiện. Props mới `showRawRoute` / `onRawRouteToggle` trên `PlaybackControls`.

### Changed

- **Type `HistoryRouteResponse`** bổ sung `enriched`, `enrichedSegments`, `rawData`, `enrichedData` (đều optional/nullable); thêm type `EnrichedSegment` và `HistoryRoute`.
- **Màu route** theo đúng quy ước API: enriched/remaining = xám `#888`, raw = cam `#ff7f0e` nét đứt, traveled (playback overlay) = xanh `#3b82f6`.

---

## [1.0.8] - 2026-06-24

### Fixed

- **LiveMap không còn đè pan/zoom của người dùng** — auto-fit chỉ chạy 1 lần ở lần tải đầu và tự khoá ngay khi người dùng pan/zoom/xoay bản đồ, nên các lần poll members sau không kéo viewport về fit-all nữa. Thêm prop `autoFit` (mặc định `true`) để tắt hẳn nếu muốn giữ `center`/`zoom`.
- **LiveMap hết lỗi `The layer 'dc-clusters' does not exist`** — mọi `queryRenderedFeatures` (click/hover/recompute spider) đi qua helper chỉ truy vấn layer đang tồn tại trong style; tránh crash khi tương tác lúc cluster layer chưa kịp add (ngay sau đổi tile/`setStyle` hoặc trước khi members tải xong).

### Added

- **Lọc `userIds` cho toàn bộ Dashboard & Report** — prop `userIds` trên `<Dashboard>` (thread xuống **cả 5 widget**: SummaryCards, MemberReport, ActivityHeatmap, FuelTracking, MonthlyExpenses) và `<Report>`. Mọi widget/hook dashboard (`useSummaryCards`, `useMemberReport`, `useActivityHeatmap`, `useFuelTracking`, `useMonthlyExpenses`) và report summary hook đều nhận `userIds`. Lọc nhiều user server-side; vượt 1000 id tự tách call rồi gộp.
- **Drill-down báo cáo theo user** — bảng Tổng hợp (Hành trình/Nhiên liệu) có cột "Thao tác" với nút Xem chi tiết (👁); click 1 user mở trang chi tiết riêng của user đó. `TripDetailReport`/`FuelDetailReport` nhận thêm `userId`, `userName`; summary view nhận `onUserClick`.

### Changed

- **Toàn bộ Dashboard + LiveMap + Report summary chuyển sang POST (body)** — `gps-tracking/users`, tất cả `dashboard/gps-manager/*` (summary, users, activity-heatmap, fuel-tracking, monthly-costs), `reports/trip/summary`, `reports/fuel/summary`. Báo cáo chi tiết (`trip/detail`, `fuel/detail`), `reports/activity-time`, history/latest vẫn GET; chi tiết lọc 1 user qua `userId`.
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
