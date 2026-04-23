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
            (mapRef.current as MapInstance).jumpTo({
              center: [m.lng, m.lat],
              zoom: Math.max(14, (mapRef.current as MapInstance).getZoom()),
            });
          }
        });

        current.set(m.userId, { marker, el });
        changed = true;
      });

      if (changed) rerender();

      // fitBounds to all markers — only the first time we get data
      if (!hasFitInitialRef.current) {
        const pts = members.filter((m) => m.lat && m.lng);
        if (pts.length >= 2) {
          hasFitInitialRef.current = true;
          const lats = pts.map((m) => m.lat);
          const lngs = pts.map((m) => m.lng);
          (mapRef.current as MapInstance).fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 60, duration: 0 },
          );
        } else if (pts.length === 1) {
          hasFitInitialRef.current = true;
          (mapRef.current as MapInstance).fitBounds(
            [[pts[0].lng, pts[0].lat], [pts[0].lng, pts[0].lat]],
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

    const drawHistoryRoute = React.useCallback((pts: GpsPoint[], playIdx: number) => {
      const map = mapRef.current as MapInstance | null;
      if (!map || pts.length < 2) return;

      const ci = Math.max(0, Math.min(playIdx, pts.length - 1));
      const travCoords = pts.slice(0, ci + 1).map((p) => [p.lng, p.lat]);
      const remCoords = pts.slice(ci).map((p) => [p.lng, p.lat]);

      const travGeo = { type: "Feature", geometry: { type: "LineString", coordinates: travCoords } };
      const remGeo = { type: "Feature", geometry: { type: "LineString", coordinates: remCoords } };

      try {
        // ── Remaining route (mờ, dashed) ──
        const remSrc = map.getSource(ROUTE_REM_SRC);
        if (remSrc) {
          remSrc.setData(remGeo);
        } else {
          map.addSource(ROUTE_REM_SRC, { type: "geojson", data: remGeo } as Record<string, unknown>);
          map.addLayer({
            id: ROUTE_REM_BG,
            type: "line",
            source: ROUTE_REM_SRC,
            paint: { "line-color": "#94a3b8", "line-width": 6, "line-opacity": 0.08 },
          } as Record<string, unknown>);
          map.addLayer({
            id: ROUTE_REM_LINE,
            type: "line",
            source: ROUTE_REM_SRC,
            paint: { "line-color": "#94a3b8", "line-width": 3, "line-opacity": 0.45 },
          } as Record<string, unknown>);
        }

        // ── Traveled route (đậm) ──
        const travSrc = map.getSource(ROUTE_TRAV_SRC);
        if (travSrc) {
          travSrc.setData(travGeo);
        } else {
          map.addSource(ROUTE_TRAV_SRC, { type: "geojson", data: travGeo } as Record<string, unknown>);
          map.addLayer({
            id: ROUTE_TRAV_LINE,
            type: "line",
            source: ROUTE_TRAV_SRC,
            paint: { "line-color": "#3b82f6", "line-width": 4, "line-opacity": 0.9 },
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
        const memberName = sm ? (sm.name || sm.userId) : "";
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
          (historyMarkerRef.current as { addTo: (m: unknown) => void }).addTo(map);
        } else {
          (historyMarkerRef.current as { getElement: () => HTMLElement }).getElement().innerHTML = markerHtml;
          (historyMarkerRef.current as { setLngLat: (ll: [number, number]) => void }).setLngLat([p.lng, p.lat]);
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
      // Close any existing popup before flying
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
              // Update ref synchronously so seekHistory(0) can read it immediately
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
                (mapRef.current as MapInstance | null)?.fitBounds(bounds, { padding: 60, duration: 800 });
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
