// Etapas layers on the map, between the basemap and its labels (ADR-0007).
// Every layer is added once, hidden; visibility and opacity follow app state.
import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl'
import { HATCH, byGroup, layerSpecs } from '../etapas/style.ts'
import type { FieldStats, LoadedLayer } from '../etapas/types.ts'

export type LayerWithStats = LoadedLayer & { stats: FieldStats }

/** Diagonal hatch for missing data, in --ink-muted at low opacity (style.md). */
function hatchImage(size = 8): ImageData {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % size === 0 || (x + y) % size === size - 1) {
        data.set([69, 70, 71, 110], (y * size + x) * 4)
      }
    }
  }
  return new ImageData(data, size, size)
}

const specsByKey = new WeakMap<MapLibreMap, Map<string, LayerSpecification[]>>()

export function addEtapasLayers(map: MapLibreMap, layers: LayerWithStats[], beforeId?: string) {
  if (!map.hasImage(HATCH)) map.addImage(HATCH, hatchImage(), { pixelRatio: 1 })
  const registry = specsByKey.get(map) ?? new Map<string, LayerSpecification[]>()
  specsByKey.set(map, registry)
  for (const { key, layer, tilesUrl, stats } of byGroup(layers)) {
    if (map.getSource(key)) continue
    map.addSource(key, {
      type: 'vector',
      url: `pmtiles://${tilesUrl}`,
      attribution: layer.attribution,
    })
    const specs = layerSpecs(key, layer, stats)
    for (const spec of specs) {
      map.addLayer(
        { ...spec, layout: { ...spec.layout, visibility: 'none' } } as LayerSpecification,
        beforeId,
      )
    }
    registry.set(key, specs)
  }
}

const OPACITY_PROPERTY = {
  fill: 'fill-opacity',
  line: 'line-opacity',
  circle: 'circle-opacity',
} as const

export function applyLayerState(
  map: MapLibreMap,
  visible: Set<string>,
  opacity: Record<string, number>,
) {
  for (const [key, specs] of specsByKey.get(map) ?? []) {
    for (const spec of specs) {
      if (!map.getLayer(spec.id)) continue
      map.setLayoutProperty(spec.id, 'visibility', visible.has(key) ? 'visible' : 'none')
      const property = OPACITY_PROPERTY[spec.type as keyof typeof OPACITY_PROPERTY]
      if (property) map.setPaintProperty(spec.id, property, opacity[key] ?? 1)
    }
  }
}
