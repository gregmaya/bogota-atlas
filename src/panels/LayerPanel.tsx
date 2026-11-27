import type { LoadedLayer } from '../etapas/types.ts'
import { t } from '../i18n/t.ts'
import type { Lang } from '../map/basemap.ts'
import { type Entry, formatParameter, memberFor, sharedSubtitle } from './entries.ts'
import styles from './LayerPanel.module.css'

const GROUPS = ['poblacion', 'red_vial', 'context'] as const

interface Props {
  lang: Lang
  etapas: boolean
  status: 'loading' | 'ready' | 'error'
  entries: Entry[]
  /** Key of the one active data layer, if any. */
  active: string | null
  overlays: Set<string>
  opacity: number
  labels: boolean
  onActivate: (key: string) => void
  onOverlay: (key: string) => void
  onOpacity: (value: number) => void
  onLabels: (on: boolean) => void
}

export function LayerPanel(props: Props) {
  const { lang, etapas, status, entries, active, opacity, labels } = props
  const percent = Math.round(opacity * 100)
  const activeLayer = entries.flatMap((e) => e.members).find((m) => m.key === active)
  return (
    <section className={styles.panel} aria-labelledby="layers-title">
      <h2 id="layers-title" className={styles.title}>
        {t(lang, 'layers.title')}
      </h2>
      {etapas && <p className={styles.note}>{t(lang, 'etapas.badge')}</p>}
      {status === 'loading' && <p className={styles.note}>{t(lang, 'layers.loading')}</p>}
      {status === 'error' && <p className={styles.note}>{t(lang, 'layers.error')}</p>}
      {status === 'ready' && entries.length === 0 && (
        <p className={styles.note}>{t(lang, 'layers.empty')}</p>
      )}

      {GROUPS.map((group) => {
        const inGroup = entries.filter((e) => e.group === group)
        if (!inGroup.length) return null
        const subtitle = sharedSubtitle(inGroup)
        return (
          <div key={group} className={styles.group}>
            <div>
              <h3 className={styles.groupTitle}>{t(lang, `group.${group}`)}</h3>
              {subtitle && <p className={styles.note}>{subtitle[lang]}</p>}
            </div>
            {group === 'context' ? (
              <ul className={styles.list}>
                {inGroup.map((entry) => (
                  <OverlayItem key={entry.id} {...props} entry={entry} />
                ))}
              </ul>
            ) : (
              <DataGroup
                {...props}
                entries={inGroup}
                showSubtitles={!subtitle}
                activeLayer={activeLayer}
              />
            )}
          </div>
        )
      })}

      {status === 'ready' && entries.length > 0 && (
        <div className={styles.footer}>
          <label className={styles.opacity}>
            <span>{t(lang, 'layers.opacity')}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              disabled={!active}
              onChange={(e) => props.onOpacity(Number(e.target.value) / 100)}
            />
            <code>{percent}%</code>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => props.onLabels(e.target.checked)}
            />
            <span>{t(lang, 'map.labels')}</span>
          </label>
        </div>
      )}
    </section>
  )
}

/** One data group: a button per measure, then a slider for the active measure's parameter. */
function DataGroup({
  lang,
  entries,
  active,
  onActivate,
  showSubtitles,
  activeLayer,
}: Props & { showSubtitles: boolean; activeLayer?: LoadedLayer }) {
  const current = entries.find((e) => e.members.some((m) => m.key === active))
  const index = current ? current.members.findIndex((m) => m.key === active) : -1
  return (
    <>
      <div className={styles.choices}>
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={entry === current}
            onClick={() => onActivate(memberFor(entry, activeLayer).key)}
          >
            <span>{entry.title[lang]}</span>
            {showSubtitles && entry.subtitle && (
              <span className={styles.buttonNote}>{entry.subtitle[lang]}</span>
            )}
          </button>
        ))}
      </div>
      {current?.parameter && current.members.length > 1 && (
        <label className={styles.parameter}>
          <span>{current.parameter.label[lang]}</span>
          <input
            type="range"
            min={0}
            max={current.members.length - 1}
            step={1}
            value={index}
            onChange={(e) => onActivate(current.members[Number(e.target.value)].key)}
          />
          <span className={styles.stops} aria-hidden="true">
            {current.members.map((m, i) => (
              <code key={m.key} data-on={i === index}>
                {formatParameter(m.layer.parameter!.value, current.parameter!.unit)}
              </code>
            ))}
          </span>
        </label>
      )}
    </>
  )
}

function OverlayItem({ lang, entry, overlays, onOverlay }: Props & { entry: Entry }) {
  const key = entry.members[0].key
  return (
    <li className={styles.item}>
      <label className={styles.check}>
        <input type="checkbox" checked={overlays.has(key)} onChange={() => onOverlay(key)} />
        <span>{entry.title[lang]}</span>
      </label>
    </li>
  )
}
