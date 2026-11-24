# Style

The atlas should feel robust, trustworthy, technically thorough and serious. In practice that means a calm basemap, square panels floating over the map, two typefaces with clear jobs, and data colours kept apart from interface colours. The reference is the Blue Lagoon website: a DIN-style sans, charcoal text instead of black, square corners, soft wide shadows and a pale blue-grey.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#454647` | Body text, icons, the outlines in Context |
| `--ink-muted` | `#454647` at 70% | Secondary text, field names, axis labels |
| `--paper` | `#FFFFFF` | Inputs, inspect values, page background outside the map |
| `--panel` | `#E5EDF1` at 85% opacity | Floating panels |
| `--line` | `#96C2DB` | Panel borders (1 px), dividers, focus rings |
| `--accent` | `#FFCC00` | Selected feature, active layer marker, swipe divider. Nothing else |

Rules:

- Pure black is never used.
- Yellow is reserved for "this is what you picked". It never fills an area larger than a marker or a line.
- Data ramps stay clear of the blue-grey and the yellow, so interface colour never reads as data.

### Data ramps

Ramps belong to the group, not the layer (`bogota-pop` ADR-0013). Values are proposals, to be checked for colour-blind separation and contrast on the basemap with the dataviz skill's validator in Phase 1.

| Group | Kind | Ramp |
| --- | --- | --- |
| `poblacion` | sequential | Pale peach to oxblood (`#FDE5D2` → `#7A1F1F`), 5–7 classes |
| `red_vial` | sequential | Light lilac to deep violet (`#E3DDF0` → `#3B1F66`); line width also grows with the value |
| any | categorical | A fixed set of 8 muted hues without blue-grey or yellow; more categories fall back to `--ink-muted` |
| `context` | outline | `--ink`, 1.25 px; `dash: true` uses a 2 px dash and 2 px gap |

No data: hatched in `--ink-muted` at low opacity, never left blank and never shown as zero. The main case so far is blocks with dwellings but 0 persons in the census, which have no explanation yet. Showing them openly is part of being trustworthy. (`DATO_ANM` is not an anonymisation flag: it names the level a block's data is published at, and it is `MANZANA` for every Bogotá block.)

## Type

| Face | Use | Weights |
| --- | --- | --- |
| Barlow | All interface text: titles, panels, buttons, legends | 400, 500, 600 |
| IBM Plex Mono | Numbers, units, field names (`TP27_PERSO`), codes, release tags, coordinates | 400, 500 |

- Both are self-hosted from `@fontsource` (SIL Open Font Licence), with no third-party font requests.
- Numbers use tabular figures and right-alignment in tables.
- Scale (px): 13 / 15 / 18 / 24 / 32. Body text is 15. Panel titles are 18 at weight 600. The site title is 24.
- Sentence case everywhere. Uppercase only for very short labels such as group headers, at 12 px with letter-spacing of 0.06em.

## Panels

- Square corners (radius 0).
- Background `--panel` with `backdrop-filter: blur(12px)`. Without blur support it falls back to the same colour at 95% opacity.
- Border 1 px `--line`; shadow `0 8px 24px rgba(0, 0, 0, 0.10)`.
- Inner padding 16 px, gap 12 px; panels sit 16 px from the viewport edge.
- Panels never cover more than about a third of the map width on desktop.

## Layout

Desktop (≥ 1024 px):

| Position | Contents |
| --- | --- |
| Top left | Site title, mode (Mapa / Etapas), ES·EN switch |
| Left | Layer panel, grouped: Población, Red vial, Contexto |
| Right | Inspect panel, opened by a click; layer information panel, opened from the layer's "i" |
| Bottom left | Legend for visible layers, scale bar |
| Bottom right | Attribution, zoom controls |

Phone (< 768 px): the map takes the full screen and a single bottom sheet holds the layers, legend and inspect content as tabs. Swipe compare is off.

## Map

- Basemap: Protomaps white flavour (ADR-0010), so it sits behind the data. Order: base without labels, data, Context, then labels in the active language (ADR-0007).
- Labels keep a halo in `--paper` so they stay readable over dark classes.
- The selected feature gets a 2 px `--accent` outline.

## Trust details

Every layer shows, in the information panel:

- the producer and release tag (Plex Mono)
- the vigencia of each source
- the licence and attribution
- the commit it was built from

Known biases are stated beside the layer they affect. Examples: blocks with dwellings but 0 persons, unexplained; the street network stopping at the city limit (`boundary_dist_m`); Etapas layers marked as work in progress.

## Motion

Panel open and close, 150 ms ease-out; map transitions use MapLibre defaults. Everything static under `prefers-reduced-motion`.
