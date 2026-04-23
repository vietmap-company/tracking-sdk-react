import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { FleetworkConfig, SdkError } from "./types";

let globalConfig: FleetworkConfig | null = null;
let globalClient: AxiosInstance | null = null;

// ── Dev request tracing (eliminated in prod by Vite) ─────────────────────────
const isDev = import.meta.env.DEV;

let _seq = 0;
const _meta = new WeakMap<
  InternalAxiosRequestConfig,
  { seq: number; t0: number }
>();
const _inflight = isDev ? new Map<string, number>() : undefined;

function _dec(url: string) {
  if (!_inflight) return;
  const n = (_inflight.get(url) ?? 1) - 1;
  n <= 0 ? _inflight.delete(url) : _inflight.set(url, n);
}
// ─────────────────────────────────────────────────────────────────────────────

function buildClient(config: FleetworkConfig): AxiosInstance {
  const base = config.baseUrl;

  const instance = axios.create({
    baseURL: `${base}`,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
    timeout: 30_000,
    paramsSerializer: (params) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === null || v === undefined || v === "") continue;
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item != null && item !== "") sp.append(k, String(item));
          });
        } else {
          sp.append(k, String(v));
        }
      }
      return sp.toString();
    },
  });

  // ── Request interceptor: dev tracing ───────────────────────────────────────
  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    if (isDev && _inflight) {
      const seq = ++_seq;
      const url = cfg.url ?? "";
      const n = (_inflight.get(url) ?? 0) + 1;
      _inflight.set(url, n);
      _meta.set(cfg, { seq, t0: performance.now() });
    }
    return cfg;
  });

  // ── Response interceptor: timing + error normalization ────────────────────
  instance.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err) => {
      if (isDev && err.config) {
        const url = (err.config as InternalAxiosRequestConfig).url ?? "";
        _dec(url);
      }
      const sdkErr: SdkError = new Error(
        err?.response?.data?.message ??
          err?.message ??
          "Fleetwork SDK request failed",
      );
      sdkErr.status = err?.response?.status;
      return Promise.reject(sdkErr);
    },
  );

  return instance;
}

/** Initialize SDK for usage outside React (controllers in Zustand, Redux, etc). */
export function initFleetwork(config: FleetworkConfig): void {
  globalConfig = config;
  globalClient = buildClient(config);
}

/** Create a scoped client without touching the global singleton. */
export function createHttpClient(config: FleetworkConfig): AxiosInstance {
  return buildClient(config);
}

export function getGlobalClient(): AxiosInstance {
  if (!globalClient) {
    throw new Error(
      "[Fleetwork SDK] Not initialized. Call initFleetwork({ apiKey }) or wrap your app with <FleetworkProvider />.",
    );
  }
  return globalClient;
}

export function getGlobalConfig(): FleetworkConfig {
  if (!globalConfig) {
    throw new Error(
      "[Fleetwork SDK] Not initialized. Call initFleetwork({ apiKey }) first.",
    );
  }
  return globalConfig;
}

export function setGlobalClient(
  client: AxiosInstance,
  config: FleetworkConfig,
) {
  globalClient = client;
  globalConfig = config;
}

export async function request<T>(
  client: AxiosInstance,
  cfg: AxiosRequestConfig,
): Promise<T> {
  const res = await client.request<T>(cfg);
  return res.data;
}
