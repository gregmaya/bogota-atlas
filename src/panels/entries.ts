// What the layer panel lists. Layers that share a series (contract-notes item 6)
// become one entry whose members differ by parameter (e.g. radius); every other
// layer is an entry of its own. Built from etapas.json alone (hard rule 1).
import type { Channel, LoadedLayer, Text } from '../etapas/types.ts'

export interface Entry {
  /** producer/series id, or the layer key for a single layer. */
  id: string
  group: 'poblacion' | 'red_vial' | 'context'
  title: Text
  subtitle?: Text
  channel: Channel
  /** Layers of the entry, ordered by parameter value; one for a single layer. */
  members: LoadedLayer[]
  /** Label and unit of the parameter, for series only. */
  parameter?: { label: Text; unit?: string }
}

export function buildEntries(layers: LoadedLayer[]): Entry[] {
  const entries: Entry[] = []
  const bySeries = new Map<string, Entry>()
  for (const loaded of layers) {
    const { layer, producer, channel, key } = loaded
    if (layer.series && layer.parameter) {
      const id = `${producer}/${layer.series.id}`
      const existing = bySeries.get(id)
      if (existing) {
        existing.members.push(loaded)
        continue
      }
      const entry: Entry = {
        id,
        group: layer.group,
        title: layer.series.title,
        subtitle: layer.subtitle,
        channel,
        members: [loaded],
        parameter: { label: layer.parameter.label, unit: layer.parameter.unit },
      }
      bySeries.set(id, entry)
      entries.push(entry)
    } else {
      entries.push({
        id: key,
        group: layer.group,
        title: layer.title,
        subtitle: layer.subtitle,
        channel,
        members: [loaded],
      })
    }
  }
  for (const entry of bySeries.values()) {
    entry.members.sort((a, b) => (a.layer.parameter?.value ?? 0) - (b.layer.parameter?.value ?? 0))
  }
  return entries
}

/** Context layers are overlays; every other group is one-at-a-time. */
export const isOverlay = (entry: Pick<Entry, 'group'>) => entry.group === 'context'

/** The subtitle every entry of a group shares, shown once under the group heading. */
export function sharedSubtitle(entries: Entry[]): Text | undefined {
  const [first, ...rest] = entries
  if (!first?.subtitle) return undefined
  const same = rest.every((e) => JSON.stringify(e.subtitle) === JSON.stringify(first.subtitle))
  return same ? first.subtitle : undefined
}

/** A parameter value for a label: metres from 1000 up read as km (2000 m → 2 km). */
export function formatParameter(value: number, unit?: string): string {
  if (unit === 'm' && value >= 1000) return `${value / 1000} km`
  return unit ? `${value} ${unit}` : String(value)
}

/**
 * The member to show when an entry is picked: the one with the same parameter
 * value as the current layer if there is one (keep the radius when switching
 * measure), otherwise the first.
 */
export function memberFor(entry: Entry, current?: LoadedLayer): LoadedLayer {
  const value = current?.layer.parameter?.value
  return (
    entry.members.find((m) => value !== undefined && m.layer.parameter?.value === value) ??
    entry.members[0]
  )
}
