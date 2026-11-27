import { readFileSync } from 'node:fs'
import { open } from 'node:fs/promises'
import { PMTiles, type RangeResponse, type Source } from 'pmtiles'
import { describe, expect, it } from 'vitest'
import { checkEtapas } from '../scripts/check-etapas.ts'

const fixtureUrl = (path: string) => new URL(`fixtures/${path}`, import.meta.url)
const load = (producer: string) =>
  JSON.parse(readFileSync(fixtureUrl(`${producer}/etapas.json`), 'utf8')) as {
    producer: string
    layers: Record<string, unknown>[]
  }
const PRODUCERS = ['bogota-pop', 'bogota-syntax']
const fixtures = PRODUCERS.map(load)
const allLayers = fixtures.flatMap((f) => f.layers)

// One valid layer to break, one rule at a time.
const base = () => structuredClone(load('bogota-pop'))
const withLayer = (change: (layer: Record<string, unknown>) => void) => {
  const data = base()
  change(data.layers[0])
  return data
}

describe('fixture etapas.json', () => {
  it.each(PRODUCERS)('%s is valid, also for a release build', (producer) => {
    expect(checkEtapas(load(producer))).toEqual([])
    expect(checkEtapas(load(producer), { release: true })).toEqual([])
  })

  it('covers every style kind, a dashed outline and both geometries', () => {
    const kinds = allLayers.map((l) => (l.style as { kind: string }).kind)
    expect(new Set(kinds)).toEqual(new Set(['sequential', 'categorical', 'outline']))
    expect(allLayers.some((l) => (l.style as { dash?: boolean }).dash === true)).toBe(true)
    expect(new Set(allLayers.map((l) => l.geometry))).toEqual(new Set(['polygon', 'line']))
    expect(new Set(allLayers.map((l) => l.group))).toEqual(
      new Set(['poblacion', 'red_vial', 'context']),
    )
  })
})

class FileSource implements Source {
  private path: URL
  constructor(path: URL) {
    this.path = path
  }
  getKey() {
    return this.path.href
  }
  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const file = await open(this.path)
    try {
      const buffer = Buffer.alloc(length)
      const { bytesRead } = await file.read(buffer, 0, length, offset)
      return { data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytesRead) }
    } finally {
      await file.close()
    }
  }
}

const GEOMETRY = { Polygon: 'polygon', LineString: 'line', Point: 'point' } as Record<
  string,
  string
>

describe('fixture tiles match their etapas.json', () => {
  const cases = fixtures.flatMap((f) => f.layers.map((layer) => [f.producer, layer] as const))

  it.each(cases)('%s/%s', async (producer, layer) => {
    const tiles = new PMTiles(new FileSource(fixtureUrl(`${producer}/${layer.file as string}`)))
    const metadata = (await tiles.getMetadata()) as {
      vector_layers: { id: string; fields: Record<string, string> }[]
      tilestats: { layers: { geometry: string }[] }
    }
    // Internal layer named after the id (MapLibre's source-layer).
    expect(metadata.vector_layers.map((v) => v.id)).toEqual([layer.id])
    const fields = Object.fromEntries(
      Object.entries(metadata.vector_layers[0].fields).map(([k, v]) => [k, v.toLowerCase()]),
    )
    expect(fields).toEqual(layer.field_types)
    expect(GEOMETRY[metadata.tilestats.layers[0].geometry]).toBe(layer.geometry)
  })
})

describe('checkEtapas rejects', () => {
  const rejects = (data: unknown, pattern: RegExp, options = {}) => {
    const errors = checkEtapas(data, options)
    expect(errors.join('\n')).toMatch(pattern)
  }

  it('an unknown major schema_version', () => {
    const data = { ...base(), schema_version: '2.0' }
    rejects(data, /schema_version/)
  })

  it('text missing a language', () => {
    rejects(
      withLayer((l) => (l.title = { es: 'Manzanas' })),
      /title must have required property 'en'/,
    )
  })

  it('empty text', () => {
    rejects(
      withLayer((l) => (l.review = { es: 'ok', en: ' ' })),
      /review\/en/,
    )
  })

  it('a public lot-level layer', () => {
    rejects(
      withLayer((l) => (l.level = 'lote')),
      /public must be equal to constant/,
    )
  })

  it('a level outside the list', () => {
    rejects(
      withLayer((l) => (l.level = 'manzanas')),
      /level must be equal to one of the allowed values/,
    )
  })

  it('a missing unit on a sequential layer', () => {
    rejects(
      withLayer((l) => delete l.unit),
      /must have required property 'unit'/,
    )
  })

  it('a unit on an outline layer', () => {
    const data = structuredClone(load('bogota-syntax'))
    const outline = data.layers.find((l) => (l.style as { kind: string }).kind === 'outline')!
    outline.unit = { es: 'x', en: 'x' }
    rejects(data, /unit/)
  })

  it('dash on a layer that is not an outline', () => {
    rejects(
      withLayer((l) => ((l.style as { dash?: boolean }).dash = true)),
      /kind must be equal to constant/,
    )
  })

  it('a styled field that is not kept', () => {
    rejects(
      withLayer((l) => (l.fields = ['COD_DANE_A', 'TVIVIENDA'])),
      /style.field TP27_PERSO is not in fields/,
    )
  })

  it('field_types that do not match fields', () => {
    rejects(
      withLayer((l) => (l.field_types = { TP27_PERSO: 'number' })),
      /field_types must list exactly the fields/,
    )
  })

  it('vigencia that does not match sources', () => {
    rejects(
      withLayer((l) => (l.vigencia = { otra_fuente: '2018' })),
      /vigencia must list exactly the sources/,
    )
  })

  it('a file not named after the id', () => {
    rejects(
      withLayer((l) => (l.file = 'manzanas.pmtiles')),
      /file must be mgn_2018_manzanas.pmtiles/,
    )
  })

  it('duplicate ids', () => {
    const data = base()
    data.layers.push(structuredClone(data.layers[0]))
    rejects(data, /id is not unique/)
  })

  it('unknown keys', () => {
    rejects(
      withLayer((l) => (l.colour = '#ff0000')),
      /must NOT have additional properties/,
    )
  })

  it('breaks on a layer that is not sequential', () => {
    const data = structuredClone(load('bogota-syntax'))
    const categorical = data.layers.find((l) => l.id === 'tipo_via')!
    ;(categorical.style as { breaks?: number[] }).breaks = [1, 2]
    rejects(data, /kind must be equal to constant/)
  })

  it('breaks that are not ascending', () => {
    rejects(
      withLayer((l) => ((l.style as { breaks?: number[] }).breaks = [0, 10, 10, 5])),
      /style.breaks must be strictly ascending/,
    )
  })

  it('a private layer in a release build, but not in local mode', () => {
    const data = withLayer((l) => (l.public = false))
    expect(checkEtapas(data)).toEqual([])
    rejects(data, /private \(public: false\) in a release build/, { release: true })
  })
})
