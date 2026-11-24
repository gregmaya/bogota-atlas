import { useEffect } from 'react'
import { langFromSearch } from './map/basemap.ts'
import { MapView } from './map/MapView.tsx'

// Language comes from the URL only for now (?lang=en); the visible ES·EN
// switch arrives with the dictionaries in Phase 1.
export function App() {
  const lang = langFromSearch(window.location.search)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return (
    <main>
      <MapView lang={lang} />
    </main>
  )
}
