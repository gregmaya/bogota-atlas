// Read the etapas.json files listed in data/etapas-index.json (written by
// scripts/fetch-data.mjs) and the field statistics stored in each PMTiles file.
import { PMTiles } from 'pmtiles'
import type { Channel, EtapasFile, FieldStats, LoadedLayer } from './types.ts'

export interface IndexEntry {
  producer: string
  /** Path of the producer's etapas.json, relative to data/. */
  path: string
  channel: Channel
}

/** Outside Etapas only release layers are listed (ADR-0008). */
export const listed = (entry: IndexEntry, etapas: boolean) => etapas || entry.channel === 'release'

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return (await response.json()) as T
}

export async function loadLayers(dataRoot: string, etapas: boolean): Promise<LoadedLayer[]> {
  const index = await getJson<IndexEntry[]>(new URL('etapas-index.json', dataRoot).href)
  const files = await Promise.all(
    index
      .filter((entry) => listed(entry, etapas))
      .map(async (entry) => {
        const url = new URL(entry.path, dataRoot).href
        return { url, channel: entry.channel, file: await getJson<EtapasFile>(url) }
      }),
  )
  return files.flatMap(({ url, channel, file }) =>
    file.layers.map((layer) => ({
      key: `${file.producer}/${layer.id}`,
      producer: file.producer,
      channel,
      layer,
      tilesUrl: new URL(layer.file, url).href,
    })),
  )
}

interface TileStats {
  tilestats?: {
    layers?: {
      layer: string
      attributes?: { attribute: string; min?: number; max?: number; values?: (string | number)[] }[]
    }[]
  }
}

/** min, max and values of one field, from GDAL's tilestats in the PMTiles metadata. */
export function fieldStats(metadata: unknown, layerId: string, field: string): FieldStats {
  const layer = (metadata as TileStats).tilestats?.layers?.find((l) => l.layer === layerId)
  const attribute = layer?.attributes?.find((a) => a.attribute === field)
  if (!attribute) return {}
  return {
    min: attribute.min ?? undefined,
    max: attribute.max ?? undefined,
    values: attribute.values,
  }
}

export async function loadFieldStats(loaded: LoadedLayer): Promise<FieldStats> {
  const metadata = await new PMTiles(loaded.tilesUrl).getMetadata()
  return fieldStats(metadata, loaded.layer.id, loaded.layer.style.field)
}
