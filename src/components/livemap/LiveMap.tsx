import * as React from "react";
import { createPortal } from "react-dom";
// Imported lazily at runtime so the SDK can tree-shake when unused.
import VietmapGL from "@vietmap/vietmap-gl-js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { useMembers } from "@/hooks";
import { useFleetwork } from "@/provider/FleetworkProvider";
import { cn } from "@/lib/utils";
import { buildTileStyle } from "./tiles";
import { MemberList } from "./MemberList";
import { Legend } from "./Legend";
import { TileSwitcher } from "./TileSwitcher";
import { DefaultPopup, MarkerDot } from "./Marker";
import type { LiveMapProps, LiveMapRef, MapInstance } from "./types";
import type { MemberStatus, TileType } from "@/lib/types";

const DEFAULT_CENTER: [number, number] = [106.6, 10.8];

export const LiveMap = React.forwardRef<LiveMapRef, LiveMapProps>(
  function LiveMap(props, ref) {
    const {
      height = "100%",
      center = DEFAULT_CENTER,
      zoom = 11,
      defaultTile = "terrain",
      pollInterval = 10000,
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

    const { apiKey } = useFleetwork();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const mapRef = React.useRef<unknown>(null);
    const markersRef = React.useRef<
      Map<string, { marker: unknown; el: HTMLDivElement }>
    >(new Map());
    const popupRef = React.useRef<unknown>(null);
    const popupContainerRef = React.useRef<HTMLDivElement | null>(null);

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

    const { data: members = [], isLoading } = useMembers({ pollInterval });
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

    // Init map
    React.useEffect(() => {
      if (!containerRef.current) return;

      const map = new (
        VietmapGL as unknown as {
          Map: new (opts: Record<string, unknown>) => unknown;
        }
      ).Map({
        container: containerRef.current,
        style: buildTileStyle(tile, apiKey),
        center,
        zoom,
      }) as MapInstance & {
        on: (evt: string, handler: (e: unknown) => void) => void;
        off: (evt: string, handler: (e: unknown) => void) => void;
      };

      mapRef.current = map;

      const handleLoad = () => {
        setReady(true);
        onMapReady?.(map as MapInstance);
      };
      const handleClick = (e: unknown) => {
        const ev = e as { lngLat?: { lng: number; lat: number } };
        if (ev.lngLat) {
          onMapClickRef.current?.([ev.lngLat.lng, ev.lngLat.lat]);
        }
      };

      map.on("load", handleLoad);
      map.on("click", handleClick);

      return () => {
        markersRef.current.forEach(({ marker }) => {
          (marker as { remove: () => void }).remove();
        });
        markersRef.current.clear();
        (popupRef.current as { remove: () => void } | null)?.remove();
        popupRef.current = null;
        map.off("load", handleLoad);
        map.off("click", handleClick);
        map.remove();
        mapRef.current = null;
        setReady(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey]);

    // React to tile changes
    React.useEffect(() => {
      if (!ready || !mapRef.current) return;
      (mapRef.current as MapInstance).setStyle(buildTileStyle(tile, apiKey));
    }, [tile, apiKey, ready]);

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
        const marker = new (
          VietmapGL as unknown as {
            Marker: new (opts: Record<string, unknown>) => unknown;
          }
        ).Marker({ element: el, anchor: "center" });
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
      const popup = new (
        VietmapGL as unknown as {
          Popup: new (opts: Record<string, unknown>) => PopupInstance;
        }
      ).Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 16,
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
      if (shouldDefault) {
        setActiveUserId(m.userId);
        (mapRef.current as MapInstance | null)?.flyTo({
          center: [m.lng, m.lat],
          zoom: 14,
        });
        openPopup(m);
      }
    };

    const listPosition = slotProps?.list?.position ?? "right";
    const legendPos = slotProps?.legend?.position ?? legendPosition;
    const tilePos = slotProps?.tileSwitcher?.position ?? tileSwitcherPosition;

    const popupContent = popupMember ? (
      renderPopupRef.current ? (
        renderPopupRef.current(popupMember)
      ) : (
        <DefaultPopup member={popupMember} />
      )
    ) : null;

    return (
      <div
        className={cn(
          "fleetwork-root relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50",
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
      </div>
    );
  },
);
