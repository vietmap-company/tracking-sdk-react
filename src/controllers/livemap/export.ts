import { buildXlsx, downloadBlob, type XlsxCell } from "@/lib/xlsx";
import { getMembers, type GetMembersOptions } from "./members";
import type { MemberStatus, MemberStatusKind } from "@/lib/types";

export interface ExportMembersOptions extends GetMembersOptions {
  /** Chỉ xuất các trạng thái này. Bỏ trống / mảng rỗng = xuất tất cả. */
  statuses?: MemberStatusKind[];
  /** Tên file khi tải về. Mặc định `members_<trạng thái>_<yyyyMMdd_HHmm>.xlsx`. */
  fileName?: string;
}

const STATUS_LABELS: Record<MemberStatusKind, string> = {
  moving: "Đang di chuyển",
  stopped: "Dừng",
  signal_lost: "Mất tín hiệu",
};

const fmtDateTime = (ts: number): string =>
  new Date(ts).toLocaleString("vi-VN", { hour12: false });

/** Số giờ từ lần cuối nhận tín hiệu tới giờ, làm tròn 2 chữ số. */
const hoursSince = (ts?: number): number | null =>
  ts ? Math.round(((Date.now() - ts) / 3_600_000) * 100) / 100 : null;

/** Nhóm khoảng thời gian mất tín hiệu (chỉ cho user signal_lost). */
function lostBucket(m: MemberStatus): string {
  if (m.status !== "signal_lost") return "";
  const h = hoursSince(m.lastSeenAt);
  if (h == null) return "";
  if (h < 1) return "< 1 giờ";
  if (h < 3) return "1–3 giờ";
  if (h < 6) return "3–6 giờ";
  if (h < 12) return "6–12 giờ";
  if (h < 24) return "12–24 giờ";
  return "> 24 giờ";
}

// Tên cột tiếng Việt cho các key metadata quen thuộc (khớp mẫu báo cáo);
// key lạ sẽ dùng thẳng tên key làm header.
const META_LABEL: Record<string, string> = {
  fullName: "Họ tên",
  id: "Mã NV",
  buTitleLevel: "Cấp bậc",
};
const META_PRIORITY = ["fullName", "id", "buTitleLevel"];
const META_SKIP = new Set(["userAvatar"]);

/** Gom union các key metadata qua toàn bộ member (known trước, còn lại a→z). */
function collectMetaKeys(rows: MemberStatus[]): string[] {
  const seen = new Set<string>();
  for (const m of rows)
    for (const k of Object.keys(m.metadata ?? {})) if (!META_SKIP.has(k)) seen.add(k);
  const known = META_PRIORITY.filter((k) => seen.has(k));
  const rest = [...seen].filter((k) => !META_PRIORITY.includes(k)).sort();
  return [...known, ...rest];
}

/** Chuỗi số → number để Excel canh phải + sort đúng (vd Mã NV, Cấp bậc). */
const metaVal = (v?: string): XlsxCell =>
  v == null ? null : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;

export function filterByStatuses(
  members: MemberStatus[],
  statuses?: MemberStatusKind[],
): MemberStatus[] {
  if (!statuses?.length) return members;
  const allowed = new Set(statuses);
  return members.filter((m) => allowed.has(m.status));
}

/**
 * Dựng workbook 2 sheet theo format báo cáo chuẩn:
 *   - "Tổng quan" — cặp Chỉ số / Giá trị (tổng số, đếm theo trạng thái,
 *     trạng thái lọc, thời điểm xuất)
 *   - "Chi tiết"  — mỗi member một dòng
 */
export function buildMembersWorkbook(
  members: MemberStatus[],
  statuses?: MemberStatusKind[],
): Blob {
  const rows = filterByStatuses(members, statuses);
  const count = (s: MemberStatusKind) =>
    rows.filter((m) => m.status === s).length;
  const metaKeys = collectMetaKeys(rows);

  const overview: XlsxCell[][] = [
    ["Chỉ số", "Giá trị"],
    ["Tổng số nhân viên", rows.length],
    ["Đang di chuyển", count("moving")],
    ["Dừng", count("stopped")],
    ["Mất tín hiệu", count("signal_lost")],
    [
      "Trạng thái lọc",
      statuses?.length
        ? statuses.map((s) => STATUS_LABELS[s]).join(", ")
        : "Tất cả",
    ],
    ["Thời điểm xuất", fmtDateTime(Date.now())],
  ];

  const detail: XlsxCell[][] = [
    [
      "STT",
      "User ID",
      ...metaKeys.map((k) => META_LABEL[k] ?? k),
      "Trạng thái",
      "Status code",
      "Lần cuối nhận tín hiệu",
      "Số giờ mất tín hiệu",
      "Vĩ độ (lat)",
      "Kinh độ (lng)",
      "Tốc độ (km/h)",
      "Hướng (heading)",
      "Nhóm thời gian mất tín hiệu",
    ],
    ...rows.map((m, i): XlsxCell[] => [
      i + 1,
      m.userId,
      ...metaKeys.map((k) => metaVal(m.metadata?.[k])),
      m.statusLabel || STATUS_LABELS[m.status],
      m.statusCode ?? null,
      m.lastSeenAt ? fmtDateTime(m.lastSeenAt) : null,
      m.status === "signal_lost" ? hoursSince(m.lastSeenAt) : null,
      m.lat || null,
      m.lng || null,
      m.speed ?? null,
      m.heading ?? null,
      lostBucket(m),
    ]),
  ];

  return buildXlsx([
    { name: "Tổng quan", rows: overview },
    { name: "Chi tiết", rows: detail },
  ]);
}

// Slug không dấu cho tên file — tránh ký tự có thể bị OS/trình duyệt strip
// hoặc hiển thị lỗi trên một số hệ thống Windows cũ.
const STATUS_SLUGS: Record<MemberStatusKind, string> = {
  moving: "dang-di-chuyen",
  stopped: "dung",
  signal_lost: "mat-tin-hieu",
};

function defaultFileName(statuses?: MemberStatusKind[]): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  // yyyy-MM-dd_HHmm — vừa dễ đọc vừa sort đúng thứ tự thời gian khi liệt kê file.
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const scope = statuses?.length
    ? statuses.map((s) => STATUS_SLUGS[s]).join("_")
    : "tat-ca";
  return `danh-sach-nhan-vien_${scope}_${stamp}.xlsx`;
}

/** Dựng workbook từ danh sách member CÓ SẴN rồi tải về luôn (không fetch).
 *  UI dùng hàm này để xuất đúng data đang hiển thị trên màn hình. */
export function downloadMembersWorkbook(
  members: MemberStatus[],
  statuses?: MemberStatusKind[],
  fileName?: string,
): void {
  downloadBlob(
    buildMembersWorkbook(members, statuses),
    fileName ?? defaultFileName(statuses),
  );
}

/** Fetch danh sách member rồi dựng file Excel. Trả Blob — caller tự quyết
 *  tải về, upload hay xử lý tiếp. Dùng được ngoài React (script, Node có Blob). */
export async function exportMembers(
  options: ExportMembersOptions = {},
): Promise<Blob> {
  const { statuses, fileName: _ignored, ...fetchOptions } = options;
  const members = await getMembers(fetchOptions);
  return buildMembersWorkbook(members, statuses);
}

/** Như {@link exportMembers} nhưng tải thẳng file về máy (browser only). */
export async function downloadMembersExport(
  options: ExportMembersOptions = {},
): Promise<void> {
  const blob = await exportMembers(options);
  downloadBlob(blob, options.fileName ?? defaultFileName(options.statuses));
}
