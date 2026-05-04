import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { FleetworkConfig, SdkError } from "./types";

let globalConfig: FleetworkConfig | null = null;
let globalClient: AxiosInstance | null = null;

const isDev = import.meta.env.DEV;

function buildClient(config: FleetworkConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl ?? "https://https://dricon.fastmap.vn.vn",
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

  instance.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    if (isDev) {
      console.log(`[dc-sdk] ${cfg.method?.toUpperCase()} ${cfg.url}`);
    }
    return cfg;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
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

export function initFleetwork(config: FleetworkConfig): void {
  globalConfig = config;
  globalClient = buildClient(config);
}

export function createHttpClient(config: FleetworkConfig): AxiosInstance {
  return buildClient(config);
}

export function getGlobalClient(): AxiosInstance {
  if (!globalClient) {
    throw new Error(
      "[Fleetwork SDK] Not initialized. Wrap your app with <FleetworkProvider />.",
    );
  }
  return globalClient;
}

export function getGlobalConfig(): FleetworkConfig {
  if (!globalConfig) throw new Error("[Fleetwork SDK] Not initialized.");
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
