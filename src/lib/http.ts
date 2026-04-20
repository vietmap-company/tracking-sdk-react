import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { FleetworkConfig, SdkError } from './types'

const DEFAULT_BASE_URL = 'https://tracking.fleetwork.vn'

let globalConfig: FleetworkConfig | null = null
let globalClient: AxiosInstance | null = null

function buildClient(config: FleetworkConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
      Authorization: `Bearer ${config.apiKey}`,
    },
    timeout: 30000,
  })

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      const sdkErr: SdkError = new Error(
        err?.response?.data?.message ??
          err?.message ??
          'Fleetwork SDK request failed'
      )
      sdkErr.status = err?.response?.status
      return Promise.reject(sdkErr)
    }
  )

  return instance
}

/** Initialize SDK for usage outside React (controllers in Zustand, Redux, etc). */
export function initFleetwork(config: FleetworkConfig): void {
  globalConfig = config
  globalClient = buildClient(config)
}

/** Create a scoped client without touching the global singleton. */
export function createHttpClient(config: FleetworkConfig): AxiosInstance {
  return buildClient(config)
}

export function getGlobalClient(): AxiosInstance {
  if (!globalClient) {
    throw new Error(
      '[Fleetwork SDK] Not initialized. Call initFleetwork({ apiKey }) or wrap your app with <FleetworkProvider />.'
    )
  }
  return globalClient
}

export function getGlobalConfig(): FleetworkConfig {
  if (!globalConfig) {
    throw new Error(
      '[Fleetwork SDK] Not initialized. Call initFleetwork({ apiKey }) first.'
    )
  }
  return globalConfig
}

export function setGlobalClient(client: AxiosInstance, config: FleetworkConfig) {
  globalClient = client
  globalConfig = config
}

export async function request<T>(
  client: AxiosInstance,
  cfg: AxiosRequestConfig
): Promise<T> {
  const res = await client.request<T>(cfg)
  return res.data
}
