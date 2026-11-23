# bogota-atlas: Project Plan

Written 2026-11-23. The atlas is a static map site that shows open data about Bogotá D.C. produced in other repos. It has no data pipeline of its own: it reads files that `bogota-pop` and `bogota-syntax` publish, and draws them without any code specific to a layer.

## Purpose and scope

- One map for two producers:
  - [gregmaya/bogota-pop](https://github.com/gregmaya/bogota-pop): resident population by block and H3 cell.
  - [gregmaya/bogota-syntax](https://github.com/gregmaya/bogota-syntax): street-network centrality.
- Two modes:
  - **Public map:** pinned official releases.
  - **Etapas:** intermediate pipeline layers, reached at `?etapas=1` and not linked from the site.
- Spanish by default, English on a toggle. Every label, explanation and source switches language.
- Desktop first, usable on a phone.
- Out of scope: running models in the browser, user accounts, editing data, analytics that track people.

## Decisions

Decisions V1–V5 were closed in the `bogota-pop` plan on 2026-11-14. This repo restates them as ADRs and revises V3–V5.

| ADR | Decision | Replaces |
| --- | --- | --- |
| [0001](decisions/0001-stack.md) | Vite + React + TypeScript + MapLibre GL JS + PMTiles; no router, small state | V1 |
| [0002](decisions/0002-tile-hosting.md) | Producer files copied into the GitHub Pages build at deploy; size budget checked in CI; Cloudflare R2 if it's exceeded | V2 |
| [0003](decisions/0003-v01-scope.md) | v0.1: layer panel by theme, inspect on click, swipe compare, ES/EN | V3 (revised) |
| [0004](decisions/0004-languages.md) | Bilingual, Spanish default, language in the URL | V4 (superseded) |
| [0005](decisions/0005-name-and-domain.md) | Repo `bogota-atlas`, site `gregmaya.github.io/bogota-atlas` | V5 (superseded) |
| [0006](decisions/0006-reading-etapas.md) | How the atlas reads `etapas.json` from several producers, in release and local mode | Follow-up of `bogota-pop` ADR-0013 |
| [0007](decisions/0007-basemap-sandwich.md) | Self-hosted Protomaps basemap split in two: base without labels below the data, labels in the active language above it | New |
| [0008](decisions/0008-etapas-access.md) | Etapas is public but unlisted, behind `?etapas=1` | New |

The visual language is in [docs/style.md](style.md).

## Architecture

```
bogota-pop ──┐  GitHub Releases: <id>.pmtiles + etapas.json      ┌─ public map (pinned tags)
             ├─────────────────────────────────────────────────►─┤
bogota-syntax┘  dev-YYYY-MM-DD pre-releases for Etapas           └─ Etapas (?etapas=1, latest dev-*)
                          │
                          ▼
        atlas deploy (GitHub Actions): download → validate → budget → build → Pages
```

- **Contract.** Layers are described by `etapas.json` as defined in `bogota-pop` ADR-0013, amended 2026-11-23 in [bogota-pop#13](https://github.com/gregmaya/bogota-pop/pull/13). bogota-syntax follows the same ADR by reference.
- **Pinning.** `atlas.config.json` names a release tag for each producer, plus `"dev": "latest"` for Etapas. A new producer release changes nothing on the site until this file changes.
- **Deploy.** For each producer, the workflow:
  1. Downloads the release files into `public/data/<producer>/<tag>/`.
  2. Validates `etapas.json` against `schema/etapas.schema.json`.
  3. Rejects any layer with `public: false`.
  4. Checks the size budget (ADR-0002).
  5. Builds and deploys.

  Everything is served from the same origin, so CORS never comes up.
- **Local mode.** `npm run dev:local` reads the full `etapas.json` files from `../bogota-pop/data/processed/etapas/` and `../bogota-syntax/data/processed/etapas/`, including private lot-level layers. The paths are set in a git-ignored `.env.local`. `npm run build` fails if they are set, so nothing read in local mode reaches `dist/`.
- **Map stack.** From bottom to top:
  1. Protomaps base with no labels.
  2. Data layers in group order: `poblacion`, then `red_vial`.
  3. The `context` group, which holds outlines such as the RENOBO pilot areas.
  4. Protomaps labels in the active language.

### Etapas layers expected (summary)

The real lists are each producer's `config/etapas.yaml`. This table only shows what to expect.

| Layer | Producer, phase | Level | Public |
| --- | --- | --- | --- |
| CNPV 2018 blocks as downloaded | bogota-pop, 1 | Block | Yes |
| Blocks with dwellings but 0 persons (unexplained) | bogota-pop, 1 | Block | Yes |
| MGN clase, UAECD blocks | bogota-pop, 1 | Block | Yes |
| MGN↔cadastre match, unmatched blocks highlighted | bogota-pop, 2 | Block | Yes |
| Residential weight per lot | bogota-pop, 2 | Lot | No, local only |
| MVP estimate 2026; housing-unit estimate v1 | bogota-pop, 2–3 | Block and H3 (lot local only) | Block and H3 |
| Back-cast residuals vs CNPV 2018 | bogota-pop, 4 | Block | Yes |
| Pilot centrality (closeness, betweenness) with `boundary_dist_m` | bogota-syntax, pilot | Street segment | Yes |
| RENOBO pilot areas, dashed | bogota-syntax, pilot | Polygon (Context) | Yes |

## Phase 0: Bootstrap

Goal: an empty but deployed site, with the hosting question answered by a real file.

- [ ] Rename the repo to `bogota-atlas` (GitHub Settings) and update local clones
- [ ] Merge this plan, `docs/style.md`, ADR-0001 to ADR-0008 and `CLAUDE.md`
- [ ] Scaffold Vite + React + TypeScript with `base: '/bogota-atlas/'`; ESLint, Prettier, `tsc --noEmit`, Vitest; GitHub Actions for lint, typecheck, test and build
- [ ] Self-host the fonts (Barlow, IBM Plex Mono) from `@fontsource` packages
- [ ] Cut the Protomaps Bogotá extract with `pmtiles extract` (bounds in `atlas.config.json`) and deploy a blank map with the base + labels split working in ES and EN
- [ ] Test on the deployed site that Pages answers PMTiles range requests (HTTP 206). The basemap extract is the test file
- [ ] Write `schema/etapas.schema.json` from ADR-0013 and a fixture `etapas.json` with one layer per style kind, including a dashed outline

**Exit gate:** the blank bilingual map is live at the Pages URL; range requests work; CI is green.

## Phase 1: Generic Etapas

Goal: any layer listed in an `etapas.json` appears on the map with no new code.

- [ ] Load one or more `etapas.json` files, key layers as `producer/id`, sort them into groups
- [ ] Draw the three style kinds (`sequential`, `categorical`, `outline` with `dash`), using the ramp that belongs to each group (style.md)
- [ ] Layer panel by group, with visibility and opacity; legend generated from the style hint and `unit`
- [ ] Information panel per layer: description, method, review text (Etapas only), sources, vigencia, licence, producer commit
- [ ] Inspect panel on click: the fields kept in the tiles, with the unit and field name as published
- [ ] ES/EN switch from two dictionaries (`src/i18n/es.json`, `en.json`); CI fails if their keys differ
- [ ] URL state: view, layers, language, compare
- [ ] Local mode against the producers' `data/processed/etapas/`

**Exit gate:** every layer in the fixture renders and inspects in both languages; adding a layer to the fixture needs no code change.

## Phase 2: Deploy from releases

Goal: the site is built from real producer releases.

- [ ] `atlas.config.json` with pinned tags and the dev channel
- [ ] Deploy workflow: download, schema check, privacy check, size budget, build. It runs on push to `main`, on manual dispatch, and on a schedule to pick up new `dev-*` pre-releases
- [ ] First real layers: bogota-pop Phase 1 (MGN 2018 blocks, MGN clase, UAECD blocks) and the bogota-syntax pilot centrality, as they publish
- [ ] Attribution line built from the visible layers' `attribution` plus OpenStreetMap for the basemap

**Exit gate:** a new `dev-*` pre-release from either producer appears in Etapas without a commit here.

## Phase 3: Compare and mobile

- [ ] Swipe compare with two synced maps (`@maplibre/maplibre-gl-compare` or a small hand-written equivalent); desktop only
- [ ] Bottom-sheet layout below the mobile breakpoint
- [ ] Accessibility pass: keyboard focus, contrast of panels over the map, `prefers-reduced-motion`

**Exit gate:** 2018 blocks against a second layer works by swipe; the site is usable on a phone in both languages.

## Phase 4: Public v0.1

Tied to `bogota-pop` release `v0.1` (MVP model).

- [ ] Public map mode pinned to `v0.1` and the first bogota-syntax release
- [ ] Block choropleth with H3 toggle and UPZ/UPL panel (V3), reading the summary JSON
- [ ] About page in both languages: what each producer does, how to cite, licences (CC BY 4.0 for bogota-pop outputs, ODbL for bogota-syntax outputs, ODbL for the OpenStreetMap basemap)

**Exit gate:** the public map is linked from both producer READMEs.

## Later

- Charts in panels with Observable Plot, wrapped in one React component. Each panel keeps a slot for one, so nothing needs reworking later.
- Year slider once two population releases exist; scenario layers after `bogota-pop` Phase 5.
- Map labels in Barlow, which would need glyph files generated for MapLibre. Labels use the Protomaps Noto Sans glyphs until then.

## Risks

| Risk | Mitigation |
| --- | --- |
| Pages limits: 100 MB per file, about 1 GB per site | Budget check fails the deploy before the limit; R2 fallback in ADR-0002 |
| Many Etapas layers from two producers fill the budget | Etapas carries only the latest `dev-*` of each producer; old ones are not kept |
| Contract changes in a producer break the site | `schema_version` checked at deploy; a mismatch fails the build, the live site stays as it was |
| A private layer leaks into a release | Producers check in code (ADR-0013 rule 4); the atlas checks again at deploy |
