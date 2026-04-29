import * as React from "react";
import { createPortal } from "react-dom";
import { useMembers } from "@/hooks";

// ─── VietmapGL CDN loader (mirrors dricon-sdk approach) ─────────────────────
// We load from CDN so the SDK bundle stays lean and avoids UMD/ESM conflicts.
const VIETMAP_JS =
  "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js";
const VIETMAP_CSS =
  "https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css";

type VGL = Record<string, unknown>;

let _vglPromise: Promise<VGL> | null = null;

function loadVietmapGL(): Promise<VGL> {
  if (_vglPromise) return _vglPromise;
  _vglPromise = new Promise<VGL>((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>;
    if (w["vietmapgl"]) {
      resolve(w["vietmapgl"] as VGL);
      return;
    }
    // Inject CSS once
    if (!document.getElementById("_fw_vgl_css")) {
      const link = document.createElement("link");
      link.id = "_fw_vgl_css";
      link.rel = "stylesheet";
      link.href = VIETMAP_CSS;
      document.head.appendChild(link);
    }
    // Inject JS once
    const existing = document.getElementById(
      "_fw_vgl_js",
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
    script.id = "_fw_vgl_js";
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
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn } from "@/lib/utils";
import { buildTileStyle } from "./tiles";
import { MemberList } from "./MemberList";
import { Legend } from "./Legend";
import { TileSwitcher } from "./TileSwitcher";
import { DefaultPopup } from "./Marker";
import { HistoryPanel } from "./HistoryPanel";
import { PlaybackControls } from "./PlaybackControls";
import { SpiderOverlay } from "./SpiderOverlay";
import type { LiveMapProps, LiveMapRef, MapInstance } from "./types";
import type { GpsPoint, MemberStatus, TileType } from "@/lib/types";

// ─── Cluster layer IDs ────────────────────────────────────────────────────────
const MEMBERS_SOURCE = "fw-members";
const LAYER_CLUSTERS = "fw-clusters";
const LAYER_CLUSTER_COUNT = "fw-cluster-count";
const LAYER_POINTS = "fw-points";

/** Convert MemberStatus array to GeoJSON FeatureCollection for map source */
function toGeoJSON(members: MemberStatus[]): unknown {
  return {
    type: "FeatureCollection",
    features: members
      .filter((m) => m.lat && m.lng)
      .map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: { userId: m.userId, name: m.name, status: m.status },
      })),
  };
}

/** Add GeoJSON source and cluster layers to the map */
function addClusterLayers(
  map: MapInstance,
  data: unknown,
  clusterRadius: number,
  clusterMaxZoom: number,
) {
  map.addSource(MEMBERS_SOURCE, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius,
    clusterMaxZoom,
  } as Record<string, unknown>);

  // Cluster circles — color/size steps by point_count
  map.addLayer({
    id: LAYER_CLUSTERS,
    type: "circle",
    source: MEMBERS_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#3b82f6",
        100,
        "#f59e0b",
        500,
        "#ef4444",
      ],
      "circle-radius": [
        "step",
        ["get", "point_count"],
        16,
        100,
        24,
        500,
        32,
      ],
      "circle-opacity": 0.85,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  } as Record<string, unknown>);

  // Cluster count labels
  map.addLayer({
    id: LAYER_CLUSTER_COUNT,
    type: "symbol",
    source: MEMBERS_SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 13,
    },
    paint: { "text-color": "#ffffff" },
  } as Record<string, unknown>);

  // Individual (unclustered) points — color by status
  map.addLayer({
    id: LAYER_POINTS,
    type: "circle",
    source: MEMBERS_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "match",
        ["get", "status"],
        "moving",
        "#10b981",
        "stopped",
        "#f59e0b",
        "#94a3b8", // signal_lost fallback
      ],
      "circle-radius": 8,
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.95,
    },
  } as Record<string, unknown>);
}

const DEFAULT_CENTER: [number, number] = [106.6, 10.8];

export const LiveMap = React.forwardRef<LiveMapRef, LiveMapProps>(
  function LiveMap(props, ref) {
    const {
      height = "100dvh",
      center = DEFAULT_CENTER,
      zoom = 11,
      defaultTile = "terrain",
      pollInterval = 10000,
      maxUsers = 3000,
      clusterRadius = 50,
      clusterMaxZoom = 14,
      members: membersProp,
      memberNameKey,
      showList = true,
      showLegend = true,
      legendPosition = "top-right",
      showTileSwitcher = true,
      tileSwitcherPosition = "bottom-right",
      className,
      style,
      onMemberClick,
      onMarkerClick,
      onMapClick,
      onMapReady,
      renderMemberItem,
      renderMarkerPopup,
      slotProps,
    } = props;

    const { apiKeyTilemap } = useFleetwork();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mapRef = React.useRef<unknown>(null);
    const popupRef = React.useRef<unknown>(null);
    const popupContainerRef = React.useRef<HTMLDivElement | null>(null);
    const vglRef = React.useRef<VGL | null>(null);

    // Keep cluster config accessible inside stable callbacks
    const clusterRadiusRef = React.useRef(clusterRadius);
    const clusterMaxZoomRef = React.useRef(clusterMaxZoom);
    React.useEffect(() => {
      clusterRadiusRef.current = clusterRadius;
    }, [clusterRadius]);
    React.useEffect(() => {
      clusterMaxZoomRef.current = clusterMaxZoom;
    }, [clusterMaxZoom]);

    const [tile, setTile] = React.useState<TileType>(defaultTile);
    const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
    const [popupMember, setPopupMember] = React.useState<MemberStatus | null>(null);
    const [spiderState, setSpiderState] = React.useState<{
      centerPx: { x: number; y: number };
      members: MemberStatus[];
    } | null>(null);
    const [ready, setReady] = React.useState(false);

    // History / playback state
    const [selectedMember, setSelectedMember] =
      React.useState<MemberStatus | null>(null);
    const selectedMemberRef = React.useRef<MemberStatus | null>(null);
    React.useEffect(() => {
      selectedMemberRef.current = selectedMember;
    }, [selectedMember]);
    const [historyPoints, setHistoryPoints] = React.useState<GpsPoint[]>([]);
    const [playIndex, setPlayIndex] = React.useState(0);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [playSpeed, setPlaySpeed] = React.useState<1 | 2 | 4>(1);
    const [autoFollow, setAutoFollow] = React.useState(true);
    const historyMarkerRef = React.useRef<unknown>(null);
    const playTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(
      null,
    );
    const historyPointsRef = React.useRef<GpsPoint[]>([]);
    const hasFitInitialRef = React.useRef(false);
    React.useEffect(() => {
      historyPointsRef.current = historyPoints;
    }, [historyPoints]);

    const { data: apiMembers = [], isLoading: apiLoading } = useMembers({
      pollInterval,
      nameKey: memberNameKey,
      maxUsers,
    });
    const members = membersProp ?? apiMembers;
    const isLoading = membersProp != null ? false : apiLoading;
    const membersRef = React.useRef<MemberStatus[]>(members);
    React.useEffect(() => {
      membersRef.current = members;
    }, [members]);

    // Keep callback refs stable across re-renders
    const onMarkerClickRef = React.useRef(onMarkerClick);
    const onMapClickRef = React.useRef(onMapClick);
    const renderPopupRef = React.useRef(renderMarkerPopup);
    React.useEffect(() => {
      onMarkerClickRef.current = onMarkerClick;
    }, [onMarkerClick]);
    React.useEffect(() => {
      onMapClickRef.current = onMapClick;
    }, [onMapClick]);
    React.useEffect(() => {
      renderPopupRef.current = renderMarkerPopup;
    }, [renderMarkerPopup]);

    const openPopup = React.useCallback((m: MemberStatus) => {
      const map = mapRef.current;
      if (!map) return;
      if (!popupContainerRef.current) {
        popupContainerRef.current = document.createElement("div");
      }
      (popupRef.current as { remove: () => void } | null)?.remove();

      type PopupInstance = {
        setLngLat: (ll: [number, number]) => PopupInstance;
        setDOMContent: (el: HTMLElement) => PopupInstance;
        addTo: (m: unknown) => PopupInstance;
        remove: () => void;
        on: (evt: string, h: () => void) => void;
      };
      const VGL = vglRef.current;
      if (!VGL) return;
      const popup = new (
        VGL as unknown as {
          Popup: new (opts: Record<string, unknown>) => PopupInstance;
        }
      ).Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
      });

      popup
        .setLngLat([m.lng, m.lat])
        .setDOMContent(popupContainerRef.current!)
        .addTo(map);

      popup.on("close", () => {
        setPopupMember(null);
      });

      popupRef.current = popup;
      setPopupMember(m);
    }, []);

    // Init map — load VietmapGL from CDN first, then create the map
    React.useEffect(() => {
      if (!containerRef.current) return;
      let cancelled = false;
      let map:
        | (MapInstance & {
            on: (evt: string, handler: (e: unknown) => void) => void;
            off: (evt: string, handler: (e: unknown) => void) => void;
          })
        | null = null;

      loadVietmapGL()
        .then((VGL) => {
          if (cancelled || !containerRef.current) return;
          vglRef.current = VGL;

          map = new (
            VGL as unknown as {
              Map: new (opts: Record<string, unknown>) => unknown;
            }
          ).Map({
            container: containerRef.current,
            style: buildTileStyle(tile, apiKeyTilemap),
            center,
            zoom,
          }) as MapInstance & {
            on: (evt: string, handler: (e: unknown) => void) => void;
            off: (evt: string, handler: (e: unknown) => void) => void;
          };

          mapRef.current = map;

          const handleLoad = () => {
            if (!cancelled) {
              setReady(true);
              onMapReady?.(map as MapInstance);
            }
          };

          // Global click: detect cluster/point hits via queryRenderedFeatures
          const handleClick = (e: unknown) => {
            const ev = e as {
              lngLat?: { lng: number; lat: number };
              point?: { x: number; y: number };
            };

            const m = mapRef.current as MapInstance;
            if (ev.point && m?.queryRenderedFeatures) {
              const features = m.queryRenderedFeatures(
                [ev.point.x, ev.point.y],
                { layers: [LAYER_CLUSTERS, LAYER_POINTS] },
              );

              if (features && features.length > 0) {
                const f = features[0];

                if (f.layer.id === LAYER_CLUSTERS) {
                  const coords = f.geometry.coordinates as [number, number];
                  m.easeTo({ center: coords, zoom: m.getZoom() + 3, duration: 500 });
                  return;
                }

                if (f.layer.id === LAYER_POINTS) {
                  // Query a small bbox to find ALL points overlapping at this pixel
                  const px = ev.point as { x: number; y: number };
                  const bboxFeats = m.queryRenderedFeatures?.(
                    [[px.x - 12, px.y - 12], [px.x + 12, px.y + 12]] as [[number, number], [number, number]],
                    { layers: [LAYER_POINTS] },
                  ) ?? [];

                  // Group by coordinate — points at the same geo position overlap
                  const clickedCoord = f.geometry.coordinates as [number, number];
                  const overlapping = bboxFeats.filter((feat) => {
                    const c = feat.geometry.coordinates as [number, number];
                    return (
                      Math.abs(c[0] - clickedCoord[0]) < 0.00002 &&
                      Math.abs(c[1] - clickedCoord[1]) < 0.00002
                    );
                  });

                  if (overlapping.length > 1) {
                    // Multiple members at same coordinate → spiderfy
                    const spiderMembers = overlapping
                      .map((feat) =>
                        membersRef.current.find(
                          (x) => x.userId === (feat.properties.userId as string),
                        ),
                      )
                      .filter((x): x is MemberStatus => x != null);
                    const centerPx = m.project?.(clickedCoord) ?? { x: px.x, y: px.y };
                    ;(popupRef.current as { remove: () => void } | null)?.remove();
                    popupRef.current = null;
                    setPopupMember(null);
                    setSpiderState({ centerPx, members: spiderMembers });
                    return;
                  }

                  // Single point — normal popup
                  const userId = f.properties.userId as string;
                  const member = membersRef.current.find((x) => x.userId === userId);
                  if (member) {
                    const cb = onMarkerClickRef.current;
                    const shouldDefault = cb ? cb(member) !== false : true;
                    if (shouldDefault) {
                      setSpiderState(null);
                      setActiveUserId(userId);
                      openPopup(member);
                      m.jumpTo({
                        center: [member.lng, member.lat],
                        zoom: Math.max(14, m.getZoom()),
                      });
                    }
                  }
                  return;
                }
              }
            }

            // No feature hit — close spider and fire normal map click
            setSpiderState(null);
            if (ev.lngLat) {
              onMapClickRef.current?.([ev.lngLat.lng, ev.lngLat.lat]);
            }
          };

          // Cursor: pointer when hovering clusters or individual points
          const handleMouseMove = (e: unknown) => {
            const ev = e as { point?: { x: number; y: number } };
            const m = mapRef.current as MapInstance;
            const canvas = m?.getCanvas?.();
            if (!canvas || !ev.point || !m.queryRenderedFeatures) return;
            const features = m.queryRenderedFeatures(
              [ev.point.x, ev.point.y],
              { layers: [LAYER_CLUSTERS, LAYER_POINTS] },
            );
            canvas.style.cursor =
              features && features.length > 0 ? "pointer" : "";
          };

          // Re-add cluster layers after setStyle clears the map
          const handleStyleData = () => {
            const m = mapRef.current as MapInstance;
            if (!m || m.getSource(MEMBERS_SOURCE)) return;
            try {
              addClusterLayers(
                m,
                toGeoJSON(membersRef.current),
                clusterRadiusRef.current,
                clusterMaxZoomRef.current,
              );
            } catch {
              // Style not fully loaded yet — will succeed on next styledata
            }
          };

          const handleMoveStart = () => setSpiderState(null);

          map.on("load", handleLoad);
          map.on("click", handleClick);
          map.on("mousemove", handleMouseMove);
          map.on("styledata", handleStyleData);
          map.on("movestart", handleMoveStart);
        })
        .catch((err) => {
          if (!cancelled)
            console.error("[LiveMap] Failed to load VietmapGL:", err);
        });

      return () => {
        cancelled = true;
        (popupRef.current as { remove: () => void } | null)?.remove();
        popupRef.current = null;
        if (map) {
          try {
            map.remove();
          } catch {}
        }
        mapRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKeyTilemap]);

    // React to tile changes
    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      (mapRef.current as MapInstance).setStyle(
        buildTileStyle(tile, apiKeyTilemap),
      );
    }, [tile, apiKeyTilemap, ready]);

    // Sync GeoJSON source whenever members change
    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      const map = mapRef.current as MapInstance;
      const data = toGeoJSON(members);

      try {
        const src = map.getSource(MEMBERS_SOURCE);
        if (src) {
          src.setData(data);
        } else {
          addClusterLayers(map, data, clusterRadius, clusterMaxZoom);
        }
      } catch (e) {
        console.warn("[LiveMap] cluster source update:", e);
      }

      // fitBounds to all members — only on first data load
      if (!hasFitInitialRef.current) {
        const pts = members.filter((m) => m.lat && m.lng);
        if (pts.length >= 2) {
          hasFitInitialRef.current = true;
          const lats = pts.map((m) => m.lat);
          const lngs = pts.map((m) => m.lng);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, duration: 0 },
          );
        } else if (pts.length === 1) {
          hasFitInitialRef.current = true;
          map.fitBounds(
            [
              [pts[0].lng, pts[0].lat],
              [pts[0].lng, pts[0].lat],
            ],
            { padding: 60, duration: 0, maxZoom: 14 },
          );
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members, ready]);

    const ROUTE_REM_SRC = "fw-route-remaining";
    const ROUTE_REM_BG = "fw-route-remaining-bg";
    const ROUTE_REM_LINE = "fw-route-remaining-line";
    const ROUTE_TRAV_SRC = "fw-route-traveled";
    const ROUTE_TRAV_LINE = "fw-route-traveled-line";

    const drawHistoryRoute = React.useCallback(
      (pts: GpsPoint[], playIdx: number) => {
        const map = mapRef.current as MapInstance | null;
        if (!map || pts.length < 2) return;

        const ci = Math.max(0, Math.min(playIdx, pts.length - 1));
        const travCoords = pts.slice(0, ci + 1).map((p) => [p.lng, p.lat]);
        const remCoords = pts.slice(ci).map((p) => [p.lng, p.lat]);

        const travGeo = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: travCoords },
        };
        const remGeo = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: remCoords },
        };

        try {
          // ── Remaining route (mờ, dashed) ──
          const remSrc = map.getSource(ROUTE_REM_SRC);
          if (remSrc) {
            remSrc.setData(remGeo);
          } else {
            map.addSource(ROUTE_REM_SRC, {
              type: "geojson",
              data: remGeo,
            } as Record<string, unknown>);
            map.addLayer({
              id: ROUTE_REM_BG,
              type: "line",
              source: ROUTE_REM_SRC,
              paint: {
                "line-color": "#94a3b8",
                "line-width": 6,
                "line-opacity": 0.08,
              },
            } as Record<string, unknown>);
            map.addLayer({
              id: ROUTE_REM_LINE,
              type: "line",
              source: ROUTE_REM_SRC,
              paint: {
                "line-color": "#94a3b8",
                "line-width": 3,
                "line-opacity": 0.45,
              },
            } as Record<string, unknown>);
          }

          // ── Traveled route (đậm) ──
          const travSrc = map.getSource(ROUTE_TRAV_SRC);
          if (travSrc) {
            travSrc.setData(travGeo);
          } else {
            map.addSource(ROUTE_TRAV_SRC, {
              type: "geojson",
              data: travGeo,
            } as Record<string, unknown>);
            map.addLayer({
              id: ROUTE_TRAV_LINE,
              type: "line",
              source: ROUTE_TRAV_SRC,
              paint: {
                "line-color": "#3b82f6",
                "line-width": 4,
                "line-opacity": 0.9,
              },
            } as Record<string, unknown>);
          }
        } catch (e) {
          console.warn("[LiveMap] drawHistoryRoute", e);
        }
      },
      [],
    );

    const clearHistoryRoute = React.useCallback(() => {
      const map = mapRef.current as MapInstance | null;
      if (!map) return;
      try {
        if (map.getLayer(ROUTE_TRAV_LINE)) map.removeLayer(ROUTE_TRAV_LINE);
        if (map.getLayer(ROUTE_REM_LINE)) map.removeLayer(ROUTE_REM_LINE);
        if (map.getLayer(ROUTE_REM_BG)) map.removeLayer(ROUTE_REM_BG);
        if (map.getSource(ROUTE_TRAV_SRC)) map.removeSource(ROUTE_TRAV_SRC);
        if (map.getSource(ROUTE_REM_SRC)) map.removeSource(ROUTE_REM_SRC);
      } catch {}
      (historyMarkerRef.current as { remove: () => void } | null)?.remove();
      historyMarkerRef.current = null;
    }, []);

    // Move history marker to a point index
    const seekHistory = React.useCallback(
      (idx: number) => {
        const pts = historyPointsRef.current;
        if (!pts.length) return;
        const clamped = Math.max(0, Math.min(idx, pts.length - 1));
        setPlayIndex(clamped);
        const p = pts[clamped];
        const VGL = vglRef.current;
        const map = mapRef.current as MapInstance | null;
        if (!VGL || !map) return;
        const isMoving = (p.speed ?? 0) > 0;
        const heading = p.heading ?? 0;
        const sm = selectedMemberRef.current;
        const memberName = sm ? sm.name || sm.userId : "";
        const bg = isMoving ? "#16a34a" : "#f97316";
        const icon = isMoving
          ? `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M12 2L6 20l6-4 6 4L12 2z"/></svg>`
          : `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><rect x="6" y="6" width="12" height="12"/></svg>`;
        const markerHtml = `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;"><div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);color:white;background:${bg};transform:rotate(${heading}deg);">${icon}</div><div style="margin-top:4px;background:white;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:500;white-space:nowrap;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.15);">${memberName}</div></div>`;

        if (!historyMarkerRef.current) {
          const el = document.createElement("div");
          el.innerHTML = markerHtml;
          historyMarkerRef.current = new (
            VGL as unknown as {
              Marker: new (o: Record<string, unknown>) => {
                setLngLat: (ll: [number, number]) => unknown;
                addTo: (m: unknown) => unknown;
              };
            }
          ).Marker({ element: el, anchor: "center" }).setLngLat([p.lng, p.lat]);
          (historyMarkerRef.current as { addTo: (m: unknown) => void }).addTo(
            map,
          );
        } else {
          (
            historyMarkerRef.current as { getElement: () => HTMLElement }
          ).getElement().innerHTML = markerHtml;
          (
            historyMarkerRef.current as {
              setLngLat: (ll: [number, number]) => void;
            }
          ).setLngLat([p.lng, p.lat]);
        }
        // Update traveled / remaining split
        if (pts.length >= 2) drawHistoryRoute(pts, clamped);
        // Auto-follow: pan only if the point is outside viewport
        if (autoFollow) {
          try {
            const bounds = map.getBounds();
            if (!bounds.contains([p.lng, p.lat])) {
              map.jumpTo({ center: [p.lng, p.lat] });
            }
          } catch {}
        }
      },
      [autoFollow, drawHistoryRoute],
    );

    // Play timer
    React.useEffect(() => {
      if (!isPlaying) {
        if (playTimerRef.current) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = null;
        }
        return;
      }
      const intervalMs = Math.round(500 / playSpeed);
      playTimerRef.current = setInterval(() => {
        const pts = historyPointsRef.current;
        setPlayIndex((prev) => {
          const next = prev + 1;
          if (next >= pts.length) {
            setIsPlaying(false);
            return pts.length - 1;
          }
          seekHistory(next);
          return next;
        });
      }, intervalMs);
      return () => {
        if (playTimerRef.current) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = null;
        }
      };
    }, [isPlaying, playSpeed, seekHistory]);

    // Draw route whenever historyPoints changes — start at index 0 (full remaining)
    React.useEffect(() => {
      if (!ready) return;
      if (historyPoints.length >= 2) {
        drawHistoryRoute(historyPoints, 0);
      } else {
        clearHistoryRoute();
      }
    }, [historyPoints, ready, drawHistoryRoute, clearHistoryRoute]);

    const openHistory = React.useCallback(
      (m: MemberStatus) => {
        setSelectedMember(m);
        setActiveUserId(m.userId);
        setHistoryPoints([]);
        setPlayIndex(0);
        setIsPlaying(false);
        clearHistoryRoute();
        (mapRef.current as MapInstance | null)?.jumpTo({
          center: [m.lng, m.lat],
          zoom: 14,
        });
      },
      [clearHistoryRoute],
    );

    const closeHistory = React.useCallback(() => {
      setSelectedMember(null);
      setHistoryPoints([]);
      setPlayIndex(0);
      setIsPlaying(false);
      setActiveUserId(null);
      clearHistoryRoute();
    }, [clearHistoryRoute]);

    // Imperative API
    React.useImperativeHandle(
      ref,
      () => ({
        flyTo: (c, z) => {
          const map = mapRef.current as MapInstance | null;
          map?.jumpTo({ center: c, zoom: z ?? map.getZoom() });
        },
        fitBounds: (bounds) => {
          const map = mapRef.current as MapInstance | null;
          map?.fitBounds(bounds, { padding: 48, duration: 600 });
        },
        focusMember: (userId) => {
          const m = membersRef.current.find((x) => x.userId === userId);
          if (!m) return;
          setActiveUserId(userId);
          (mapRef.current as MapInstance | null)?.jumpTo({
            center: [m.lng, m.lat],
            zoom: 15,
          });
          openPopup(m);
        },
        getMembers: () => membersRef.current,
        getMap: () => mapRef.current as MapInstance | null,
      }),
      [openPopup],
    );

    const handleListItemClick = (m: MemberStatus) => {
      const cb = onMemberClick;
      const shouldDefault = cb ? cb(m) !== false : true;
      if (!shouldDefault) return;

      setActiveUserId(m.userId);
      (popupRef.current as { remove: () => void } | null)?.remove();
      popupRef.current = null;
      setPopupMember(null);

      const map = mapRef.current as MapInstance | null;
      if (!map) return;

      const targetZoom = Math.max(14, map.getZoom());
      map.jumpTo({ center: [m.lng, m.lat], zoom: targetZoom });
      openPopup(m);
    };

    const listPosition = slotProps?.list?.position ?? "left";
    const legendPos = slotProps?.legend?.position ?? legendPosition;
    const tilePos = slotProps?.tileSwitcher?.position ?? tileSwitcherPosition;

    const popupContent = popupMember ? (
      renderPopupRef.current ? (
        renderPopupRef.current(popupMember)
      ) : (
        <DefaultPopup
          member={popupMember}
          onViewHistory={() => {
            openHistory(popupMember);
            (popupRef.current as { remove: () => void } | null)?.remove();
            popupRef.current = null;
            setPopupMember(null);
          }}
          onClose={() => {
            (popupRef.current as { remove: () => void } | null)?.remove();
            popupRef.current = null;
            setActiveUserId(null);
            setPopupMember(null);
          }}
        />
      )
    ) : null;

    return (
      <div
        className={cn(
          "fleetwork-root relative w-full overflow-hidden rounded-xl border bg-muted/40",
          className,
        )}
        style={{ height, ...style }}
      >
        <div ref={containerRef} className="h-full w-full" />

        {/* Spiderfy overlay — renders when multiple members share the same coordinate */}
        {spiderState && (
          <SpiderOverlay
            centerPx={spiderState.centerPx}
            members={spiderState.members}
            onSelect={(m) => {
              setSpiderState(null);
              setActiveUserId(m.userId);
              openPopup(m);
            }}
            onClose={() => setSpiderState(null)}
          />
        )}

        {showList && (
          <MemberList
            members={members}
            isLoading={isLoading}
            activeUserId={activeUserId}
            onItemClick={handleListItemClick}
            renderItem={renderMemberItem}
            position={listPosition}
            className={slotProps?.list?.className}
            style={slotProps?.list?.style}
          />
        )}

        {showLegend && (
          <Legend
            position={legendPos}
            className={slotProps?.legend?.className}
            style={slotProps?.legend?.style}
          />
        )}

        {showTileSwitcher && (
          <TileSwitcher
            value={tile}
            onChange={setTile}
            position={tilePos}
            className={slotProps?.tileSwitcher?.className}
            style={slotProps?.tileSwitcher?.style}
          />
        )}

        {/* Portal popup content into the vietmap popup container */}
        {popupMember &&
          popupContainerRef.current &&
          createPortal(popupContent, popupContainerRef.current)}

        {/* History detail panel */}
        {selectedMember && (
          <HistoryPanel
            member={selectedMember}
            onClose={closeHistory}
            onHistoryLoaded={(pts) => {
              historyPointsRef.current = pts;
              setHistoryPoints(pts);
              setPlayIndex(0);
              setIsPlaying(false);
              seekHistory(0);
              if (pts.length >= 2) {
                const lats = pts.map((p) => p.lat);
                const lngs = pts.map((p) => p.lng);
                const bounds: [[number, number], [number, number]] = [
                  [Math.min(...lngs), Math.min(...lats)],
                  [Math.max(...lngs), Math.max(...lats)],
                ];
                (mapRef.current as MapInstance | null)?.fitBounds(bounds, {
                  padding: 60,
                  duration: 800,
                });
              }
            }}
            playIndex={playIndex}
            onSeek={(idx) => seekHistory(idx)}
          />
        )}

        {/* Playback controls bar */}
        {selectedMember && historyPoints.length > 1 && (
          <PlaybackControls
            points={historyPoints}
            index={playIndex}
            isPlaying={isPlaying}
            speed={playSpeed}
            autoFollow={autoFollow}
            onSeek={(idx) => seekHistory(idx)}
            onPlayToggle={() => setIsPlaying((v) => !v)}
            onSpeedCycle={() =>
              setPlaySpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))
            }
            onAutoFollowToggle={() => setAutoFollow((v) => !v)}
          />
        )}
      </div>
    );
  },
);
