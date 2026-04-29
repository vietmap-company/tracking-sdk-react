import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function startOfTodayMs(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfYearMs(year = new Date().getFullYear()): number {
  return new Date(year, 0, 1, 0, 0, 0, 0).getTime()
}

export function endOfYearMs(year = new Date().getFullYear()): number {
  return new Date(year, 11, 31, 23, 59, 59, 999).getTime()
}

export function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

/** Generate page number array with ellipsis — mirrors driver-connect getPageNumbers */
export function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

// ─── Chart theme colors ───────────────────────────────────────────────────────
// Reads resolved CSS custom-property values from .fleetwork-root so recharts
// always uses the active theme palette instead of hardcoded hex values.
function readVar(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback
}

export interface ChartColors {
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  grid: string
  axisTick: string
  tooltipBorder: string
  tooltipBg: string
}

export function useChartColors(): ChartColors {
  return React.useMemo(() => {
    const el =
      (typeof document !== 'undefined' &&
        (document.querySelector('.fleetwork-root') as HTMLElement | null)) ||
      null
    if (!el) {
      return {
        chart1: 'oklch(0.646 0.222 41.116)',
        chart2: 'oklch(0.6 0.118 184.704)',
        chart3: 'oklch(0.398 0.07 227.392)',
        chart4: 'oklch(0.828 0.189 84.429)',
        chart5: 'oklch(0.769 0.188 70.08)',
        grid: 'oklch(0.92 0.01 255.508)',
        axisTick: 'oklch(0.554 0.046 257.417)',
        tooltipBorder: 'oklch(0.92 0.01 255.508)',
        tooltipBg: 'oklch(1 0 0)',
      }
    }
    return {
      chart1: readVar(el, '--chart-1', 'oklch(0.646 0.222 41.116)'),
      chart2: readVar(el, '--chart-2', 'oklch(0.6 0.118 184.704)'),
      chart3: readVar(el, '--chart-3', 'oklch(0.398 0.07 227.392)'),
      chart4: readVar(el, '--chart-4', 'oklch(0.828 0.189 84.429)'),
      chart5: readVar(el, '--chart-5', 'oklch(0.769 0.188 70.08)'),
      grid: readVar(el, '--border', 'oklch(0.92 0.01 255.508)'),
      axisTick: readVar(el, '--muted-foreground', 'oklch(0.554 0.046 257.417)'),
      tooltipBorder: readVar(el, '--border', 'oklch(0.92 0.01 255.508)'),
      tooltipBg: readVar(el, '--card', 'oklch(1 0 0)'),
    }
  }, [])
}
