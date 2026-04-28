import type { AxiosInstance } from "axios";
import { getGlobalClient, request } from "@/lib/http";
import { startOfTodayMs } from "@/lib/utils";
import type {
  ActivityHeatmapData,
  FuelGroupBy,
  FuelTrackingData,
  MemberReportData,
  MemberStatusKind,
  MonthlyExpensesData,
  SummaryCardsData,
} from "@/lib/types";

export interface GetSummaryOptions {
  date?: number;
  client?: AxiosInstance;
}

export interface GetMemberReportOptions {
  page?: number;
  pageSize?: number;
  status?: MemberStatusKind;
  client?: AxiosInstance;
}

export interface GetActivityHeatmapOptions {
  metric?: "distance" | "points";
  userId?: string;
  client?: AxiosInstance;
}

export interface GetFuelOptions {
  groupBy?: FuelGroupBy;
  userId?: string;
  client?: AxiosInstance;
}

export interface GetExpensesOptions {
  currency?: string;
  client?: AxiosInstance;
}

function client(opts?: { client?: AxiosInstance }): AxiosInstance {
  return opts?.client ?? getGlobalClient();
}

export const DashboardController = {
  async getSummaryCards(
    options: GetSummaryOptions = {},
  ): Promise<SummaryCardsData> {
    const date = options.date ?? startOfTodayMs();
    return request<SummaryCardsData>(client(options), {
      method: "GET",
      url: "dashboard/gps-manager/summary",
      params: { date },
    });
  },

  async getMemberReport(
    date: number = startOfTodayMs(),
    options: GetMemberReportOptions = {},
  ): Promise<MemberReportData> {
    return request<MemberReportData>(client(options), {
      method: "GET",
      url: "dashboard/gps-manager/users",
      params: {
        date,
        page: options.page ?? 1,
        pageSize: options.pageSize ?? 10,
        status: options.status,
      },
    });
  },

  async getActivityHeatmap(
    from: number,
    to: number,
    options: GetActivityHeatmapOptions = {},
  ): Promise<ActivityHeatmapData> {
    return request<ActivityHeatmapData>(client(options), {
      method: "GET",
      url: "dashboard/gps-manager/activity-heatmap",
      params: {
        from,
        to,
        metric: options.metric ?? "distance",
        userId: options.userId,
      },
    });
  },

  async getFuelTracking(
    from: number,
    to: number,
    options: GetFuelOptions = {},
  ): Promise<FuelTrackingData> {
    return request<FuelTrackingData>(client(options), {
      method: "GET",
      url: "dashboard/gps-manager/fuel-tracking",
      params: {
        from,
        to,
        groupBy: options.groupBy ?? "month",
        userId: options.userId,
      },
    });
  },

  async getMonthlyExpenses(
    from: number,
    to: number,
    options: GetExpensesOptions = {},
  ): Promise<MonthlyExpensesData> {
    return request<MonthlyExpensesData>(client(options), {
      method: "GET",
      url: "dashboard/gps-manager/monthly-costs",
      params: { from, to, currency: options.currency ?? "VND" },
    });
  },
};
