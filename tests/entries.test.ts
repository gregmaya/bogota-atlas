import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { EtapasFile, LoadedLayer } from '../src/etapas/types.ts'
import {
  buildEntries,
  formatParameter,
  isOverlay,
  memberFor,
  sharedSubtitle,
} from '../src/panels/entries.ts'
import { labelsFromSearch, withParam } from '../src/state/url.ts'
import { checkEtapas } from '../scripts/check-etapas.ts'

const file = JSON.parse(
  readFileSync(new URL('fixtures/bogota-syntax/etapas.json', import.meta.url), 'utf8'),
) as EtapasFile
const loaded: LoadedLayer[] = file.layers.map((layer) => ({
  key: `bogota-syntax/${layer.id}`,
  producer: 'bogota-syntax',
  channel: 'fixture',
  layer,
  tilesUrl: `https://example.test/${layer.file}`,
}))

describe('buildEntries', () => {
  const entries = buildEntries([...loaded].reverse())

  it('folds a series into one entry, members ordered by parameter', () => {
    const series = entries.find((e) => e.id === 'bogota-syntax/centralidad_armonica')!
    expect(series.title.es).toBe('Cercanía armónica angular (muestra)')
    expect(series.subtitle?.en).toBe('MVI network v1, central Bogotá')
    expect(series.members.map((m) => m.layer.parameter?.value)).toEqual([800, 2000])
    expect(series.parameter?.unit).toBe('m')
  })

  it('keeps every other layer as its own entry', () => {
    expect(entries.map((e) => e.id).sort()).toEqual(
      [
        'bogota-syntax/centralidad_armonica',
        'bogota-syntax/renobo_piloto',
        'bogota-syntax/tipo_via',
      ].sort(),
    )
  })

  it('treats only Context as overlays', () => {
    expect(entries.filter(isOverlay).map((e) => e.id)).toEqual(['bogota-syntax/renobo_piloto'])
  })
})

describe('panel helpers', () => {
  const entries = buildEntries(loaded)
  const series = entries.find((e) => e.id === 'bogota-syntax/centralidad_armonica')!
  const streetType = entries.find((e) => e.id === 'bogota-syntax/tipo_via')!

  it('show a subtitle once when a group shares it', () => {
    expect(sharedSubtitle([series, streetType])?.es).toBe('Red MVI v1, centro de Bogotá')
    const renobo = entries.find((e) => e.id === 'bogota-syntax/renobo_piloto')!
    expect(sharedSubtitle([series, renobo])).toBeUndefined()
  })

  it('format radii, metres from 1000 up as km', () => {
    expect(formatParameter(800, 'm')).toBe('800 m')
    expect(formatParameter(2000, 'm')).toBe('2 km')
    expect(formatParameter(5000, 'm')).toBe('5 km')
    expect(formatParameter(3)).toBe('3')
  })

  it('keep the radius when switching measure, else take the first', () => {
    const at2000 = series.members[1]
    expect(memberFor(series, at2000).layer.parameter?.value).toBe(2000)
    expect(memberFor(streetType, at2000)).toBe(streetType.members[0])
    expect(memberFor(series).layer.parameter?.value).toBe(800)
  })
})

describe('series rules', () => {
  const broken = (change: (layers: Record<string, unknown>[]) => void) => {
    const data = structuredClone(file) as unknown as { layers: Record<string, unknown>[] }
    change(data.layers)
    return checkEtapas(data).join('\n')
  }

  it('reject a repeated parameter value', () => {
    expect(broken((ls) => ((ls[1].parameter as { value: number }).value = 800))).toMatch(
      /repeats a parameter value/,
    )
  })

  it('reject a parameter without a series', () => {
    expect(broken((ls) => delete ls[0].series)).toMatch(/series/)
  })

  it('reject different titles within a series', () => {
    expect(broken((ls) => ((ls[1].series as { title: { es: string } }).title.es = 'Otra'))).toMatch(
      /different titles/,
    )
  })
})

describe('labels in the URL', () => {
  it('are on unless labels=0', () => {
    expect(labelsFromSearch('')).toBe(true)
    expect(labelsFromSearch('?labels=0')).toBe(false)
    expect(withParam('?etapas=1&labels=0', 'labels', null)).toBe('?etapas=1')
  })
})
