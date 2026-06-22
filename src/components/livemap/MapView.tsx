import * as React from "react";
import { createPortal } from "react-dom";
import { useMembers } from "@/hooks";
import { useOptionalFleetwork } from "@/provider/FleetworkProvider";
import { loadVietmapGL, type VGL } from "./vgl-loader";
import { buildTileStyle } from "./tiles";
import {
  MEMBERS_SOURCE,
  SELECTED_SOURCE,
  LAYER_CLUSTERS,
  LAYER_POINTS,
  LAYER_SELECTED_POINT,
  toGeoJSON,
  toSelectedGeoJSON,
  addClusterLayers,
} from "./clusterLayers";
import type { LiveMapProps, LiveMapRef, MapInstance } from "./types";
import type { MemberStatus, TileType } from "@/lib/types";
import { MemberList } from "./MemberList";
import { TileSwitcher } from "./TileSwitcher";
import { Legend } from "./Legend";
import { DefaultPopup } from "./Marker";
import { HistoryPanel } from "./HistoryPanel";
import { PlaybackControls } from "./PlaybackControls";
import { SpiderOverlay } from "./SpiderOverlay";
import { usePlayback } from "./usePlayback";

export const LiveMap = React.forwardRef<LiveMapRef, LiveMapProps>(
  function LiveMap(props, ref) {
    const {
      height = "100dvh",
      center = [106.6, 10.8],
      zoom = 11,
      defaultTile = "terrain",
      apiKeyTilemap,
      pollInterval = 10_000,
      maxUsers = 3000,
      userIds,
      clusterRadius = 50,
      clusterMaxZoom = 14,
      members: membersProp,
      memberNameKey: memberNameKeyProp,
      showList = true,
      className,
      style,
      onMemberClick,
      onMarkerClick,
      onMapClick,
      onMapReady,
      renderMarkerPopup,
    } = props;

    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mapRef = React.useRef<MapInstance | null>(null);
    const vglRef = React.useRef<VGL | null>(null);
    const popupRef = React.useRef<{ remove: () => void } | null>(null);
    const popupContainerRef = React.useRef<HTMLDivElement | null>(null);
    const membersRef = React.useRef<MemberStatus[]>([]);
    const selectedMemberRef = React.useRef<MemberStatus | null>(null);
    const hasFitRef = React.useRef(false);
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

    const [tile, setTile] = React.useState<TileType>(defaultTile);
    const [activeUserId, setActiveUserId] = React.useState<string | null>(null);
    const [popupMember, setPopupMember] = React.useState<MemberStatus | null>(
      null,
    );
    const [selectedMember, setSelectedMember] =
      React.useState<MemberStatus | null>(null);
    const [spiderState, setSpiderState] = React.useState<{
      centerPx: { x: number; y: number };
      members: MemberStatus[];
    } | null>(null);
    // Auto-expanded spiders for groups of overlapping members. Stored as
    // lat/lng so they re-project correctly while the map is panning/zooming.
    const [autoSpiderGroups, setAutoSpiderGroups] = React.useState<
      {
        key: string;
        coord: [number, number];
        members: MemberStatus[];
      }[]
    >([]);
    // Ref mirror so the RAF guard (in the map 'move' handler) can skip
    // scheduling a tick when there are no spider groups to animate.
    const autoSpiderGroupsRef = React.useRef<typeof autoSpiderGroups>([]);
    React.useEffect(() => {
      autoSpiderGroupsRef.current = autoSpiderGroups;
    }, [autoSpiderGroups]);
    // Bumped on every map `move` frame (RAF-throttled) so the inline
    // `m.project()` call below reruns and the spiders track the map smoothly
    // instead of staying frozen at their old pixel position during drag.
    const [moveTick, setMoveTick] = React.useState(0);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      selectedMemberRef.current = selectedMember;
    }, [selectedMember]);

    // Mirror `activeUserId` into a ref so map event handlers (registered once
    // on init) always read the latest value without re-subscribing.
    const activeUserIdRef = React.useRef<string | null>(activeUserId);
    React.useEffect(() => {
      activeUserIdRef.current = activeUserId;
    }, [activeUserId]);

    // Per-component prop overrides Provider-level config.
    const ctx = useOptionalFleetwork();
    const memberNameKey = memberNameKeyProp ?? ctx?.memberNameKey;

    const { data: apiMembers = [], isLoading: apiLoading } = useMembers({
      pollInterval,
      nameKey: memberNameKey,
      maxUsers,
      userIds,
      enabled: !membersProp,
    });
    const members = membersProp ?? apiMembers;
    const isLoading = membersProp != null ? false : apiLoading;
    React.useEffect(() => {
      membersRef.current = members;
    }, [members]);

    const {
      historyPoints,
      setHistoryPoints,
      historyPointsRef,
      playIndex,
      setPlayIndex,
      isPlaying,
      setIsPlaying,
      playSpeed,
      setPlaySpeed,
      autoFollow,
      setAutoFollow,
      seekHistory,
      clearHistoryRoute,
    } = usePlayback({ mapRef, vglRef, selectedMemberRef, ready });

    // ── Open popup ──────────────────────────────────────────────────────────────
    const openPopup = React.useCallback((m: MemberStatus) => {
      if (!mapRef.current || !vglRef.current) return;
      if (!popupContainerRef.current)
        popupContainerRef.current = document.createElement("div");
      popupRef.current?.remove();
      type PopupInst = {
        setLngLat: (ll: [number, number]) => PopupInst;
        setDOMContent: (el: HTMLElement) => PopupInst;
        addTo: (m: unknown) => PopupInst;
        remove: () => void;
        on: (evt: string, h: () => void) => void;
      };
      const popup = new (
        vglRef.current as unknown as { Popup: new (o: object) => PopupInst }
      ).Popup({ closeButton: false, closeOnClick: false, offset: 15 });
      popup
        .setLngLat([m.lng, m.lat])
        .setDOMContent(popupContainerRef.current!)
        .addTo(mapRef.current);
      popup.on("close", () => setPopupMember(null));
      popupRef.current = popup;
      setPopupMember(m);
    }, []);

    const closePopup = React.useCallback(() => {
      popupRef.current?.remove();
      popupRef.current = null;
      setPopupMember(null);
      setActiveUserId(null);
    }, []);

    const openHistory = React.useCallback(
      (m: MemberStatus) => {
        // Hide popup but keep the marker selected so the user still sees which
        // member they're viewing history for.
        popupRef.current?.remove();
        popupRef.current = null;
        setPopupMember(null);
        setSelectedMember(m);
        setActiveUserId(m.userId);
        setHistoryPoints([]);
        setPlayIndex(0);
        setIsPlaying(false);
        clearHistoryRoute();
        mapRef.current?.jumpTo({ center: [m.lng, m.lat], zoom: 14 });
      },
      [clearHistoryRoute, setHistoryPoints, setPlayIndex, setIsPlaying],
    );

    const closeHistory = React.useCallback(() => {
      setSelectedMember(null);
      setHistoryPoints([]);
      setPlayIndex(0);
      setIsPlaying(false);
      setActiveUserId(null);
      clearHistoryRoute();
    }, [clearHistoryRoute, setHistoryPoints, setPlayIndex, setIsPlaying]);

    const handleHistoryLoaded = React.useCallback(
      (pts: typeof historyPoints) => {
        historyPointsRef.current = pts;
        setHistoryPoints(pts);
        setPlayIndex(0);
        setIsPlaying(false);
        seekHistory(0);
        if (pts.length >= 2) {
          const lats = pts.map((p) => p.lat),
            lngs = pts.map((p) => p.lng);
          mapRef.current?.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, duration: 800 },
          );
        }
      },
      [
        historyPointsRef,
        seekHistory,
        setHistoryPoints,
        setPlayIndex,
        setIsPlaying,
      ],
    );

    // ── Sync popup position + data when members poll update ─────────────────
    React.useEffect(() => {
      if (!popupMember) return;
      const updated = members.find((m) => m.userId === popupMember.userId);
      if (!updated) return;
      // Update popup lngLat if member moved
      if (updated.lat !== popupMember.lat || updated.lng !== popupMember.lng) {
        (
          popupRef.current as {
            setLngLat?: (ll: [number, number]) => void;
          } | null
        )?.setLngLat?.([updated.lng, updated.lat]);
      }
      // Always refresh popup content (speed, status may change)
      setPopupMember(updated);
    }, [members]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync selectedMember (HistoryPanel header) when members poll update ────
    React.useEffect(() => {
      if (!selectedMember) return;
      const updated = members.find((m) => m.userId === selectedMember.userId);
      if (updated) setSelectedMember(updated);
    }, [members]); // eslint-disable-line react-hooks/exhaustive-deps

    // Init map
    React.useEffect(() => {
      if (!containerRef.current) return;
      let cancelled = false,
        map: MapInstance | null = null;
      // Hoist RAF IDs outside .then() so the cleanup function can cancel them.
      let recomputeRafId: number | null = null;
      let rafId: number | null = null;
      loadVietmapGL()
        .then((VGL) => {
          if (cancelled || !containerRef.current) return;
          vglRef.current = VGL;
          map = new (
            VGL as unknown as { Map: new (o: object) => MapInstance }
          ).Map({
            container: containerRef.current,
            style: buildTileStyle(tile, apiKeyTilemap),
            center,
            zoom,
            attributionControl: false,
          });
          mapRef.current = map;
          map.on("load", () => {
            if (!cancelled) {
              setReady(true);
              onMapReady?.(map as MapInstance);
            }
          });
          map.on("click", (e: unknown) => {
            const ev = e as {
              lngLat?: { lng: number; lat: number };
              point?: { x: number; y: number };
            };
            const m = mapRef.current;
            if (ev.point && m?.queryRenderedFeatures) {
              const features = m.queryRenderedFeatures(
                [ev.point.x, ev.point.y],
                { layers: [LAYER_CLUSTERS, LAYER_POINTS, LAYER_SELECTED_POINT] },
              );
              if (features && features.length > 0) {
                const f = features[0];
                if (f.layer.id === LAYER_CLUSTERS) {
                  m.easeTo({
                    center: f.geometry.coordinates as [number, number],
                    zoom: m.getZoom() + 3,
                    duration: 500,
                  });
                  return;
                }
                if (f.layer.id === LAYER_POINTS || f.layer.id === LAYER_SELECTED_POINT) {
                  const px = ev.point as { x: number; y: number };
                  const clickedCoord = f.geometry.coordinates as [
                    number,
                    number,
                  ];

                  // Check for overlapping points → spiderfy
                  const nearby =
                    m.queryRenderedFeatures?.(
                      [
                        [px.x - 12, px.y - 12],
                        [px.x + 12, px.y + 12],
                      ] as [[number, number], [number, number]],
                      { layers: [LAYER_POINTS] },
                    ) ?? [];
                  const overlapping = nearby.filter((feat) => {
                    const c = feat.geometry.coordinates as [number, number];
                    return (
                      Math.abs(c[0] - clickedCoord[0]) < 0.00002 &&
                      Math.abs(c[1] - clickedCoord[1]) < 0.00002
                    );
                  });

                  // Dense overlap (> 8): fall back to manual click-to-spider so
                  // the screen doesn't choke on a 50-leaf fan. Smaller groups are
                  // already auto-expanded via the `idle` recomputation.
                  if (overlapping.length > 8) {
                    // Build a Map for O(1) lookup across all overlapping features.
                    const memberMap = new Map(
                      membersRef.current.map((x) => [x.userId, x]),
                    );
                    const spiderMembers = overlapping
                      .map((feat) =>
                        memberMap.get(feat.properties.userId as string),
                      )
                      .filter((x): x is MemberStatus => x != null);
                    const centerPx = m.project?.(clickedCoord) ?? {
                      x: px.x,
                      y: px.y,
                    };
                    popupRef.current?.remove();
                    popupRef.current = null;
                    setPopupMember(null);
                    setSpiderState({ centerPx, members: spiderMembers });
                    return;
                  }

                  const member = membersRef.current.find(
                    (x) => x.userId === (f.properties.userId as string),
                  );
                  if (
                    member &&
                    (onMarkerClickRef.current
                      ? onMarkerClickRef.current(member) !== false
                      : true)
                  ) {
                    if (selectedMemberRef.current) {
                      openHistory(member);
                    } else {
                      setActiveUserId(member.userId);
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
            if (ev.lngLat) {
              setSpiderState(null);
              onMapClickRef.current?.([ev.lngLat.lng, ev.lngLat.lat]);
            }
          });
          map.on("mousemove", (e: unknown) => {
            const ev = e as { point?: { x: number; y: number } };
            const canvas = mapRef.current?.getCanvas?.();
            if (!canvas || !ev.point || !mapRef.current?.queryRenderedFeatures)
              return;
            const features = mapRef.current.queryRenderedFeatures(
              [ev.point.x, ev.point.y],
              { layers: [LAYER_CLUSTERS, LAYER_POINTS, LAYER_SELECTED_POINT] },
            );
            canvas.style.cursor =
              features && features.length > 0 ? "pointer" : "";
          });
          map.on("styledata", () => {
            const m = mapRef.current;
            if (!m || m.getSource(MEMBERS_SOURCE)) return;
            try {
              addClusterLayers(
                m,
                toGeoJSON(membersRef.current, activeUserIdRef.current),
                toSelectedGeoJSON(membersRef.current, activeUserIdRef.current),
                clusterRadius,
                clusterMaxZoom,
              );
            } catch {
              /* retry */
            }
          });

          // Recompute auto-expanded spider groups whenever the map settles
          // (after pan/zoom). Groups of overlapping unclustered points are shown
          // as fanned-out spiders without requiring an extra click.
          const recompute = () => {
            const m = mapRef.current;
            if (!m?.queryRenderedFeatures) {
              setAutoSpiderGroups((prev) => (prev.length === 0 ? prev : []));
              return;
            }
            const features =
              m.queryRenderedFeatures({ layers: [LAYER_POINTS] }) ?? [];
            if (features.length === 0) {
              setAutoSpiderGroups((prev) => (prev.length === 0 ? prev : []));
              return;
            }

            // Build O(1) member lookup once instead of O(n) find per feature.
            const memberMap = new Map(
              membersRef.current.map((x) => [x.userId, x]),
            );
            const groups = new Map<
              string,
              {
                coord: [number, number];
                members: MemberStatus[];
                seen: Set<string>;
              }
            >();
            for (const f of features) {
              const c = f.geometry.coordinates as [number, number];
              // ~1m precision at the equator — anything finer is GPS noise.
              const key = `${c[0].toFixed(5)},${c[1].toFixed(5)}`;
              const uid = f.properties?.userId as string;
              const member = memberMap.get(uid);
              if (!member) continue;
              let g = groups.get(key);
              if (!g) {
                g = { coord: c, members: [], seen: new Set() };
                groups.set(key, g);
              }
              // Use Set for O(1) dedup instead of Array.find.
              if (!g.seen.has(uid)) {
                g.seen.add(uid);
                g.members.push(member);
              }
            }
            const out: {
              key: string;
              coord: [number, number];
              members: MemberStatus[];
            }[] = [];
            groups.forEach((g, key) => {
              // Auto-spider only small overlapping groups; very dense stacks keep
              // the existing click-to-spider pattern so the screen doesn't choke.
              if (g.members.length < 2 || g.members.length > 8) return;
              out.push({ key, coord: g.coord, members: g.members });
            });
            // Bail out early if nothing changed to avoid a superfluous re-render.
            setAutoSpiderGroups((prev) => {
              if (
                prev.length === out.length &&
                prev.every(
                  (p, i) =>
                    p.key === out[i].key &&
                    p.members.length === out[i].members.length,
                )
              )
                return prev;
              return out;
            });
          };

          // Deduplicate back-to-back idle + moveend events with a single
          // RAF-scheduled call so recompute runs at most once per frame.
          const scheduleRecompute = () => {
            if (recomputeRafId !== null) return;
            recomputeRafId = requestAnimationFrame(() => {
              recomputeRafId = null;
              recompute();
            });
          };
          map.on("idle", scheduleRecompute);
          map.on("moveend", scheduleRecompute);

          // Track every animation frame during pan/zoom so spiders stay
          // glued to their underlying lat/lng instead of drifting with the
          // viewport. Skip scheduling entirely when there are no active spider
          // groups — eliminates spurious re-renders during normal map usage.
          map.on("move", () => {
            if (rafId !== null || autoSpiderGroupsRef.current.length === 0)
              return;
            rafId = requestAnimationFrame(() => {
              rafId = null;
              setMoveTick((t) => (t + 1) | 0);
            });
          });
        })
        .catch((err) => {
          if (!cancelled)
            console.error("[LiveMap] VietmapGL load failed:", err);
        });
      return () => {
        cancelled = true;
        if (recomputeRafId !== null) cancelAnimationFrame(recomputeRafId);
        if (rafId !== null) cancelAnimationFrame(rafId);
        popupRef.current?.remove();
        popupRef.current = null;
        try {
          map?.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKeyTilemap]);

    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      mapRef.current.setStyle(buildTileStyle(tile, apiKeyTilemap));
    }, [tile, apiKeyTilemap, ready]);

    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      const map = mapRef.current;
      const data = toGeoJSON(members, activeUserId);
      const selectedData = toSelectedGeoJSON(members, activeUserId);
      try {
        const src = map.getSource(MEMBERS_SOURCE);
        if (src) {
          src.setData(data);
          (map.getSource(SELECTED_SOURCE) as { setData: (d: unknown) => void } | undefined)?.setData(selectedData);
        } else {
          addClusterLayers(map, data, selectedData, clusterRadius, clusterMaxZoom);
        }
      } catch (e) {
        console.warn("[LiveMap] sync members:", e);
      }
      if (!hasFitRef.current) {
        const pts = members.filter((m) => m.lat && m.lng);
        if (pts.length >= 2) {
          hasFitRef.current = true;
          const lats = pts.map((m) => m.lat),
            lngs = pts.map((m) => m.lng);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 60, duration: 0 },
          );
        } else if (pts.length === 1) {
          hasFitRef.current = true;
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
    }, [members, ready, activeUserId]);

    // Project lat/lng coords into screen pixels every render. Re-evaluated
    // each animation frame during pan/zoom (via `moveTick`) so spiders track
    // the map smoothly rather than freezing at their pre-drag pixel position.
    const autoSpidersRendered = React.useMemo(() => {
      const m = mapRef.current;
      if (!m?.project) return [];
      return autoSpiderGroups
        .map((g) => {
          const px = m.project!(g.coord);
          return px ? { ...g, centerPx: px } : null;
        })
        .filter(
          (
            x,
          ): x is {
            key: string;
            coord: [number, number];
            members: MemberStatus[];
            centerPx: { x: number; y: number };
          } => x != null,
        );
      // moveTick is intentional — it forces re-projection on map movement.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSpiderGroups, moveTick]);

    React.useImperativeHandle(
      ref,
      () => ({
        flyTo: (c, z) =>
          mapRef.current?.jumpTo({
            center: c,
            zoom: z ?? mapRef.current.getZoom(),
          }),
        fitBounds: (bounds) =>
          mapRef.current?.fitBounds(bounds, { padding: 48, duration: 600 }),
        focusMember: (userId) => {
          const m = membersRef.current.find((x) => x.userId === userId);
          if (!m) return;
          setActiveUserId(userId);
          mapRef.current?.jumpTo({ center: [m.lng, m.lat], zoom: 15 });
          openPopup(m);
        },
        getMembers: () => membersRef.current,
        getMap: () => mapRef.current,
      }),
      [openPopup],
    );

    const popupContent = popupMember ? (
      renderPopupRef.current ? (
        renderPopupRef.current(popupMember)
      ) : (
        <DefaultPopup
          member={popupMember}
          onClose={closePopup}
          onViewHistory={() => openHistory(popupMember)}
        />
      )
    ) : null;

    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 ${className ?? ""}`}
        style={{ height, ...style }}
      >
        <div ref={containerRef} className="h-full w-full" />
        {showList && (
          <MemberList
            members={members}
            isLoading={isLoading}
            activeUserId={activeUserId}
            collapseOnSelect={typeof window !== 'undefined' && window.innerWidth < 640}
            onItemClick={(m) => {
              if (onMemberClick ? onMemberClick(m) === false : false) return;
              // If history panel is open → switch to history of new member,
              // but ignore if the user clicks the member already being viewed.
              if (selectedMember) {
                if (m.userId !== selectedMember.userId) openHistory(m);
                return;
              }
              setActiveUserId(m.userId);
              popupRef.current?.remove();
              popupRef.current = null;
              setPopupMember(null);
              const map = mapRef.current;
              if (!map) return;
              map.jumpTo({
                center: [m.lng, m.lat],
                zoom: Math.max(14, map.getZoom()),
              });
              openPopup(m);
            }}
            position="left"
          />
        )}
        <Legend position="top-right" className="max-sm:hidden" />
        <TileSwitcher value={tile} onChange={setTile} position="bottom-right" />
        {popupMember &&
          popupContainerRef.current &&
          createPortal(popupContent, popupContainerRef.current)}
        {/* Auto-expanded spiders for small overlapping groups. Always visible,
          map stays interactive (no backdrop). Coords reproject every frame
          during drag so spiders glide with the map. */}
        {autoSpidersRendered.map((g) => (
          <SpiderOverlay
            key={g.key}
            centerPx={g.centerPx}
            members={g.members}
            interactive={false}
            activeUserId={activeUserId}
            onSelect={(m) => {
              setActiveUserId(m.userId);
              openPopup(m);
            }}
          />
        ))}
        {/* Click-triggered spider for very dense groups (size > 8). */}
        {spiderState && (
          <SpiderOverlay
            centerPx={spiderState.centerPx}
            members={spiderState.members}
            activeUserId={activeUserId}
            onSelect={(m) => {
              setSpiderState(null);
              setActiveUserId(m.userId);
              openPopup(m);
            }}
            onClose={() => setSpiderState(null)}
          />
        )}
        {selectedMember && (
          <HistoryPanel
            key={selectedMember.userId}
            member={selectedMember}
            onClose={closeHistory}
            onHistoryLoaded={handleHistoryLoaded}
            playIndex={playIndex}
            onSeek={seekHistory}
            isPlaying={isPlaying}
            playSpeed={playSpeed}
            autoFollow={autoFollow}
            onPlayToggle={() => setIsPlaying((v) => !v)}
            onSpeedCycle={() => setPlaySpeed((sp) => (sp === 1 ? 2 : sp === 2 ? 4 : 1))}
            onAutoFollowToggle={() => setAutoFollow((v) => !v)}
          />
        )}
        {/* Desktop-only float playback bar — on mobile it's embedded inside HistoryPanel sheet */}
        {selectedMember && historyPoints.length > 1 && (
          <div className="hidden sm:block">
            <PlaybackControls
              points={historyPoints}
              index={playIndex}
              isPlaying={isPlaying}
              speed={playSpeed}
              autoFollow={autoFollow}
              onSeek={seekHistory}
              onPlayToggle={() => setIsPlaying((v) => !v)}
              onSpeedCycle={() => setPlaySpeed((sp) => (sp === 1 ? 2 : sp === 2 ? 4 : 1))}
              onAutoFollowToggle={() => setAutoFollow((v) => !v)}
            />
          </div>
        )}
      </div>
    );
  },
);
