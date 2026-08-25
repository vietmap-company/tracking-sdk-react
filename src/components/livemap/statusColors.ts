import type { MemberStatusKind } from '@/lib/types'

/**
 * Nguồn màu trạng thái DUY NHẤT cho LiveMap — dùng chung cho cả lớp GL (cần
 * hex) lẫn class Tailwind. Theo quy ước ngữ nghĩa cố định (emerald = đang chạy,
 * amber = dừng, slate = mất tín hiệu) để ý nghĩa không đổi khi swap theme.
 */
export const STATUS_HEX: Record<MemberStatusKind, string> = {
  moving: '#10b981', // emerald-500
  stopped: '#f59e0b', // amber-500
  signal_lost: '#94a3b8', // slate-400
}

/** Class Tailwind nền tròn (legend, chấm nhỏ). */
export const STATUS_BG: Record<MemberStatusKind, string> = {
  moving: 'bg-emerald-500',
  stopped: 'bg-amber-500',
  signal_lost: 'bg-slate-400',
}

/**
 * Biểu thức MapLibre `match` theo `status` → hex, xây từ {@link STATUS_HEX}
 * để GL layer và class Tailwind không bao giờ lệch nhau.
 */
export const STATUS_COLOR_EXPR: unknown[] = [
  'match',
  ['get', 'status'],
  'moving',
  STATUS_HEX.moving,
  'stopped',
  STATUS_HEX.stopped,
  STATUS_HEX.signal_lost, // fallback = signal_lost
]
