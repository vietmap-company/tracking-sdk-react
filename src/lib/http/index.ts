/**
 * HTTP layer:
 *   - `axios-client.ts` — factory tạo instance + interceptors (dev tracing,
 *     normalize lỗi, phát auth event 401/403)
 *   - `registry.ts` — global client mà FleetworkProvider đăng ký
 *   - `service.ts` — HttpService (kiểu BaseService) trả thẳng data
 * Import path `@/lib/http` và toàn bộ export cũ giữ nguyên.
 */
export { createHttpClient } from './axios-client'
export {
  getGlobalClient,
  getGlobalConfig,
  initFleetwork,
  setGlobalClient,
} from './registry'
export { HttpService, request } from './service'
