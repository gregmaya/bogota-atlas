import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { RED_VIAL_SPECTRAL, interpolate, sequentialRamp } from '../src/etapas/ramps.ts'
import {
  FALLBACK_CLASSES,
  HATCH,
  byGroup,
  categories,
  evenStarts,
  layerSpecs,
  sequentialClasses,
} from '../src/etapas/style.ts'
import type { EtapasFile, EtapasLayer } from '../src/etapas/types.ts'
import { layersFromSearch, withLayers } from '../src/state/url.ts'

const fixture = (producer: string) =>
  JSON.parse(
    readFileSync(new URL(`fixtures/${producer}/etapas.json`, import.meta.url), 'utf8'),
  ) as EtapasFile
const layer = (producer: string, id: string) =>
  fixture(producer).layers.find((l) => l.id === id) as EtapasLayer

const blocks = layer('bogota-pop', 'mgn_2018_manzanas')
const closeness = layer('bogota-syntax', 'centralidad_armonica_800')
const streetType = layer('bogota-syntax', 'tipo_via')
const renobo = layer('bogota-syntax', 'renobo_piloto')

describe('sequential classes', () => {
  it('use the producer breaks when given', () => {
    const classes = sequentialClasses(closeness, { min: 0, max: 142 })!
    expect(classes.starts).toEqual(closeness.style.breaks)
    expect(classes.colours).toEqual(RED_VIAL_SPECTRAL)
    expect(classes.fromProducer).toBe(true)
  })

  it('fall back to even steps between the file min and max', () => {
    const classes = sequentialClasses(blocks, { min: 0, max: 1890 })!
    expect(classes.starts).toEqual(evenStarts(0, 1890, FALLBACK_CLASSES))
    expect(classes.starts).toHaveLength(FALLBACK_CLASSES)
    expect(classes.fromProducer).toBe(false)
  })

  it('are absent rather than invented when there is no min or max', () => {
    expect(sequentialClasses(blocks, {})).toBeNull()
  })

  it('population ramp runs light to dark between the style.md ends', () => {
    const ramp = sequentialRamp('poblacion', 5)
    expect(ramp[0]).toBe('#dbad9d')
    expect(ramp.at(-1)).toBe('#7a1f1f')
    expect(interpolate(['#000000', '#ffffff'], 3)[1]).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('layerSpecs', () => {
  it('draws polygons with a hatched no-data layer under the classes', () => {
    const specs = layerSpecs('bogota-pop/mgn_2018_manzanas', blocks, { min: 0, max: 1890 })
    expect(specs.map((s) => s.type)).toEqual(['fill', 'fill'])
    expect(specs[0].paint).toEqual({ 'fill-pattern': HATCH })
    expect(specs.every((s) => 'source-layer' in s && s['source-layer'] === blocks.id)).toBe(true)
  })

  it('draws sequential lines at one width, higher values on top', () => {
    const [, line] = layerSpecs('bogota-syntax/x', closeness, { min: 0, max: 142 })
    expect(line.type).toBe('line')
    expect((line.paint as Record<string, unknown>)['line-width']).toBe(1.5)
    expect((line.layout as Record<string, unknown>)['line-sort-key']).toEqual([
      'to-number',
      ['get', 'cc_harmonic_800_ang'],
    ])
  })

  it('treats blank categories as missing data, not a category', () => {
    const stats = { values: [' ', 'AC', 'CL'] }
    expect(categories(stats)).toEqual(['AC', 'CL'])
    const [noData] = layerSpecs('bogota-syntax/tipo_via', streetType, stats)
    expect(JSON.stringify((noData as { filter?: unknown }).filter)).toContain('" "')
  })

  it('draws a dashed outline for outline layers', () => {
    const specs = layerSpecs('bogota-syntax/renobo_piloto', renobo, {})
    expect(specs).toHaveLength(1)
    expect((specs[0].paint as Record<string, unknown>)['line-dasharray']).toEqual([2, 2])
  })

  it('orders groups poblacion, red_vial, context', () => {
    const ordered = byGroup([renobo, closeness, blocks].map((l) => ({ layer: l })))
    expect(ordered.map((o) => o.layer.group)).toEqual(['poblacion', 'red_vial', 'context'])
  })
})

describe('URL state', () => {
  it('reads and writes ?layers= without losing other parameters', () => {
    const search = withLayers('?etapas=1&lang=en', ['bogota-syntax/a', 'bogota-pop/b'])
    expect(search).toBe('?etapas=1&lang=en&layers=bogota-syntax/a,bogota-pop/b')
    expect(layersFromSearch(search)).toEqual(['bogota-syntax/a', 'bogota-pop/b'])
    expect(layersFromSearch('?etapas=1')).toBeNull()
    expect(layersFromSearch('?layers=')).toEqual([])
  })
})
