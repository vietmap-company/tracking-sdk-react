import type { AxiosInstance } from 'axios'
import { getGlobalClient, request } from '@/lib/http'
import { startOfTodayMs } from '@/lib/utils'
import type {
  ActivityHeatmapData,
  FuelGroupBy,
  FuelTrackingData,
  MemberReportData,
  MonthlyExpensesData,
  SummaryCardsData,
} from '@/lib/types'

export interface GetSummaryOptions {
  date?: number
  client?: AxiosInstance
}

export interface GetMemberReportOptions {
  page?: number
  pageSize?: number
  client?: AxiosInstance
}

export interface GetFuelOptions {
  groupBy?: FuelGroupBy
  client?: AxiosInstance
}

export interface GetExpensesOptions {
  currency?: string
  client?: AxiosInstance
}

function client(opts?: { client?: AxiosInstance }): AxiosInstance {
  return opts?.client ?? getGlobalClient()
}

export const DashboardController = {
  async getSummaryCards(
    options: GetSummaryOptions = {}
  ): Promise<SummaryCardsData> {
    const date = options.date ?? startOfTodayMs()
    return request<SummaryCardsData>(client(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/summary',
      params: { date },
    })
  },

  async getMemberReport(
    date: number = startOfTodayMs(),
    options: GetMemberReportOptions = {}
  ): Promise<MemberReportData> {
    return request<MemberReportData>(client(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/employees',
      params: {
        date,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 10,
      },
    })
  },

  async getActivityHeatmap(
    from: number,
    to: number,
    options: { client?: AxiosInstance } = {}
  ): Promise<ActivityHeatmapData> {
    return request<ActivityHeatmapData>(client(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/activity-heatmap',
      params: { from, to },
    })
  },

  async getFuelTracking(
    from: number,
    to: number,
    options: GetFuelOptions = {}
  ): Promise<FuelTrackingData> {
    return request<FuelTrackingData>(client(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/fuel-tracking',
      params: { from, to, groupBy: options.groupBy ?? 'month' },
    })
  },

  async getMonthlyExpenses(
    from: number,
    to: number,
    options: GetExpensesOptions = {}
  ): Promise<MonthlyExpensesData> {
    return request<MonthlyExpensesData>(client(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/monthly-costs',
      params: { from, to, currency: options.currency ?? 'VND' },
    })
  },
}
