# Notes for bogota-pop: what the atlas schema adds to ADR-0013

`schema/etapas.schema.json` mirrors `bogota-pop` ADR-0013 as amended on 2026-11-23. To write a schema, the atlas had to fill four gaps in the ADR. Each fill is a proposal until bogota-pop agrees. bogota-syntax follows ADR-0013 by reference, so the same applies there.

Draft issue for `gregmaya/bogota-pop`, for Greg to take there:

---

**Title:** ADR-0013: key names, geometry and levels for etapas.json · ADR-0013: nombres de claves, geometría y niveles para etapas.json

bogota-atlas now validates `etapas.json` against a JSON Schema (`schema/etapas.schema.json` in bogota-atlas). ADR-0013 lists what the pipeline adds to each layer but does not name the keys, and it leaves out two things the atlas needs to draw a layer. The atlas proposes the items below. All of them are additions, so none is a breaking change to the ADR. Item 5 was added on 2026-11-24, item 6 on 2026-11-26.

1. **Names of the generated keys.**
   - Top level: `schema_version` as `"MAJOR.MINOR"` (starting at `"1.0"`), `producer`, `created` (UTC, ISO 8601, e.g. `2026-11-23T21:20:00Z`), `commit` (short or full hash), `layers` (array).
   - Per layer: `file` (`<id>.pmtiles`), `field_types` (`{field: "string" | "number" | "boolean"}`, one entry per kept field), `bounds` (`[west, south, east, north]` in degrees), `vigencia` (`{source_id: "2018"}`, one entry per source, `null` while unknown), `attribution` (one string, as published, not translated).
2. **Internal layer name.** Write each PMTiles file with its internal layer named after the layer id (`ogr2ogr ... -nln <id>`). GDAL otherwise uses the input layer's name, which is `2018` for the interim MGN files. MapLibre needs this name to draw the layer.
3. **Geometry.** Add `geometry`: `polygon`, `line` or `point`. The atlas uses it to choose fill, line or circle without opening each file first.
4. **Levels.** Add `segmento` (street segment, for bogota-syntax) and `area` (any other polygon, e.g. the RENOBO pilot areas) to the `level` list.

5. **Class breaks.** Add an optional `style.breaks` to sequential layers: the values where each colour class starts, computed by the producer on the full data (the tiles only carry each field's min and max). bogota-syntax measures start with 12 quantiles. Without `breaks`, the atlas uses 5 even steps between min and max and says so in the legend.

6. **Series, parameter, subtitle** (added 2026-11-26). Three optional keys so one panel entry can hold several layers:
   - `series`: `{id, title: {es, en}}`. Layers with the same `series.id` are one entry, e.g. a measure at several radii. Same group, same title.
   - `parameter`: `{label: {es, en}, value, unit}`, required with `series`. What tells the members apart: `{label: {es: Radio, en: Radius}, value: 800, unit: m}`. Values unique within a series.
   - `subtitle`: `{es, en}`, a short line under the title, e.g. `{es: Red v2, en: Network v2}`. It replaces suffixes like "(red v2)" in titles.

   Layers without them still work as single entries. `title` stays required: it names one layer on its own (information panel, legend).

The atlas also checks, outside the schema, that `style.field` is in `fields`, that `field_types` covers exactly `fields`, that `vigencia` covers exactly `sources`, that ids are unique in a file and that `minzoom` ≤ `maxzoom`.

A worked example is the atlas fixture: `tests/fixtures/bogota-pop/etapas.json` and `tests/fixtures/bogota-syntax/etapas.json` in bogota-atlas.

---

## Smaller points to mention there

- ADR-0013 is still marked **Proposed** in bogota-pop. The atlas builds on it as if accepted.
- The local `../bogota-pop` checkout was on `phase1/ingest-mgn` on 2026-11-23, which doesn't have the amendment. The atlas read the merged ADR from GitHub instead.
- `bogota-syntax/config/sources.yaml` has no `vigencia` per source. The fixture uses `null` for those, and the atlas will say "not recorded" rather than guess.

# Notes for bogota-syntax: dev-2026-11-26

The first real release the atlas reads. Its `etapas.json` already follows items 1–5 above and passes `npm run check-etapas -- --release`. Local and release copies are identical.

Draft issue for `gregmaya/bogota-syntax`, for Greg to take there:

---

**Title:** dev-2026-11-26 feedback: low-zoom tiles, panel structure · Comentarios sobre dev-2026-11-26: teselas de zoom bajo, estructura del panel

**1. Lines snap to a coarse grid at zoom 11–12.** GDAL warned that some tiles went over its 500 KB limit. It does not drop such a tile: it rewrites it on a coarser coordinate grid until it fits. Measured in `centralidad_armonica_800_v2.pmtiles`:

| Tile | Size (uncompressed) | Grid | One grid step |
| --- | --- | --- | --- |
| z11 602/997 | 943 KB | 128 | 153 m |
| z11 602/998 | 949 KB | 256 | 76 m |
| z11 601/997 (neighbour) | 548 KB | 4096 | 5 m |
| z12 1204/1995 | 904 KB | 128 | 76 m |

A block in Bogotá is 80–100 m across, so on a 76–153 m grid corners snap to the nearest grid point: diagonals turn into staircases, short segments collapse to a point and are dropped, and a coarse tile sits next to a clean one with a visible seam. From zoom 13 every tile keeps the full grid.

The heavy tiles hold 15–16k segments each, and much of their weight is attributes: every segment carries `segment_id` (12 characters) and `boundary_dist_m` at every zoom. Options:

- Raise the limit so no tile is coarsened: `-dsco MAX_SIZE=1500000`. The heaviest tiles are about 950 KB uncompressed, about 450 KB to download.
- Or keep fewer fields at zoom 11–12 so tiles fit under 500 KB.

Check afterwards that every zoom 11–12 tile keeps extent 4096 (the atlas has a small script for it).

**2. Drop `red_vial_v2` from `etapas.json`.** The atlas will not show it; publish it again later if it becomes useful.

**3. Add `series`, `parameter` and `subtitle`** (item 6 above). The atlas then shows one button per measure (Intermediación, Cercanía armónica) and a radius slider under them (800 m, 2 km, 5 km). Titles drop "(red v2)"; the version goes in `subtitle` as just `v2`, shown once under the group heading, which the atlas now calls "Red espacial / Spatial network". For example, `intermediacion_800_v2` gets:

```json
"series": {"id": "intermediacion", "title": {"es": "Intermediación angular", "en": "Angular betweenness"}},
"parameter": {"label": {"es": "Radio", "en": "Radius"}, "value": 800, "unit": "m"},
"subtitle": {"es": "v2", "en": "v2"}
```

---
