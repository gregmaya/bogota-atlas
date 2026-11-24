// Basemap style, split around the data (ADR-0007):
//   base   = every Protomaps layer except symbols, drawn below the data
//   labels = the symbol layers in the active language, drawn above everything
import { layers, namedFlavor } from '@protomaps/basemaps'
import type { LayerSpecification } from 'maplibre-gl'
import config from '../../atlas.config.json'

export type Lang = 'es' | 'en'

export const BASEMAP_SOURCE = 'protomaps'

/** Language from the URL (ADR-0004): `?lang=en` for English, Spanish otherwise. */
export function langFromSearch(search: string): Lang {
  return new URLSearchParams(search).get('lang') === 'en' ? 'en' : 'es'
}

/** Where the basemap files are served, as absolute URLs (MapLibre needs them for sprites). */
export function basemapUrls(siteRoot: string) {
  const root = new URL(`data/basemap/${config.basemap.release}/`, siteRoot).href
  return {
    tiles: `pmtiles://${root}basemap.pmtiles`,
    glyphs: `${root}fonts/{fontstack}/{range}.pbf`,
    sprite: `${root}sprites/v4/${config.basemap.flavor}`,
  }
}

const PAPER = '#ffffff' // --paper in src/styles/tokens.css

/** Every label halo in --paper, so labels stay readable over dark data classes (style.md). */
function withPaperHalo(layer: LayerSpecification): LayerSpecification {
  if (layer.type !== 'symbol' || !layer.paint?.['text-halo-color']) return layer
  return { ...layer, paint: { ...layer.paint, 'text-halo-color': PAPER } }
}

export function basemapLayers(lang: Lang): {
  base: LayerSpecification[]
  labels: LayerSpecification[]
} {
  const all = layers(BASEMAP_SOURCE, namedFlavor(config.basemap.flavor), { lang })
  return {
    base: all.filter((layer) => layer.type !== 'symbol'),
    labels: all.filter((layer) => layer.type === 'symbol').map(withPaperHalo),
  }
}
