// Interface text from two dictionaries (ADR-0004). No i18n library.
import en from './en.json'
import es from './es.json'
import type { Lang } from '../map/basemap.ts'

export type Key = keyof typeof es

const dictionaries: Record<Lang, Record<Key, string>> = { es, en }

export function t(lang: Lang, key: Key): string {
  return dictionaries[lang][key]
}
