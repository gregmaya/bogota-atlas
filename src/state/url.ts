// State that survives a reload lives in the URL (ADR-0001, ADR-0004, ADR-0008).
//   ?lang=en        English (Spanish otherwise)
//   ?etapas=1       Etapas mode: dev, local and fixture layers are listed
//   ?layers=a,b     the active data layer and any Context overlays, keyed producer/id
//   ?labels=0       map labels off
// The map view lives in the hash (#zoom/lat/lon), managed by MapLibre.

export function etapasFromSearch(search: string): boolean {
  return new URLSearchParams(search).get('etapas') === '1'
}

/** Layer keys from the URL, or null when the URL doesn't say. */
export function layersFromSearch(search: string): string[] | null {
  const value = new URLSearchParams(search).get('layers')
  if (value === null) return null
  return value.split(',').filter(Boolean)
}

export function labelsFromSearch(search: string): boolean {
  return new URLSearchParams(search).get('labels') !== '0'
}

/** The same search string with one parameter set (or removed when null). */
export function withParam(search: string, name: string, value: string | null): string {
  const params = new URLSearchParams(search)
  if (value === null) params.delete(name)
  else params.set(name, value)
  const text = params.toString()
  // Keep producer/id readable: URLSearchParams would encode the slash and comma.
  return text ? '?' + text.replace(/%2F/g, '/').replace(/%2C/g, ',') : ''
}

export const withLayers = (search: string, keys: string[]) =>
  withParam(search, 'layers', keys.join(','))

export function replaceParamInUrl(name: string, value: string | null) {
  const { pathname, search, hash } = window.location
  window.history.replaceState(null, '', pathname + withParam(search, name, value) + hash)
}
