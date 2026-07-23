import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AuthErrorEvent, FleetworkConfig, SdkError } from '@/lib/types'
import { emitAuthError } from '@/lib/auth-events'

const DEFAULT_BASE_URL = 'https://app.fleetwork.vn/api/v1'
const API_TIMEOUT = 10_000

const isDev = import.meta.env.DEV

let requestSeq = 0
const debugMeta = new WeakMap<
  InternalAxiosRequestConfig,
  { seq: number; startTime: number }
>()
const inflightUrls = isDev ? new Map<string, number>() : undefined

function decrementInflight(url: string) {
  if (!inflightUrls) return
  const count = (inflightUrls.get(url) || 1) - 1
  if (count <= 0) inflightUrls.delete(url)
  else inflightUrls.set(url, count)
}

function traceRequest(config: InternalAxiosRequestConfig) {
  if (!isDev || !inflightUrls) return
  const seq = ++requestSeq
  const url = config.url || ''
  const inflight = (inflightUrls.get(url) || 0) + 1
  inflightUrls.set(url, inflight)
  debugMeta.set(config, { seq, startTime: performance.now() })
  const dup = inflight > 1 ? ` DUP(${inflight})` : ''
  console.log(
    `%c[dc-sdk] #${seq} ${config.method?.toUpperCase()} ${url}${dup}`,
    inflight > 1 ? 'color:#ef4444;font-weight:bold' : 'color:#6b7280',
  )
}

function traceResponse(response: AxiosResponse) {
  if (!isDev) return
  const meta = debugMeta.get(response.config)
  const url = response.config.url || ''
  decrementInflight(url)
  if (meta) {
    const duration = Math.round(performance.now() - meta.startTime)
    console.log(
      `%c[dc-sdk] #${meta.seq} ✓ ${response.config.method?.toUpperCase()} ${url} — ${duration}ms`,
      duration > 1000 ? 'color:#ef4444' : 'color:#22c55e',
    )
  }
}

function traceError(error: {
  config?: InternalAxiosRequestConfig
  response?: { status?: number }
}) {
  if (!isDev || !error.config) return
  const meta = debugMeta.get(error.config)
  const url = error.config.url || ''
  decrementInflight(url)
  if (meta) {
    console.log(
      `%c[dc-sdk] #${meta.seq} ✗ ${error.config.method?.toUpperCase()} ${url} — ${Math.round(performance.now() - meta.startTime)}ms (${error.response?.status ?? 'network'})`,
      'color:#ef4444;font-weight:bold',
    )
  }
}

// ── Error normalization ──────────────────────────────────────────────────────

/**
 * Backend can return any of: { error, message, detail, status, errors[] }.
 * Pick the first non-empty string in priority order, then fall back to
 * axios's own error message.
 * Priority: message > status > detail > errors[0] > error > axios message.
 * (`message` is usually human-readable, `error` is often a slug like
 * "unauthorized".)
 */
function extractErrorMessage(payload: unknown, fallback?: string): string {
  const fields: (string | undefined)[] = []
  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>
    for (const key of ['message', 'status', 'detail']) {
      const v = obj[key]
      if (typeof v === 'string' && v.length > 0) fields.push(v)
    }
    const errors = obj.errors
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0]
      if (typeof first === 'string' && first.length > 0) fields.push(first)
    }
    const error = obj.error
    if (typeof error === 'string' && error.length > 0) fields.push(error)
  }
  fields.push(fallback)
  return (
    fields.find((v) => typeof v === 'string' && v.length > 0) ?? 'Request failed'
  )
}

/** Xử lý lỗi chung cho mọi response lỗi: trace + emit auth event (401/403)
 *  + normalize thành SdkError (message dễ đọc, kèm status). */
function handleAxiosError(err: {
  config?: InternalAxiosRequestConfig
  response?: { status?: number; data?: unknown }
  message?: string
}): Promise<never> {
  traceError(err)

  const status = err.response?.status
  const payload = err.response?.data
  const message = extractErrorMessage(payload, err.message)

  if (status === 401 || status === 403) {
    const event: AuthErrorEvent = {
      status,
      message,
      url: err.config?.url,
      method: err.config?.method?.toUpperCase(),
      payload,
    }
    emitAuthError(event)
  }

  const sdkErr: SdkError = new Error(message)
  sdkErr.status = status
  return Promise.reject(sdkErr)
}

// ── Client factory ───────────────────────────────────────────────────────────

/** Serialize params: bỏ null/undefined/rỗng; mảng → lặp key không ngoặc
 *  (`userIds=a&userIds=b` — đúng format backend yêu cầu). */
function serializeParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === '') continue
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item != null && item !== '') sp.append(k, String(item))
      })
    } else {
      sp.append(k, String(v))
    }
  }
  return sp.toString()
}

export function createHttpClient(config: FleetworkConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl ?? DEFAULT_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    paramsSerializer: serializeParams,
  })

  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    traceRequest(cfg)
    return cfg
  })

  instance.interceptors.response.use((res: AxiosResponse) => {
    traceResponse(res)
    return res
  }, handleAxiosError)

  return instance
}
