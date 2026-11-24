# Notes for bogota-pop: what the atlas schema adds to ADR-0013

`schema/etapas.schema.json` mirrors `bogota-pop` ADR-0013 as amended on 2026-11-23. To write a schema, the atlas had to fill four gaps in the ADR. Each fill is a proposal until bogota-pop agrees. bogota-syntax follows ADR-0013 by reference, so the same applies there.

Draft issue for `gregmaya/bogota-pop`, for Greg to take there:

---

**Title:** ADR-0013: key names, geometry and levels for etapas.json · ADR-0013: nombres de claves, geometría y niveles para etapas.json

bogota-atlas now validates `etapas.json` against a JSON Schema (`schema/etapas.schema.json` in bogota-atlas). ADR-0013 lists what the pipeline adds to each layer but does not name the keys, and it leaves out two things the atlas needs to draw a layer. The atlas proposes the items below. All of them are additions, so none is a breaking change to the ADR.

1. **Names of the generated keys.**
   - Top level: `schema_version` as `"MAJOR.MINOR"` (starting at `"1.0"`), `producer`, `created` (UTC, ISO 8601, e.g. `2026-11-23T21:20:00Z`), `commit` (short or full hash), `layers` (array).
   - Per layer: `file` (`<id>.pmtiles`), `field_types` (`{field: "string" | "number" | "boolean"}`, one entry per kept field), `bounds` (`[west, south, east, north]` in degrees), `vigencia` (`{source_id: "2018"}`, one entry per source, `null` while unknown), `attribution` (one string, as published, not translated).
2. **Internal layer name.** Write each PMTiles file with its internal layer named after the layer id (`ogr2ogr ... -nln <id>`). GDAL otherwise uses the input layer's name, which is `2018` for the interim MGN files. MapLibre needs this name to draw the layer.
3. **Geometry.** Add `geometry`: `polygon`, `line` or `point`. The atlas uses it to choose fill, line or circle without opening each file first.
4. **Levels.** Add `segmento` (street segment, for bogota-syntax) and `area` (any other polygon, e.g. the RENOBO pilot areas) to the `level` list.

The atlas also checks, outside the schema, that `style.field` is in `fields`, that `field_types` covers exactly `fields`, that `vigencia` covers exactly `sources`, that ids are unique in a file and that `minzoom` ≤ `maxzoom`.

A worked example is the atlas fixture: `tests/fixtures/bogota-pop/etapas.json` and `tests/fixtures/bogota-syntax/etapas.json` in bogota-atlas.

---

## Smaller points to mention there

- ADR-0013 is still marked **Proposed** in bogota-pop. The atlas builds on it as if accepted.
- The local `../bogota-pop` checkout was on `phase1/ingest-mgn` on 2026-11-23, which doesn't have the amendment. The atlas read the merged ADR from GitHub instead.
- `bogota-syntax/config/sources.yaml` has no `vigencia` per source. The fixture uses `null` for those, and the atlas will say "not recorded" rather than guess.
