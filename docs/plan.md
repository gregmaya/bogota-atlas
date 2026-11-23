# Bogotá Population Model-viewer: Project Plan

## Parallel track: online viewer (separate repo)

The viewer lives in its own repo (working name `bogota-pop-viewer`) with its own environment, and treats the model repo as a data provider. It never imports the Python package; it only reads published, versioned files.

**Data contract between the two repos.** The model repo's Phase 6 adds one more output per release: vector tiles of block and H3 results, built with tippecanoe into a single PMTiles file, plus a small JSON of UPZ/UPL summaries. The viewer pins a release tag (`v0.1`, `v1.0`) in its config, so a new model release never breaks the live site until the viewer is bumped on purpose.

**It can start early.** Once Phase 1 lands, the CNPV 2018 block layer is real, public data with the same geometry the model will publish. The viewer can be built against it while Phases 2–3 run, then switch to `v0.1` when it exists.

**Viewer decisions (closed 14 Nov 2026):**

| #   | Decision               | Chosen                                                                                                                                                                           |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | Stack                  | Static site: Vite + MapLibre GL JS + PMTiles                                                                                                                                     |
| V2  | Where tiles are hosted | GitHub Pages in the viewer repo while the PMTiles file stays well under the 100 MB file limit; Cloudflare R2 if it grows. Range requests and CORS tested in the viewer's Phase 0 |
| V3  | First version's scope  | Block choropleth, H3 toggle and UPZ panel for v0.1; year slider once two releases exist; scenarios after model Phase 5                                                           |
| V4  | UI language            | Spanish only (the model repo's docs stay bilingual per D4)                                                                                                                       |
| V5  | Domain                 | gregmaya.github.io/bogota-pop-viewer                                                                                                                                             |

- [ ] Write V1–V5 as ADRs in the viewer repo
- [ ] Add a PMTiles + summary JSON step to the model repo's Phase 6 checklist
- [ ] Create the viewer repo empty alongside the model repo; start building once model Phase 1 ships the 2018 block layer

### Etapas mode: every stage on the map

Each model stage writes its own PMTiles next to its regular output, so progress is reviewed on a map, not only in metrics. The viewer gets a second mode, "Etapas", with a layer switcher across them.

| Stage layer                                      | Produced in | Level                              | Public            |
| ------------------------------------------------ | ----------- | ---------------------------------- | ----------------- |
| CNPV 2018 blocks as downloaded                   | Phase 1     | Block                              | Yes               |
| Blocks anonymised by DANE (DATO_ANM)             | Phase 1     | Block                              | Yes               |
| MGN↔cadastre match, unmatched blocks highlighted | Phase 2     | Block                              | Yes               |
| Residential weight per lot                       | Phase 2     | Lot                                | No, local only    |
| MVP estimate, 2026                               | Phase 2     | Lot (local), block and H3 (public) | Block and H3 only |
| Housing-unit estimate, v1                        | Phase 3     | Lot (local), block and H3 (public) | Block and H3 only |
| Back-cast residuals vs CNPV 2018                 | Phase 4     | Block                              | Yes               |
| Scenario deltas                                  | Phase 5     | Block and H3                       | Yes               |

- Development tiles ship as GitHub pre-releases tagged by date (`dev-2026-12-01`). Etapas follows the latest pre-release; the public map stays pinned to the official release.
- Lot-level layers never leave your machine: run the viewer with `npm run dev` pointed at local tiles in `data/processed/`.
- Every phase's exit gate includes reviewing its stage tiles in Etapas.
- The viewer's first real milestone moves up to model Phase 1, with the 2018 and anonymised block layers.
