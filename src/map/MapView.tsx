import * as maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 ships its worker as a separate module; Vite must emit it as a file.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { Protocol } from 'pmtiles'
import { useEffect, useRef, useState } from 'react'
import config from '../../atlas.config.json'
import { BASEMAP_SOURCE, basemapLayers, basemapUrls, type Lang } from './basemap.ts'
import { addEtapasLayers, applyLayerState, type LayerWithStats } from './etapasLayers.ts'
import styles from './MapView.module.css'
import { siteRoot } from './siteRoot.ts'

const [west, south, east, north] = config.basemap.bounds
const ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>'

let protocolAdded = false
maplibregl.setWorkerUrl(workerUrl)

function buildStyle(lang: Lang): StyleSpecification {
  const urls = basemapUrls(siteRoot())
  const { base, labels } = basemapLayers(lang)
  return {
    version: 8,
    glyphs: urls.glyphs,
    sprite: urls.sprite,
    sources: {
      [BASEMAP_SOURCE]: { type: 'vector', url: urls.tiles, attribution: ATTRIBUTION },
    },
    // Data layers go between base and labels.
    layers: [...base, ...labels],
  }
}

interface Props {
  lang: Lang
  layers: LayerWithStats[]
  visible: Set<string>
  opacity: Record<string, number>
  /** Basemap labels on or off. */
  labels: boolean
}

/** The map, created once per language and driven imperatively (ADR-0001). */
export function MapView({ lang, layers, visible, opacity, labels }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!container.current) return
    if (!protocolAdded) {
      maplibregl.addProtocol('pmtiles', new Protocol().tile)
      protocolAdded = true
    }
    const instance = new maplibregl.Map({
      container: container.current,
      style: buildStyle(lang),
      // A view in the URL (#zoom/lat/lon) wins over the default extent.
      ...(window.location.hash
        ? {}
        : {
            bounds: [
              [west, south],
              [east, north],
            ] as [[number, number], [number, number]],
          }),
      maxBounds: [
        [west, south],
        [east, north],
      ],
      maxZoom: 19,
      hash: true, // view in the URL: #zoom/lat/lon
      attributionControl: false,
    })
    instance.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right')
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    instance.addControl(new maplibregl.ScaleControl(), 'bottom-left')
    instance.once('load', () => setMap(instance))
    return () => {
      setMap(null)
      instance.remove()
    }
  }, [lang])

  useEffect(() => {
    if (!map) return
    addEtapasLayers(map, layers, basemapLayers(lang).labels[0]?.id)
    applyLayerState(map, visible, opacity)
  }, [map, lang, layers, visible, opacity])

  useEffect(() => {
    if (!map) return
    for (const { id } of basemapLayers(lang).labels) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', labels ? 'visible' : 'none')
    }
  }, [map, lang, labels])

  return <div ref={container} className={styles.map} />
}
