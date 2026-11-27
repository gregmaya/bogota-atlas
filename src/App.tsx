import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadFieldStats, loadLayers } from './etapas/load.ts'
import { langFromSearch } from './map/basemap.ts'
import type { LayerWithStats } from './map/etapasLayers.ts'
import { MapView } from './map/MapView.tsx'
import { siteRoot } from './map/siteRoot.ts'
import { buildEntries, isOverlay } from './panels/entries.ts'
import { LayerPanel } from './panels/LayerPanel.tsx'
import {
  etapasFromSearch,
  labelsFromSearch,
  layersFromSearch,
  replaceParamInUrl,
} from './state/url.ts'

const search = window.location.search
const lang = langFromSearch(search)
const etapas = etapasFromSearch(search)

export function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [layers, setLayers] = useState<LayerWithStats[]>([])
  // One data layer at a time; Context outlines are overlays on top.
  const [active, setActive] = useState<string | null>(null)
  const [overlays, setOverlays] = useState<Set<string>>(new Set())
  const [opacity, setOpacity] = useState(1)
  const [labels, setLabels] = useState(labelsFromSearch(search))

  const entries = useMemo(() => buildEntries(layers), [layers])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [])

  useEffect(() => {
    const dataRoot = new URL('data/', siteRoot()).href
    loadLayers(dataRoot, etapas)
      .then((loaded) =>
        Promise.all(loaded.map(async (l) => ({ ...l, stats: await loadFieldStats(l) }))),
      )
      .then((withStats) => {
        const overlayKeys = new Set(withStats.filter((l) => isOverlay(l.layer)).map((l) => l.key))
        const dataKeys = withStats.filter((l) => !isOverlay(l.layer)).map((l) => l.key)
        const fromUrl = layersFromSearch(search)
        setLayers(withStats)
        if (fromUrl) {
          setActive(fromUrl.find((k) => dataKeys.includes(k)) ?? null)
          setOverlays(new Set(fromUrl.filter((k) => overlayKeys.has(k))))
        } else {
          setActive(dataKeys[0] ?? null)
        }
        setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('Could not load layers', error)
        setStatus('error')
      })
  }, [])

  // Keep ?layers= in step once loaded.
  useEffect(() => {
    if (status !== 'ready') return
    replaceParamInUrl('layers', [...(active ? [active] : []), ...overlays].join(','))
  }, [status, active, overlays])

  const toggleOverlay = useCallback((key: string) => {
    setOverlays((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const changeLabels = useCallback((on: boolean) => {
    setLabels(on)
    replaceParamInUrl('labels', on ? null : '0')
  }, [])

  const visible = useMemo(
    () => new Set([...(active ? [active] : []), ...overlays]),
    [active, overlays],
  )
  const opacityByKey = useMemo(() => (active ? { [active]: opacity } : {}), [active, opacity])

  return (
    <main>
      <MapView
        lang={lang}
        layers={layers}
        visible={visible}
        opacity={opacityByKey}
        labels={labels}
      />
      <LayerPanel
        lang={lang}
        etapas={etapas}
        status={status}
        entries={entries}
        active={active}
        overlays={overlays}
        opacity={opacity}
        labels={labels}
        onActivate={setActive}
        onOverlay={toggleOverlay}
        onOpacity={setOpacity}
        onLabels={changeLabels}
      />
    </main>
  )
}
