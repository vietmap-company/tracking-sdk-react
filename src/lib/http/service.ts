import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getGlobalClient } from './registry'

/**
 * HttpService — bọc các method CRUD, trả thẳng `response.data`; lỗi đã được interceptor
 * normalize thành SdkError nên caller chỉ cần try/catch message.
 * `client` optional — mặc định dùng global client từ FleetworkProvider.
 */
export const HttpService = {
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    client?: AxiosInstance,
  ): Promise<T> {
    const res = await (client ?? getGlobalClient()).get<T>(url, { params })
    return res.data
  },

  async post<T>(
    url: string,
    data?: unknown,
    client?: AxiosInstance,
  ): Promise<T> {
    const res = await (client ?? getGlobalClient()).post<T>(url, data)
    return res.data
  },

  async put<T>(
    url: string,
    data?: unknown,
    client?: AxiosInstance,
  ): Promise<T> {
    const res = await (client ?? getGlobalClient()).put<T>(url, data)
    return res.data
  },

  async delete<T>(url: string, client?: AxiosInstance): Promise<T> {
    const res = await (client ?? getGlobalClient()).delete<T>(url)
    return res.data
  },
}

/** Escape hatch cho request cần config đầy đủ của axios. */
export async function request<T>(
  client: AxiosInstance,
  cfg: AxiosRequestConfig,
): Promise<T> {
  const res = await client.request<T>(cfg)
  return res.data
}
