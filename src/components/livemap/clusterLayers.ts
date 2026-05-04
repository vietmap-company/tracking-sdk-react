import type { MemberStatus } from '@/lib/types'
import type { MapInstance } from './types'

export const MEMBERS_SOURCE = 'dc-members'
export const LAYER_CLUSTERS = 'dc-clusters'
export const LAYER_CLUSTER_COUNT = 'dc-cluster-count'
export const LAYER_POINTS = 'dc-points'

export function toGeoJSON(members: MemberStatus[]): unknown {
  return {
    type: 'FeatureCollection',
    features: members
      .filter((m) => m.lat && m.lng)
      .map((m) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
        properties: { userId: m.userId, name: m.name, status: m.status },
      })),
  }
}

export function addClusterLayers(
  map: MapInstance,
  data: unknown,
  clusterRadius: number,
  clusterMaxZoom: number,
) {
  map.addSource(MEMBERS_SOURCE, {
    type: 'geojson',
    data,
    cluster: true,
    clusterRadius,
    clusterMaxZoom,
  } as Record<string, unknown>)

  map.addLayer({
    id: LAYER_CLUSTERS,
    type: 'circle',
    source: MEMBERS_SOURCE,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 100, '#f59e0b', 500, '#ef4444'],
      'circle-radius': ['step', ['get', 'point_count'], 16, 100, 24, 500, 32],
      'circle-opacity': 0.85,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  } as Record<string, unknown>)

  map.addLayer({
    id: LAYER_CLUSTER_COUNT,
    type: 'symbol',
    source: MEMBERS_SOURCE,
    filter: ['has', 'point_count'],
    layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 13 },
    paint: { 'text-color': '#ffffff' },
  } as Record<string, unknown>)

  map.addLayer({
    id: LAYER_POINTS,
    type: 'circle',
    source: MEMBERS_SOURCE,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['match', ['get', 'status'], 'moving', '#10b981', 'stopped', '#f59e0b', '#94a3b8'],
      'circle-radius': 8,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.95,
    },
  } as Record<string, unknown>)
}
