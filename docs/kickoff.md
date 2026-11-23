# Kickoff prompt for bogota-atlas

Paste everything below the line as the first message of a Claude Code session started in `../bogota-atlas`. Update it when `bogota-pop` ADR-0013 or this repo's ADRs change.

---

We're working on bogota-atlas. Before anything else, read these, in order:

1. This repo's `CLAUDE.md`, `docs/plan.md`, `docs/style.md` and `docs/decisions/`.
2. Read only, never edit from this session:
   - `../bogota-pop/docs/decisions/0013-etapas-layer-contract.md`: the contract with both producers. If something in it is hard to build here, say so and I'll take it back to that repo.
   - `../bogota-pop/config/etapas.yaml` and `../bogota-syntax/config/etapas.yaml`, if they exist yet: the real layer lists.
   - `../bogota-pop/docs/glossary.md` and `../bogota-syntax/docs/glossary.md`: acronyms and Spanish terms. Never guess an acronym.

## Things that are easy to get wrong

- **Tiles** are written by each producer with GDAL's PMTiles driver, not tippecanoe.
- **`DATO_ANM` is not an anonymisation flag.** It names the publication level and is `MANZANA` for every Bogotá block. The layer is "Blocks with dwellings but 0 persons (unexplained)". Draw it distinctly; never call it anonymised.
- **Two producers.** Layers are keyed `producer/id`. Colours follow `group`, not the layer.
- **Bilingual.** Interface text from `src/i18n/{es,en}.json`; layer text from the producers' `{es, en}` fields.

## Next steps (stop after each one for my review)

Phase 0 of `docs/plan.md`, one step at a time:

1. Scaffold Vite + React + TypeScript with lint, typecheck, test and CI.
2. Fonts and the CSS tokens from `docs/style.md`.
3. Protomaps extract and the base/labels split, in ES and EN; deploy the blank map to Pages and test range requests.
4. `schema/etapas.schema.json` and the fixture `etapas.json`.

## How I work

See "How to work with me" in `CLAUDE.md`. Above all: talk decisions through before code, stop after each step, and don't push unless I ask.
