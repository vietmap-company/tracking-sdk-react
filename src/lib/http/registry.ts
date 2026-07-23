import type { AxiosInstance } from 'axios'
import type { FleetworkConfig } from '@/lib/types'
import { createHttpClient } from './axios-client'

/**
 * Global client registry — FleetworkProvider đăng ký client tại đây để
 * controllers/hooks dùng mà không phải truyền client qua từng call.
 * Vẫn có thể override per-call qua option `client` (test, multi-tenant).
 */
let globalConfig: FleetworkConfig | null = null
let globalClient: AxiosInstance | null = null

/** Khởi tạo SDK ngoài React (script, worker, …). Trong React app thì
 *  FleetworkProvider tự làm việc này. */
export function initFleetwork(config: FleetworkConfig): void {
  globalConfig = config
  globalClient = createHttpClient(config)
}

export function setGlobalClient(
  client: AxiosInstance,
  config: FleetworkConfig,
): void {
  globalClient = client
  globalConfig = config
}

export function getGlobalClient(): AxiosInstance {
  if (!globalClient) {
    throw new Error(
      '[Fleetwork SDK] Not initialized. Wrap your app with <FleetworkProvider />.',
    )
  }
  return globalClient
}

export function getGlobalConfig(): FleetworkConfig {
  if (!globalConfig) throw new Error('[Fleetwork SDK] Not initialized.')
  return globalConfig
}
