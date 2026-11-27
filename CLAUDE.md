# CLAUDE.md — bogota-atlas

Static, bilingual map site for Bogotá D.C. It draws layers published by `bogota-pop` (population) and `bogota-syntax` (street-network centrality). It has no data pipeline of its own.

The plan is `docs/plan.md`, the visual language is `docs/style.md`, and decisions are ADRs in `docs/decisions/`. Read all three before starting a phase or changing anything structural.

## Current status

- Phase: **1, Generic Etapas** (update this line when a phase closes). Phase 0 closed 2026-11-23: blank bilingual map live, range requests work, schema and fixture in place.
- Open with bogota-pop: the schema's additions to ADR-0013 in `docs/contract-notes.md`.
- The layer contract is `bogota-pop` ADR-0013, amended in gregmaya/bogota-pop#13.

## Stack

- Vite + React + TypeScript, MapLibre GL JS, `pmtiles` (ADR-0001). npm, with the Node version in `.nvmrc`.
- No router, no UI kit, no i18n library, no global state library unless agreed. Plain CSS with the custom properties in `docs/style.md`.
- Basemap: self-hosted Protomaps extract, split into base and labels around the data (ADR-0007).
- Fonts: Barlow (interface) and IBM Plex Mono (numbers, codes, field names), self-hosted from `@fontsource`.

## Commands

```bash
npm ci                 # install from package-lock.json
npm run dev            # dev server with the fixture layers (open with ?etapas=1)
npm run dev:local      # dev server with the producers' data/processed/etapas/ (folders in git-ignored .env.local, see .env.local.example; private layers allowed)
npm run dev:release    # dev server with the pinned release and dev tags, as deployed
npm run lint && npm run typecheck && npm test
npm run build          # production build; stops if .env.local sets producer folders or public/data holds local/fixture files
npm run fetch-data     # download the basemap and pinned producer tags into public/data/ (what the deploy runs)
npm run fetch-data:local  # basemap from build/basemap/ after scripts/build-basemap.sh
npm run check-budget   # size budget on dist/ (ADR-0002)
npm run check-etapas -- <etapas.json>...  # validate against the schema (add --release to reject private layers)
scripts/build-basemap.sh  # rebuild the basemap release files by hand (docs/basemap.md)
```

Vite lists `public/` when it starts: after changing mode, restart the dev server (the `dev*` scripts do). Node comes from `.nvmrc` (fnm switches to it).

Update this block when the real commands differ.

## Layout

- `atlas.config.json`: basemap release, bounds and flavour; per producer a pinned `release` tag (public map) and `dev` tag (Etapas, `?etapas=1`).
- `schema/etapas.schema.json`: mirror of `bogota-pop` ADR-0013; checked at deploy.
- `src/etapas/`: loading `etapas.json`, layer generation from the style hint, colour ramps.
- `src/map/`: map creation, basemap split, adding etapas layers.
- `src/panels/`: layer, legend, inspect, information panels.
- `src/i18n/es.json`, `src/i18n/en.json`: interface text.
- `public/data/`: git-ignored; filled by `fetch-data`.
- `tests/fixtures/<producer>/`: fixture `etapas.json` and small real PMTiles per producer, one layer per style kind, both languages. Cut by `scripts/build-fixture.sh`.
- `scripts/check-etapas.ts`: schema plus cross-field checks; `--release` also rejects private layers.

## Hard rules

1. **No layer-specific code.** Layers are drawn from `etapas.json` and the style hint only. A new `style.kind` is agreed with the producers first.
2. **Private layers never deploy.** A layer with `public: false` fails the build, and `npm run build` fails if the local paths in `.env.local` are set. No lot-level data is ever committed here.
3. **Every interface string exists in both `es.json` and `en.json`.** CI checks the keys match. Spanish is the default.
4. **Data stays as published.** Field names and codes (`TP27_PERSO`, `boundary_dist_m`) are shown untranslated, in Plex Mono.
5. **Missing data is never shown as zero.** It is hatched and explained in the legend (`docs/style.md`). Blocks with dwellings but 0 persons are not "anonymised": `DATO_ANM` is the publication level, `MANZANA` for every Bogotá block.
6. **No invented numbers.** Every figure shown comes from a producer file. If something isn't computed yet, the UI says so.
7. **Producer files are read-only here.** A change they need becomes a cross-linked issue in that repo.
8. **Size budget:** no file over 90 MB, site under 800 MB (ADR-0002).
9. **Colour:** interface colours and data ramps never overlap; `#FFCC00` only marks what the user selected (`docs/style.md`).

## Conventions

- Code, comments, commits and ADRs in English. Issues, PRs and release notes in English and Spanish, titles as `English · Español`. README bilingual (`README.md`, `README.es.md`).
- Spell out acronyms the first time, using the producers' glossaries; never guess one.
- TypeScript strict mode. Components small; one CSS module per component.

## How to work with me (Gregorio)

- Talk a decision through before writing code for it. Propose, then wait.
- Stop after each step for review. Small PRs, one per task. End each step with a short progress table: ✅ done / 🟡 in progress (say what's missing) / ⏭️ skipped / ⬜ not started.
- Don't commit or push unless asked. Anything public on GitHub (issues, labels, releases, Pages settings) needs a go-ahead first.
- Explain unfamiliar things simply, with a recommendation. Docs in easy language.
- A new structural decision becomes a new ADR (copy `docs/decisions/template.md`, list it in `docs/decisions/README.md`).
- Prose in docs and UI: direct, specific, varied sentence length, no filler intros or recap endings.

## Companion repos

- `gregmaya/bogota-pop` (`../bogota-pop`): population model. Owns ADR-0013.
- `gregmaya/bogota-syntax` (`../bogota-syntax`): street-network centrality. Follows ADR-0013 by reference.
- **One session per repo.** A session here never edits the producer repos. A need from them becomes a note to Greg, drafted so he can take it there.
- Kickoff prompt for a new session here: `docs/kickoff.md`.
