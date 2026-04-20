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

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
