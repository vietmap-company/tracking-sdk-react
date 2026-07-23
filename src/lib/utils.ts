import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

/** Stable chart color tokens — CSS variable backed, theme-aware */
export function useChartColors() {
  // Read from CSS variables so they follow shadcn theme automatically
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
    // Follow the theme (light AND dark) instead of hardcoded light values.
    grid: v("--border", "oklch(0.908 0.008 248)"),
    axisTick: v("--muted-foreground", "oklch(0.52 0.015 252)"),
    tooltipBg: v("--popover", "oklch(1 0 0)"),
    tooltipBorder: v("--border", "oklch(0.908 0.008 248)"),
  };
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
