import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthErrorEvent, FleetworkConfig, SdkError } from "./types";
import { emitAuthError } from "./auth-events";

let globalConfig: FleetworkConfig | null = null;
let globalClient: AxiosInstance | null = null;

const isDev = import.meta.env.DEV;

function buildClient(config: FleetworkConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl ?? "https://live.fleetwork.vn/api/v1",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey,
    },
    timeout: 10_000,
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
      const status = err?.response?.status as number | undefined;
      const payload = err?.response?.data;

      // Backend can return any of: { error, message, detail, status }.
      // Pick the first non-empty string in that priority order, then fall
      // back to axios's own error message.
      // Priority: message > status > detail > errors[0] > error > axios message.
      // (`message` is usually human-readable, `error` is often a slug like
      // "unauthorized".)
      const fields: (string | undefined)[] = [];
      if (typeof payload === "object" && payload !== null) {
        const obj = payload as Record<string, unknown>;
        for (const key of ["message", "status", "detail", "error"]) {
          const v = obj[key];
          if (typeof v === "string" && v.length > 0) fields.push(v);
        }
        const errors = obj.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          const first = errors[0];
          if (typeof first === "string" && first.length > 0) fields.push(first);
        }
      }
      fields.push(err?.message);
      const message =
        fields.find((v) => typeof v === "string" && v.length > 0) ??
        "Request failed";

      if (status === 401 || status === 403) {
        const event: AuthErrorEvent = {
          status,
          message,
          url: err?.config?.url,
          method: err?.config?.method?.toUpperCase(),
          payload,
        };
        emitAuthError(event);
      }

      const sdkErr: SdkError = new Error(message);
      sdkErr.status = status;
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
