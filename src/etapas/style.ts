// MapLibre layers for one etapas layer, from its style hint alone (CLAUDE.md
// hard rule 1). Pure functions: no map, no fetch, so they are easy to test.
import type {
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  LayerSpecification,
} from 'maplibre-gl'
import { CATEGORICAL, INK, INK_MUTED, sequentialRamp } from './ramps.ts'
import type { EtapasLayer, FieldStats } from './types.ts'

/** Image id of the no-data hatch, added to the map by MapView. */
export const HATCH = 'atlas-no-data-hatch'

/** Classes used when the producer gives no breaks: even steps between the file's min and max. */
export const FALLBACK_CLASSES = 5

export interface Classes {
  /** Value where each class starts, ascending. */
  starts: number[]
  colours: string[]
  /** true when the producer supplied the breaks; false for the even-step fallback. */
  fromProducer: boolean
}

export function evenStarts(min: number, max: number, n: number): number[] {
  if (max <= min) return [min]
  return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / n)
}

export function sequentialClasses(layer: EtapasLayer, stats: FieldStats): Classes | null {
  const breaks = layer.style.breaks
  const starts =
    breaks ??
    (stats.min !== undefined && stats.max !== undefined
      ? evenStarts(stats.min, stats.max, FALLBACK_CLASSES)
      : null)
  if (!starts) return null
  return {
    starts,
    colours: sequentialRamp(layer.group, starts.length),
    fromProducer: Boolean(breaks),
  }
}

/** Blank strings are missing data, not a category (CLAUDE.md hard rule 5). */
const isBlank = (v: string | number) => typeof v === 'string' && v.trim() === ''

export function categories(stats: FieldStats): (string | number)[] {
  return (stats.values ?? []).filter((v) => !isBlank(v))
}

function missing(layer: EtapasLayer, stats: FieldStats): ExpressionSpecification {
  const field = layer.style.field
  const blanks = (stats.values ?? []).filter(isBlank)
  const absent: ExpressionSpecification = ['!', ['has', field]]
  return blanks.length ? ['any', absent, ['in', ['get', field], ['literal', blanks]]] : absent
}

function colourExpression(
  layer: EtapasLayer,
  stats: FieldStats,
): DataDrivenPropertyValueSpecification<string> | null {
  const field = layer.style.field
  if (layer.style.kind === 'sequential') {
    const classes = sequentialClasses(layer, stats)
    if (!classes) return null
    const [first, ...rest] = classes.colours
    const steps = rest.flatMap((colour, i) => [classes.starts[i + 1], colour])
    return steps.length
      ? (['step', ['to-number', ['get', field]], first, ...steps] as ExpressionSpecification)
      : first
  }
  if (layer.style.kind === 'categorical') {
    const values = categories(stats)
    if (!values.length) return INK_MUTED
    // Fixed order; anything past the palette folds into muted ink.
    const pairs = values.flatMap((v, i) => [v, CATEGORICAL[i] ?? INK_MUTED])
    return ['match', ['get', field], ...pairs, INK_MUTED] as unknown as ExpressionSpecification
  }
  return INK
}

const LINE_WIDTH = 1.5

/**
 * The MapLibre layers that draw one etapas layer. `key` is producer/id; it is
 * also the source id. Order inside the result is draw order.
 */
export function layerSpecs(
  key: string,
  layer: EtapasLayer,
  stats: FieldStats,
): LayerSpecification[] {
  const base = {
    source: key,
    'source-layer': layer.id,
    minzoom: layer.minzoom,
  }
  const { kind, field, dash } = layer.style

  if (kind === 'outline') {
    return [
      {
        ...base,
        id: `${key}/outline`,
        type: 'line',
        paint: {
          'line-color': INK,
          'line-width': 1.25,
          ...(dash ? { 'line-dasharray': [2, 2] } : {}),
        },
      },
    ]
  }

  const colour = colourExpression(layer, stats)
  const noData = missing(layer, stats)
  const hasData: ExpressionSpecification = ['!', noData]
  const specs: LayerSpecification[] = []

  if (layer.geometry === 'polygon') {
    specs.push({
      ...base,
      id: `${key}/no-data`,
      type: 'fill',
      filter: noData,
      paint: { 'fill-pattern': HATCH },
    })
    if (colour) {
      specs.push({
        ...base,
        id: `${key}/fill`,
        type: 'fill',
        filter: hasData,
        paint: { 'fill-color': colour, 'fill-outline-color': '#ffffff' },
      })
    }
  } else if (layer.geometry === 'line') {
    specs.push({
      ...base,
      id: `${key}/no-data`,
      type: 'line',
      filter: noData,
      paint: { 'line-color': INK_MUTED, 'line-width': 1, 'line-dasharray': [1, 2] },
    })
    if (colour) {
      specs.push({
        ...base,
        id: `${key}/line`,
        type: 'line',
        filter: hasData,
        // Higher values drawn on top of lower ones.
        layout: kind === 'sequential' ? { 'line-sort-key': ['to-number', ['get', field]] } : {},
        paint: { 'line-color': colour, 'line-width': LINE_WIDTH },
      })
    }
  } else {
    specs.push({
      ...base,
      id: `${key}/no-data`,
      type: 'circle',
      filter: noData,
      paint: {
        'circle-color': '#ffffff',
        'circle-stroke-color': INK_MUTED,
        'circle-stroke-width': 1,
        'circle-radius': 3,
      },
    })
    if (colour) {
      specs.push({
        ...base,
        id: `${key}/circle`,
        type: 'circle',
        filter: hasData,
        layout: kind === 'sequential' ? { 'circle-sort-key': ['to-number', ['get', field]] } : {},
        paint: {
          'circle-color': colour,
          'circle-radius': 4,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
        },
      })
    }
  }
  return specs
}

const GROUP_ORDER = ['poblacion', 'red_vial', 'context'] as const

/** Draw order: poblacion, then red_vial, then context on top (ADR-0006). */
export function byGroup<T extends { layer: EtapasLayer }>(layers: T[]): T[] {
  return [...layers].sort(
    (a, b) => GROUP_ORDER.indexOf(a.layer.group) - GROUP_ORDER.indexOf(b.layer.group),
  )
}
