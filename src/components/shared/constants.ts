import type { MemberStatusKind } from '@/lib/types'

/** Avatar bg color */
export const STATUS_AVATAR_BG: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-500',
  stopped:     'bg-amber-400',
  signal_lost: 'bg-slate-400',
}

/**
 * Badge className — rounded-full pill, subtle bg+border.
 * Used in MemberReport table, Popup, MemberList.
 */
export const STATUS_BADGE: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  stopped:     'bg-amber-50  text-amber-700  border-amber-200',
  signal_lost: 'bg-slate-50  text-slate-500  border-slate-200',
}

/** Dot bg — used in MemberList item, MemberAvatar */
export const STATUS_DOT: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]',
  stopped:     'bg-amber-400  shadow-[0_0_0_2px_rgba(251,191,36,0.2)]',
  signal_lost: 'bg-slate-400',
}

/** Plain dot — used in summary counters */
export const STATUS_SUMMARY_DOT: Record<string, string> = {
  moving:      'bg-emerald-500',
  stopped:     'bg-amber-500',
  signal_lost: 'bg-slate-400',
}

/** Status dot color inside popup — no shadow */
export const STATUS_DOT_PLAIN: Record<MemberStatusKind, string> = {
  moving:      'bg-emerald-500',
  stopped:     'bg-amber-400',
  signal_lost: 'bg-slate-400',
}

/** Underline tab trigger */
export const TAB_TRIGGER_CLS =
  'h-9 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm'
