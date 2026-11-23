# Kickoff prompt for the viewer repo

Paste everything below the line as the first message of a Claude Code session started in `../bogota-pop-viewer`. It is kept here so the method stays the same each time the viewer work restarts. Update it when ADR-0013 changes.

---

We're starting work on the viewer. Before anything else, read these, in order:

1. This repo's `CLAUDE.md` and `docs/plan.md`.
2. In the model repo, read only (never edit it from this session):
   - `../bogota-pop/docs/decisions/0013-etapas-layer-contract.md`: the contract between the two repos. It is still **Proposed**; if something in it is hard to build in the viewer, say so, and I will take it back to the model repo.
   - `../bogota-pop/config/etapas.yaml`, if it exists yet: the real list of layers.
   - `../bogota-pop/docs/glossary.md`: acronyms and Spanish terms. Spell out an acronym the first time it appears in an issue or PR, using this glossary; never guess one.

## How the two repos work together

- **The model repo owns the layer list.** For each review layer it writes one PMTiles file and lists it in `etapas.json`, with a Spanish title, what to look for (`review`), level, public or not, fields, a style hint (`sequential`, `categorical` or `outline`) and attribution.
- **The viewer draws whatever `etapas.json` lists, the same generic way.** No code per layer. Adding a layer in the model repo must need no change here. A new style kind is agreed in both repos first.
- **Two ways of reading `etapas.json`:**
  - **Release mode:** the latest `dev-YYYY-MM-DD` pre-release of `gregmaya/bogota-pop`. It holds public layers only, and is what the deployed site shows.
  - **Local mode:** `../bogota-pop/data/processed/etapas/`, set through a git-ignored `.env.local`, used only with `npm run dev`. It may include private, lot-level layers. Nothing read in local mode is ever committed or built into `dist/`. Add a check that fails the build if the local path is set during `npm run build`.
- **One session per repo.** If the viewer needs something from the model (a field, a layer, a key in `etapas.json`), don't change the model repo. Tell me, and draft the request as a note I can take there.

## Corrections to this repo's CLAUDE.md

Fix these as part of the first step:

- **Tiles:** they are written with GDAL's PMTiles driver in the model repo (ADR-0013), not tippecanoe.
- **Anonymised blocks:** `DATO_ANM` is not an anonymisation flag. It names the level a block's data is published at, and is `MANZANA` for every Bogotá block. The model found no household people missing from blocks in Bogotá's urban area, so the layer is called "Blocks with dwellings but 0 persons (unexplained)". Draw those blocks distinctly, but don't call them anonymised.
- **Data contract:** add `etapas.json` to the files the viewer reads, and point to ADR-0013.

## Steps (stop after each one for my review)

1. **ADRs V1–V5.** Write them from the table in `docs/plan.md`, plus the CLAUDE.md fixes above.
2. **Propose ADR V6, "Reading Etapas layers".** It should cover:
   - release mode and local mode
   - how the generic layer switcher and style kinds work
   - how the build check keeps local data out of `dist/`
   - the TypeScript or JavaScript choice, with a recommendation

   Talk it through with me before writing code.
3. **Scaffold.** Vite + MapLibre GL JS + PMTiles. A blank map of Bogotá with a keyless basemap, deployed to GitHub Pages. Test range requests and CORS on Pages (ADR V2).
4. **Generic Etapas mode against a fixture.** A small `etapas.json` and a tiny PMTiles file in `tests/fixtures/`, matching ADR-0013's schema, with one layer of each style kind. The map shows the layer list, the `review` text and the attribution.
5. **Real layers.** Once the model repo writes its first layers, point local mode at them, then release mode at the first `dev-` pre-release.

## How I work

- Talk a decision through before writing code for it. If something isn't covered by the plan or an ADR, propose it and wait.
- Stop after each step for review. Small PRs, one per task.
- Don't commit or push unless I ask. Anything public on GitHub (issues, labels, releases, Pages settings) needs my go-ahead first.
- The interface is in Spanish only. Code, comments, commits and issues are in English.
- Explain unfamiliar things simply, with a recommendation. Write docs in easy language, so I can remember them later.
- End each step with a short progress table of the steps above, marked ✅ done / 🟡 in progress (say what's missing) / ⏭️ skipped / ⬜ not started.
