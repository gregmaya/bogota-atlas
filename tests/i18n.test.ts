import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.json'
import es from '../src/i18n/es.json'

// CLAUDE.md hard rule 3: every interface string exists in both languages.
describe('interface dictionaries', () => {
  it('have the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
  })

  it.each([
    ['es', es],
    ['en', en],
  ])('%s has no empty strings', (_, dictionary) => {
    for (const [key, value] of Object.entries(dictionary)) {
      expect(value.trim(), key).not.toBe('')
    }
  })
})
