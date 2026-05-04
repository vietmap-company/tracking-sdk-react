/** VietmapGL CDN loader — singleton promise, injected once per page. */

const VIETMAP_JS =
  "https://unpkg.com/@vietmap/vietmap-gl-js@7.0.0-pre.1/dist/vietmap-gl.js";
const VIETMAP_CSS =
  "https://unpkg.com/@vietmap/vietmap-gl-js@7.0.0-pre.1/dist/vietmap-gl.css";

export type VGL = Record<string, unknown>;

let _vglPromise: Promise<VGL> | null = null;

export function loadVietmapGL(): Promise<VGL> {
  if (_vglPromise) return _vglPromise;

  _vglPromise = new Promise<VGL>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    if (w["vietmapgl"]) {
      resolve(w["vietmapgl"] as VGL);
      return;
    }

    if (!document.getElementById("_dc_vgl_css")) {
      const link = document.createElement("link");
      link.id = "_dc_vgl_css";
      link.rel = "stylesheet";
      link.href = VIETMAP_CSS;
      document.head.appendChild(link);
    }

    const existing = document.getElementById(
      "_dc_vgl_js",
    ) as HTMLScriptElement | null;
    const ok = () => {
      const v = (window as unknown as Record<string, unknown>)["vietmapgl"];
      v ? resolve(v as VGL) : reject(new Error("VietmapGL global not found"));
    };
    if (existing) {
      existing.addEventListener("load", ok, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "_dc_vgl_js";
    script.src = VIETMAP_JS;
    script.onload = ok;
    script.onerror = () => {
      _vglPromise = null;
      reject(new Error("Failed to load VietmapGL from CDN"));
    };
    document.head.appendChild(script);
  });

  return _vglPromise;
}
