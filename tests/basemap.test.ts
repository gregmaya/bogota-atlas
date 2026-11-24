import { describe, expect, it } from 'vitest'
import { basemapLayers, basemapUrls, langFromSearch } from '../src/map/basemap.ts'

describe('langFromSearch', () => {
  it.each([
    ['', 'es'],
    ['?lang=es', 'es'],
    ['?lang=en', 'en'],
    ['?lang=fr', 'es'],
    ['?etapas=1&lang=en', 'en'],
  ])('%s → %s', (search, lang) => {
    expect(langFromSearch(search)).toBe(lang)
  })
})

describe('basemapLayers', () => {
  const es = basemapLayers('es')
  const en = basemapLayers('en')

  it('puts every symbol layer in labels and none in base', () => {
    expect(es.labels.length).toBeGreaterThan(0)
    expect(es.labels.every((l) => l.type === 'symbol')).toBe(true)
    expect(es.base.some((l) => l.type === 'symbol')).toBe(false)
  })

  it('keeps the base identical across languages', () => {
    expect(en.base).toEqual(es.base)
  })

  it('switches label text with the language', () => {
    const text = (ls: typeof es.labels) =>
      JSON.stringify(
        ls.map((l) => (l.layout as Record<string, unknown> | undefined)?.['text-field']),
      )
    expect(text(es.labels)).toContain('name:es')
    expect(text(en.labels)).toContain('name:en')
  })

  it('draws every label halo in --paper', () => {
    const halos = es.labels
      .map((l) => (l.paint as Record<string, unknown> | undefined)?.['text-halo-color'])
      .filter((c) => typeof c === 'string')
    expect(halos.length).toBeGreaterThan(0)
    expect(new Set(halos)).toEqual(new Set(['#ffffff']))
  })
})

describe('basemapUrls', () => {
  it('serves everything from the site, under the pinned release', () => {
    const urls = basemapUrls('https://gregmaya.github.io/bogota-atlas/')
    expect(urls.tiles).toMatch(
      /^pmtiles:\/\/https:\/\/gregmaya\.github\.io\/bogota-atlas\/data\/basemap\/basemap-\d{4}-\d{2}-\d{2}\/basemap\.pmtiles$/,
    )
    expect(urls.glyphs).toContain('/fonts/{fontstack}/{range}.pbf')
    expect(urls.sprite).toMatch(/\/sprites\/v4\/[a-z]+$/)
  })
})
