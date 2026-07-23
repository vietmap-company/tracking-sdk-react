/**
 * ReportController — facade gọn. Máy request (chunk >1000 ids, gộp trang,
 * tính totals) nằm trong `report/request.ts`. Public API giữ nguyên.
 */
import { HttpService } from '@/lib/http'
import { resolveClient } from './shared'
import {
  detailRequest,
  sumFuelTotals,
  summaryRequest,
  type ActivityTimeOptions,
  type BaseReportOptions,
} from './report/request'
import type {
  ActivityTimeReportData,
  FuelDetailReportData,
  FuelSummaryReportData,
  FuelSummaryRow,
  TripDetailReportData,
  TripSummaryReportData,
  TripSummaryRow,
} from '@/lib/types'

export type { ActivityTimeOptions, BaseReportOptions }

export const ReportController = {
  getTripSummary(options: BaseReportOptions): Promise<TripSummaryReportData> {
    return summaryRequest<TripSummaryReportData, TripSummaryRow>(
      options,
      'reports/trip/summary',
      (d) => d.users,
      (base, _all, paged, pagination) => ({ ...base, users: paged, pagination }),
    )
  },

  getTripDetail(options: BaseReportOptions): Promise<TripDetailReportData> {
    return detailRequest<TripDetailReportData>(options, 'reports/trip/detail')
  },

  getFuelSummary(options: BaseReportOptions): Promise<FuelSummaryReportData> {
    return summaryRequest<FuelSummaryReportData, FuelSummaryRow>(
      options,
      'reports/fuel/summary',
      (d) => d.users,
      (base, all, paged, pagination) => ({
        ...base,
        users: paged,
        totals: sumFuelTotals(all),
        pagination,
      }),
    )
  },

  getFuelDetail(options: BaseReportOptions): Promise<FuelDetailReportData> {
    return detailRequest<FuelDetailReportData>(options, 'reports/fuel/detail')
  },

  async getActivityTime(
    options: ActivityTimeOptions,
  ): Promise<ActivityTimeReportData> {
    return HttpService.get<ActivityTimeReportData>(
      'reports/activity-time',
      {
        from: options.from,
        to: options.to,
        userId: options.userId,
        groupId: options.groupId,
        page: options.page,
        pageSize: options.pageSize,
        format: options.format,
      },
      resolveClient(options),
    )
  },
}
