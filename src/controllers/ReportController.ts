import type { AxiosInstance } from 'axios'
import { getGlobalClient, request } from '@/lib/http'
import type {
  ActivityTimeReportData, FuelDetailReportData, FuelSummaryReportData,
  TripDetailReportData, TripSummaryReportData,
} from '@/lib/types'

export interface BaseReportOptions {
  from: number; to: number; userId?: string; groupId?: string
  page?: number; pageSize?: number; sortBy?: string; sortDesc?: boolean
  format?: 'excel' | 'csv'; client?: AxiosInstance
}
export type ActivityTimeOptions = Omit<BaseReportOptions, 'sortBy' | 'sortDesc'>

function c(opts?: { client?: AxiosInstance }): AxiosInstance { return opts?.client ?? getGlobalClient() }

function buildParams(o: BaseReportOptions): Record<string, unknown> {
  return { from: o.from, to: o.to, userId: o.userId, groupId: o.groupId, page: o.page, pageSize: o.pageSize, sortBy: o.sortBy, sortDesc: o.sortDesc, format: o.format }
}

export const ReportController = {
  async getTripSummary(options: BaseReportOptions): Promise<TripSummaryReportData> {
    return request<TripSummaryReportData>(c(options), { method: 'GET', url: 'reports/trip/summary', params: buildParams(options) })
  },
  async getTripDetail(options: BaseReportOptions): Promise<TripDetailReportData> {
    return request<TripDetailReportData>(c(options), { method: 'GET', url: 'reports/trip/detail', params: buildParams(options) })
  },
  async getFuelSummary(options: BaseReportOptions): Promise<FuelSummaryReportData> {
    return request<FuelSummaryReportData>(c(options), { method: 'GET', url: 'reports/fuel/summary', params: buildParams(options) })
  },
  async getFuelDetail(options: BaseReportOptions): Promise<FuelDetailReportData> {
    return request<FuelDetailReportData>(c(options), { method: 'GET', url: 'reports/fuel/detail', params: buildParams(options) })
  },
  async getActivityTime(options: ActivityTimeOptions): Promise<ActivityTimeReportData> {
    return request<ActivityTimeReportData>(c(options), {
      method: 'GET', url: 'reports/activity-time',
      params: { from: options.from, to: options.to, userId: options.userId, groupId: options.groupId, page: options.page, pageSize: options.pageSize, format: options.format },
    })
  },
}
