import type { CSSProperties, ReactNode } from "react";
import type { HistoryDataSource, HistoryRoute, HistoryTrackBy, MemberStatus, MemberStatusKind, TileType } from "@/lib/types";

export type MapInstance = {
  flyTo: (opts: { center: [number, number]; zoom?: number }) => void;
  jumpTo: (opts: { center: [number, number]; zoom?: number }) => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    opts?: { padding?: number; duration?: number; maxZoom?: number },
  ) => void;
  getZoom: () => number;
  remove: () => void;
  on: (evt: string, handler: (e: unknown) => void) => void;
  off: (evt: string, handler: (e: unknown) => void) => void;
  setStyle: (style: unknown) => void;
  addSource: (id: string, source: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  removeSource: (id: string) => void;
  addLayer: (layer: Record<string, unknown>) => void;
  /** Đăng ký image dùng cho icon-image (pill nền label, …). Optional vì
   *  type này chỉ mô tả phần API SDK dùng tới. */
  addImage?: (
    id: string,
    image: ImageData,
    options?: Record<string, unknown>,
  ) => void;
  hasImage?: (id: string) => boolean;
  getLayer: (id: string) => unknown | undefined;
  removeLayer: (id: string) => void;
  easeTo: (opts: {
    center: [number, number];
    zoom?: number;
    duration?: number;
  }) => void;
  queryRenderedFeatures?: (
    geometry?:
      | [number, number]
      | [[number, number], [number, number]]
      | { layers?: string[] },
    options?: { layers?: string[] },
  ) => Array<{
    layer: { id: string };
    geometry: { type: string; coordinates: unknown };
    properties: Record<string, unknown>;
  }>;
  project?: (lngLat: [number, number]) => { x: number; y: number };
  getCanvas?: () => HTMLCanvasElement;
  getBounds: () => { contains: (lngLat: [number, number]) => boolean };
};

/** Dữ liệu bảng lộ trình vừa tải xong — tham số của `onHistoryLoad`. */
export interface HistoryLoadEvent {
  /** Member đang xem lộ trình. */
  member: MemberStatus;
  /** Ngày đang xem (giờ local). */
  date: Date;
  /** Đầu ngày (ms) — `FromTime` đã gửi lên API. */
  from: number;
  /** Cuối ngày (ms) — `ToTime` đã gửi lên API. */
  to: number;
  /**
   * Kết quả đầy đủ của `LiveMapController.getHistoryComparison` (points,
   * rawPoints, enrichedSegments, routeSummary…). `null` khi request lỗi.
   */
  route: HistoryRoute | null;
  /** Lỗi của request (khi `route` là `null`). */
  error?: Error;
}

/** Màu các đường tuyến khi xem lại lịch sử. Field nào bỏ trống dùng mặc định. */
export interface HistoryRouteColors {
  /** Đoạn đã đi qua (theo playback). Mặc định `#3b82f6` (xanh dương). */
  traveled?: string;
  /** Đoạn còn lại. Mặc định `#888888` (xám). */
  remaining?: string;
  /** Lớp GPS gốc (nét đứt, khi bật RAW). Mặc định `#ff7f0e` (cam). */
  raw?: string;
}

export interface LiveMapProps {
  height?: string;
  center?: [number, number];
  zoom?: number;
  defaultTile?: TileType;
  /** VietMap API key for tile styles */
  apiKeyTilemap: string;
  pollInterval?: number;
  maxUsers?: number;
  /**
   * Restrict the map to these user ids. When provided, only these users are
   * fetched/displayed instead of the whole fleet. Empty or omitted means all
   * users. Ignored when `members` is supplied (caller controls the data).
   */
  userIds?: string[];
  /**
   * Restrict the map/list to members with these statuses. Empty or omitted
   * means all statuses. This is controlled: while set, it wins over any
   * imperative `setStatusFilter` from the ref. Leave it undefined to drive the
   * filter imperatively instead (uncontrolled).
   */
  statusFilter?: MemberStatusKind[];
  /**
   * Which track the history panel requests. Omit (or pass `null`) to let the
   * backend prefer enriched and fall back to raw. Only `"both"` and `"raw"`
   * return a raw track, so the raw-overlay toggle is hidden under `"merged"`.
   */
  dataSource?: HistoryDataSource | null;
  /**
   * Khi click một member, tra lịch sử theo id nào của member đó:
   * `"user"`/`"device"`/`"vehicle"` → dùng **đúng** id đó, không fallback (id
   * rỗng thì kết quả rỗng). **Không set** (mặc định) → đi theo chuỗi ưu tiên
   * `userId` > `vehicleId` > `deviceId`, lấy id đầu tiên có giá trị. Luôn chỉ gửi
   * đúng một id, khớp cách backend lọc lịch sử.
   */
  historyTrackBy?: HistoryTrackBy;
  /**
   * Show the 🔄 markers at each history segment boundary (hover shows the
   * time-gap that made the matcher cut there). Default `false`.
   */
  showTransitionMarkers?: boolean;
  /**
   * Tuỳ chỉnh màu các đường tuyến lịch sử (đã đi / còn lại / GPS gốc).
   * Đổi giá trị khi đang xem sẽ vẽ lại tuyến với màu mới ngay.
   */
  routeColors?: HistoryRouteColors;
  /**
   * Auto-fit the viewport to all members on first data load. Default `true`.
   * It only ever fits once and stops as soon as the user pans/zooms, so polling
   * never overrides the user's view. Set `false` to disable entirely and keep
   * the configured `center`/`zoom`.
   */
  autoFit?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  members?: MemberStatus[];
  memberNameKey?: string;
  showList?: boolean;
  /**
   * Hiện nút xuất Excel trên sidebar nhân viên — xuất theo bộ lọc status
   * đang áp (không lọc = xuất tất cả). Default `true`.
   */
  showExport?: boolean;
  /**
   * Hiện hàng chip lọc theo trạng thái (kèm số đếm) trên sidebar. Chip điều
   * khiển cùng bộ lọc với `statusFilter`/`ref.setStatusFilter`; khi dùng
   * prop `statusFilter` (controlled) chip chỉ hiển thị. Default `true`.
   */
  showStatusFilter?: boolean;
  className?: string;
  style?: CSSProperties;
  /**
   * Tự mở bảng lộ trình (bên phải) của member **đứng đầu sidebar** ngay khi
   * dữ liệu tải lần đầu — sau khi áp `userIds`/`statusFilter`, theo thứ tự
   * sidebar (đang chạy → dừng → mất tín hiệu). Chỉ mở một lần; người dùng đóng
   * thì không tự mở lại. Có `onViewHistory` thì gọi hàm đó thay vì tự mở bảng.
   * Default `false`.
   */
  autoOpenHistory?: boolean;
  onMemberClick?: (member: MemberStatus) => void | boolean;
  onMarkerClick?: (member: MemberStatus) => void | boolean;
  /**
   * **Thay hẳn** hành động "Xem lộ trình". Khi truyền prop này, SDK KHÔNG tự
   * mở bảng lộ trình nữa mà gọi hàm này — áp cho mọi đường mở: nút "Xem lộ
   * trình" trên popup, bấm member khác khi đang xem lộ trình, và
   * `autoOpenHistory`. Muốn vẫn mở bảng lộ trình mặc định của SDK (vd. sau khi
   * tự xử lý, hoặc chỉ cho một số member) thì gọi `openDefault()`.
   *
   *     onViewHistory={(m) => navigate(`/routes/${m.userId}`)}      // trang riêng
   *     onViewHistory={(m, openDefault) => { track(m); openDefault() }} // làm thêm rồi mở bảng SDK
   */
  onViewHistory?: (member: MemberStatus, openDefault: () => void) => void;
  /**
   * Gọi mỗi khi bảng lộ trình tải xong dữ liệu: lần mở đầu, đổi ngày, đổi
   * `dataSource`/`historyTrackBy`. Nhận đúng object lịch sử mà bảng đang hiển
   * thị (xem {@link HistoryLoadEvent}) — không cần gọi API lần nữa.
   */
  onHistoryLoad?: (event: HistoryLoadEvent) => void;
  onMapClick?: (lngLat: [number, number]) => void;
  onMapReady?: (map: MapInstance) => void;
  renderMemberItem?: (
    member: MemberStatus,
    defaultRender: ReactNode,
  ) => ReactNode;
  renderMarkerPopup?: (member: MemberStatus) => ReactNode;
}

export interface LiveMapRef {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  focusMember: (userId: string) => void;
  getMembers: () => MemberStatus[];
  getMap: () => MapInstance | null;
  /**
   * Imperatively filter the map/list by status. Pass an empty array (or
   * `undefined`) to clear. Ignored while the `statusFilter` prop is set
   * (controlled mode).
   */
  setStatusFilter: (statuses?: MemberStatusKind[]) => void;
  /** The status filter currently in effect (prop or imperative). */
  getStatusFilter: () => MemberStatusKind[] | undefined;
}
