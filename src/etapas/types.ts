// Shape of etapas.json (schema/etapas.schema.json), as the app uses it.

export interface Text {
  es: string
  en: string
}

export interface EtapasLayer {
  id: string
  title: Text
  description: Text
  method: Text
  review: Text
  group: 'poblacion' | 'red_vial' | 'context'
  stage: string
  sources: string[]
  level: string
  public: boolean
  fields: string[]
  style: {
    field: string
    kind: 'sequential' | 'categorical' | 'outline'
    dash?: boolean
    breaks?: number[]
  }
  unit?: Text
  /** Optional: one panel entry for several layers (contract-notes item 6). */
  series?: { id: string; title: Text }
  parameter?: { label: Text; value: number; unit?: string }
  subtitle?: Text
  minzoom: number
  maxzoom: number
  file: string
  geometry: 'polygon' | 'line' | 'point'
  field_types: Record<string, 'string' | 'number' | 'boolean'>
  bounds: [number, number, number, number]
  vigencia: Record<string, string | null>
  attribution: string
}

export interface EtapasFile {
  schema_version: string
  producer: string
  created: string
  commit: string
  layers: EtapasLayer[]
}

/** A layer with where it came from: keyed producer/id (ADR-0006). */
export type Channel = 'release' | 'dev' | 'local' | 'fixture'

export interface LoadedLayer {
  key: string
  producer: string
  /** Where the file came from; only 'release' shows outside Etapas (ADR-0008). */
  channel: Channel
  layer: EtapasLayer
  /** Absolute URL of the layer's PMTiles file. */
  tilesUrl: string
}

/** What the tiles say about the styled field (GDAL tilestats in the PMTiles metadata). */
export interface FieldStats {
  min?: number
  max?: number
  /** Distinct values, complete only when the file has few of them. */
  values?: (string | number)[]
}
