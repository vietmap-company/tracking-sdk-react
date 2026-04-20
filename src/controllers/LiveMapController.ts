import type { AxiosInstance } from 'axios'
import { getGlobalClient, request } from '@/lib/http'
import type { GpsPoint, MemberReportData, MemberStatus } from '@/lib/types'

function rowToMember(row: MemberReportData['members'][number]): MemberStatus {
  return {
    userId: row.userId,
    name: row.name,
    avatarUrl: row.avatarUrl,
    groupName: row.groupName,
    status: row.status,
    statusLabel: row.statusLabel,
    lat: row.lastLocation?.lat ?? 0,
    lng: row.lastLocation?.lng ?? 0,
    lastAddress: row.lastLocation?.address,
    speed: row.lastLocation?.speed,
    lastSeenAt: row.lastSeenAt,
  }
}

function c(opts?: { client?: AxiosInstance }): AxiosInstance {
  return opts?.client ?? getGlobalClient()
}

export const LiveMapController = {
  async getMembers(
    options: { client?: AxiosInstance } = {}
  ): Promise<MemberStatus[]> {
    const data = await request<MemberReportData>(c(options), {
      method: 'GET',
      url: '/api/v1/dashboard/gps-manager/employees',
      params: { pageSize: 1000 },
    })
    return data.members.map(rowToMember)
  },

  async getMember(
    userId: string,
    options: { client?: AxiosInstance } = {}
  ): Promise<MemberStatus | null> {
    const members = await this.getMembers(options)
    return members.find((m) => m.userId === userId) ?? null
  },

  async getLastLocation(
    userId: string,
    options: { client?: AxiosInstance } = {}
  ): Promise<GpsPoint | null> {
    return request<GpsPoint | null>(c(options), {
      method: 'GET',
      url: `/api/v1/gps-tracking/latest/users/${encodeURIComponent(userId)}`,
    })
  },

  async getAllLastLocations(
    options: { client?: AxiosInstance } = {}
  ): Promise<GpsPoint[]> {
    return request<GpsPoint[]>(c(options), {
      method: 'GET',
      url: '/api/v1/gps-tracking/latest',
    })
  },

  async getHistoryRoute(
    vehicleId: string,
    startTime: number,
    endTime: number,
    options: { client?: AxiosInstance } = {}
  ): Promise<GpsPoint[]> {
    const res = await request<{ trackingData: GpsPoint[] } | GpsPoint[]>(
      c(options),
      {
        method: 'GET',
        url: '/api/v1/gps-tracking/history',
        params: { VehicleId: vehicleId, FromTime: startTime, ToTime: endTime },
      }
    )
    if (Array.isArray(res)) return res
    return res.trackingData ?? []
  },
}
