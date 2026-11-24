import * as maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 ships its worker as a separate module; Vite must emit it as a file.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { Protocol } from 'pmtiles'
import { useEffect, useRef } from 'react'
import config from '../../atlas.config.json'
import { BASEMAP_SOURCE, basemapLayers, basemapUrls, type Lang } from './basemap.ts'
import styles from './MapView.module.css'

const [west, south, east, north] = config.basemap.bounds
const ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://protomaps.com">Protomaps</a>'

let protocolAdded = false
maplibregl.setWorkerUrl(workerUrl)

function buildStyle(lang: Lang): StyleSpecification {
  const urls = basemapUrls(new URL(import.meta.env.BASE_URL, window.location.href).href)
  const { base, labels } = basemapLayers(lang)
  return {
    version: 8,
    glyphs: urls.glyphs,
    sprite: urls.sprite,
    sources: {
      [BASEMAP_SOURCE]: { type: 'vector', url: urls.tiles, attribution: ATTRIBUTION },
    },
    // Data layers and Context go between base and labels (Phase 1).
    layers: [...base, ...labels],
  }
}

/** The map, created once and driven imperatively (ADR-0001). */
export function MapView({ lang }: { lang: Lang }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    if (!protocolAdded) {
      maplibregl.addProtocol('pmtiles', new Protocol().tile)
      protocolAdded = true
    }
    const map = new maplibregl.Map({
      container: container.current,
      style: buildStyle(lang),
      bounds: [
        [west, south],
        [east, north],
      ],
      maxBounds: [
        [west, south],
        [east, north],
      ],
      maxZoom: 19,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left')
    return () => map.remove()
  }, [lang])

  return <div ref={container} className={styles.map} />
}
