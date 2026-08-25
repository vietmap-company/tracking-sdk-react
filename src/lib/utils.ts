import { useMemo } from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Structural equality cho payload API (object/array của primitive). Dùng để
 * bỏ qua re-render khi poll trả về dữ liệu y hệt — không kéo thêm dependency.
 * Không xử lý Map/Set/Date lồng (payload SDK là JSON thuần nên không cần).
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;
  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    const x = a as unknown[];
    const y = b as unknown[];
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) if (!deepEqual(x[i], y[i])) return false;
    return true;
  }
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  if (keys.length !== Object.keys(y).length) return false;
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(y, k)) return false;
    if (!deepEqual(x[k], y[k])) return false;
  }
  return true;
}

export function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfYearMs(): number {
  const d = new Date(new Date().getFullYear(), 0, 1);
  return d.getTime();
}

export function endOfYearMs(): number {
  const d = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
  return d.getTime();
}

export function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
}

/** Kiểu màu chart trả về từ {@link useChartColors} — dùng cho các chart body
 *  lazy nhận colors qua prop. */
export type ChartColors = ReturnType<typeof useChartColors>

/** Stable chart color tokens — CSS variable backed, theme-aware.
 * Memo hoá theo tín hiệu dark/preset (đọc chuỗi rẻ, không layout flush) nên
 * chỉ chạy `getComputedStyle` khi theme đổi, không phải mỗi render. */
export function useChartColors() {
  // Tín hiệu rẻ để invalidate memo khi đổi light/dark hoặc preset.
  const signal =
    typeof document !== "undefined"
      ? `${document.documentElement.classList.contains("dark") ? "d" : "l"}:${
          document
            .querySelector("[data-fleetwork-root]")
            ?.getAttribute("data-preset") ?? ""
        }`
      : "";
  return useMemo(() => {
    const style =
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement)
        : null;
    const v = (name: string, fallback: string) =>
      style?.getPropertyValue(name).trim() || fallback;
    return {
      chart1: v("--chart-1", "#6366f1"),
      chart2: v("--chart-2", "#10b981"),
      chart3: v("--chart-3", "#f59e0b"),
      chart4: v("--chart-4", "#3b82f6"),
      chart5: v("--chart-5", "#ec4899"),
      grid: v("--border", "oklch(0.908 0.008 248)"),
      axisTick: v("--muted-foreground", "oklch(0.52 0.015 252)"),
      tooltipBg: v("--popover", "oklch(1 0 0)"),
      tooltipBorder: v("--border", "oklch(0.908 0.008 248)"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);
}

export function formatDateTime(ts: number, locale: string = "vi-VN"): string {
  return new Date(ts).toLocaleString(locale);
}

export function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (page > 3) pages.push('...')
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
  if (page < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
}
