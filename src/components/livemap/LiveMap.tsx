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
import { DefaultPopup, MarkerDot } from "./Marker";
import { HistoryPanel } from "./HistoryPanel";
import { PlaybackControls } from "./PlaybackControls";
import type { LiveMapProps, LiveMapRef, MapInstance } from "./types";
import type { GpsPoint, MemberStatus, TileType } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [106.6, 10.8];

export const LiveMap = React.forwardRef<LiveMapRef, LiveMapProps>(
  function LiveMap(props, ref) {
    const {
      height = "100%",
      center = DEFAULT_CENTER,
      zoom = 11,
      defaultTile = "terrain",
      pollInterval = 10000,
      members: membersProp,
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
    const markersRef = React.useRef<
      Map<string, { marker: unknown; el: HTMLDivElement }>
    >(new Map());
    const popupRef = React.useRef<unknown>(null);
    const popupContainerRef = React.useRef<HTMLDivElement | null>(null);
    const vglRef = React.useRef<VGL | null>(null);

    const [tile, setTile] = React.useState<TileType>(defaultTile);
    const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
    const [popupMember, setPopupMember] = React.useState<MemberStatus | null>(
      null,
    );
    const [ready, setReady] = React.useState(false);
    const [, bumpMarkerVersion] = React.useState<number>(0);
    const rerender = React.useCallback(
      () => bumpMarkerVersion((v: number) => v + 1),
      [],
    );

    // History / playback state
    const [selectedMember, setSelectedMember] =
      React.useState<MemberStatus | null>(null);
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
    React.useEffect(() => {
      historyPointsRef.current = historyPoints;
    }, [historyPoints]);

    const { data: apiMembers = [], isLoading: apiLoading } = useMembers({
      pollInterval,
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
          const handleClick = (e: unknown) => {
            const ev = e as { lngLat?: { lng: number; lat: number } };
            if (ev.lngLat) {
              onMapClickRef.current?.([ev.lngLat.lng, ev.lngLat.lat]);
            }
          };

          map.on("load", handleLoad);
          map.on("click", handleClick);
        })
        .catch((err) => {
          if (!cancelled)
            console.error("[LiveMap] Failed to load VietmapGL:", err);
        });

      return () => {
        cancelled = true;
        markersRef.current.forEach(({ marker }) => {
          (marker as { remove: () => void }).remove();
        });
        markersRef.current.clear();
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
      (mapRef.current as MapInstance).setStyle(buildTileStyle(tile, apiKeyTilemap));
    }, [tile, apiKeyTilemap, ready]);

    // Sync markers whenever members change
    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      const map = mapRef.current;
      const current = markersRef.current;
      const nextIds = new Set(members.map((m: MemberStatus) => m.userId));
      let changed = false;

      // Remove vanished
      current.forEach((entry, id) => {
        if (!nextIds.has(id)) {
          (entry.marker as { remove: () => void }).remove();
          current.delete(id);
          changed = true;
        }
      });

      // Upsert present
      members.forEach((m: MemberStatus) => {
        if (!m.lat || !m.lng) return;
        const existing = current.get(m.userId);
        if (existing) {
          (
            existing.marker as {
              setLngLat: (ll: [number, number]) => unknown;
            }
          ).setLngLat([m.lng, m.lat]);
          return;
        }
        const el = document.createElement("div");
        el.style.cursor = "pointer";
        const VGL = vglRef.current;
        if (!VGL) return;
        const marker = new (
          VGL as unknown as {
            Marker: new (opts: Record<string, unknown>) => unknown;
          }
        ).Marker({ element: el, anchor: "bottom" });
        (
          marker as {
            setLngLat: (ll: [number, number]) => {
              addTo: (m: unknown) => void;
            };
          }
        )
          .setLngLat([m.lng, m.lat])
          .addTo(map);

        el.addEventListener("click", (evt) => {
          evt.stopPropagation();
          const cb = onMarkerClickRef.current;
          const shouldDefault = cb ? cb(m) !== false : true;
          if (shouldDefault) {
            setActiveUserId(m.userId);
            openPopup(m);
            (mapRef.current as MapInstance).flyTo({
              center: [m.lng, m.lat],
              zoom: Math.max(14, (mapRef.current as MapInstance).getZoom()),
            });
          }
        });

        current.set(m.userId, { marker, el });
        changed = true;
      });

      if (changed) rerender();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members, ready]);

    const ROUTE_SOURCE = "fw-history-route";
    const ROUTE_LAYER_BG = "fw-history-route-bg";
    const ROUTE_LAYER = "fw-history-route-line";

    const drawHistoryRoute = React.useCallback((pts: GpsPoint[]) => {
      const map = mapRef.current as MapInstance | null;
      if (!map || pts.length < 2) return;
      const coords = pts.map((p) => [p.lng, p.lat]);
      const geojson = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
      };
      try {
        const src = map.getSource(ROUTE_SOURCE);
        if (src) {
          src.setData(geojson);
        } else {
          map.addSource(ROUTE_SOURCE, {
            type: "geojson",
            data: geojson,
          } as Record<string, unknown>);
          map.addLayer({
            id: ROUTE_LAYER_BG,
            type: "line",
            source: ROUTE_SOURCE,
            paint: {
              "line-color": "#3b82f6",
              "line-width": 6,
              "line-opacity": 0.15,
            },
          } as Record<string, unknown>);
          map.addLayer({
            id: ROUTE_LAYER,
            type: "line",
            source: ROUTE_SOURCE,
            paint: {
              "line-color": "#3b82f6",
              "line-width": 3,
              "line-opacity": 0.85,
            },
          } as Record<string, unknown>);
        }
      } catch (e) {
        console.warn("[LiveMap] drawHistoryRoute", e);
      }
    }, []);

    const clearHistoryRoute = React.useCallback(() => {
      const map = mapRef.current as MapInstance | null;
      if (!map) return;
      try {
        if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
        if (map.getLayer(ROUTE_LAYER_BG)) map.removeLayer(ROUTE_LAYER_BG);
        if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
      } catch {}
      // Remove history marker
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
        if (!historyMarkerRef.current) {
          const el = document.createElement("div");
          el.style.cssText =
            "width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 8px rgba(59,130,246,.5);pointer-events:none;";
          historyMarkerRef.current = new (
            VGL as unknown as {
              Marker: new (o: Record<string, unknown>) => {
                setLngLat: (ll: [number, number]) => unknown;
                addTo: (m: unknown) => unknown;
              };
            }
          ).Marker({ element: el }).setLngLat([p.lng, p.lat]);
          (historyMarkerRef.current as { addTo: (m: unknown) => void }).addTo(
            map,
          );
        } else {
          (
            historyMarkerRef.current as {
              setLngLat: (ll: [number, number]) => void;
            }
          ).setLngLat([p.lng, p.lat]);
        }
        // Auto-follow: pan only if the point is outside viewport
        if (autoFollow) {
          try {
            const bounds = map.getBounds();
            if (!bounds.contains([p.lng, p.lat])) {
              map.easeTo({ center: [p.lng, p.lat], duration: 400 });
            }
          } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      [autoFollow],
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

    // Draw route whenever historyPoints changes (and map is ready)
    React.useEffect(() => {
      if (!ready) return;
      if (historyPoints.length >= 2) {
        drawHistoryRoute(historyPoints);
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
        (mapRef.current as MapInstance | null)?.flyTo({
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

    const openPopup = React.useCallback((m: MemberStatus) => {
      const map = mapRef.current;
      if (!map) return;
      // Create popup container if not exists
      if (!popupContainerRef.current) {
        popupContainerRef.current = document.createElement("div");
      }
      // Tear down previous popup
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
        offset: 72,
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

    // Imperative API
    React.useImperativeHandle(
      ref,
      () => ({
        flyTo: (c, z) => {
          const map = mapRef.current as MapInstance | null;
          map?.flyTo({ center: c, zoom: z ?? map.getZoom() });
        },
        fitBounds: (bounds) => {
          const map = mapRef.current as MapInstance | null;
          map?.fitBounds(bounds, { padding: 48, duration: 600 });
        },
        focusMember: (userId) => {
          const m = membersRef.current.find((x) => x.userId === userId);
          if (!m) return;
          setActiveUserId(userId);
          (mapRef.current as MapInstance | null)?.flyTo({
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
      // Close any existing popup before flying
      (popupRef.current as { remove: () => void } | null)?.remove();
      popupRef.current = null;
      setPopupMember(null);

      const map = mapRef.current as (MapInstance & {
        on: (evt: string, h: () => void) => void;
        off: (evt: string, h: () => void) => void;
      }) | null;
      if (!map) return;

      const targetZoom = Math.max(14, map.getZoom());
      map.flyTo({ center: [m.lng, m.lat], zoom: targetZoom });

      // Show popup only after fly animation completes so it's always on-screen
      const onMoveEnd = () => {
        map.off("moveend", onMoveEnd);
        openPopup(m);
      };
      map.on("moveend", onMoveEnd);
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

        {/* Update markers' DOM content via React portals */}
        {members.map((m: MemberStatus) => {
          const entry = markersRef.current.get(m.userId);
          if (!entry) return null;
          return createPortal(
            <MarkerDot
              member={m}
              active={activeUserId === m.userId}
              className={slotProps?.markers?.className}
              style={slotProps?.markers?.style}
            />,
            entry.el,
            m.userId,
          );
        })}

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
              setHistoryPoints(pts);
              setPlayIndex(0);
              setIsPlaying(false);
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
