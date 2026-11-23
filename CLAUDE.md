# CLAUDE.md — bogota-pop-viewer

Static web map of Bogotá's modelled population, built on the data published by `gregmaya/bogota-pop`. Live at `https://gregmaya.github.io/bogota-pop-viewer/`.

The plan for this repo is in `docs/plan.md` (the "Parallel track: online viewer" section of the model plan). Decisions V1–V5 live in `docs/decisions/` as ADRs.

## Current status

- Phase: **waiting on model Phase 1** (update this line as work starts)
- First milestone: blank map deployed, then the CNPV 2018 block layer served as PMTiles from GitHub Pages

## Stack

- Vite + MapLibre GL JS + PMTiles (ADR V1). Plain JavaScript or TypeScript, decided at scaffold time, then noted here.
- No backend, no database, no server code. Everything is static and deployable to GitHub Pages.
- Tiles built with tippecanoe in the model repo, not here.

## Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # serve the build locally
```

Update this block when scripts change.

## Data contract with bogota-pop

1. **The viewer only reads published files.** PMTiles and the UPZ/UPL summary JSON attached to a bogota-pop Release. It never imports or calls the Python package.
2. **The public map is pinned to one release tag** in `src/config` (for example `v0.1`). A new model release never changes the live site until the tag is bumped on purpose in a PR.
3. **Etapas mode** follows the latest dev pre-release (`dev-YYYY-MM-DD`) and shows one layer per model stage. It must say clearly that the layers are work in progress.
4. **No lot-level data, ever, in this repo or on the live site.** Lot-level stage tiles are viewed only by running `npm run dev` against local files in `../bogota-pop/data/processed/`. That path is configured through a git-ignored `.env.local`, and nothing from it gets committed or built into `dist/`.

## Hosting

- GitHub Pages, with `base: '/bogota-pop-viewer/'` in the Vite config.
- PMTiles served from Pages while each file stays well under Pages' 100 MB file limit. If a file approaches it, or range requests or CORS fail, move tiles to Cloudflare R2 (ADR V2) and record the change here.
- No API keys or tokens in the repo. Basemap must be keyless or use a public style.

## UI conventions

- **Interface in Spanish only** (ADR V4). Code, comments, commit messages and issues in English.
- v0.1 scope: block choropleth, H3 toggle, UPZ panel. Year slider only once two releases exist. Scenarios only after model Phase 5. Don't add features beyond the current scope without asking.
- Colour: one sequential palette for population density, colour-blind safe, with a legend that states units (personas, personas/ha) and the data release and year.
- Every map view shows its source and licence: "Datos: bogota-pop vX.Y (CC BY 4.0), basado en DANE, UAECD y SDP".
- Anonymised blocks (DANE DATO_ANM) are drawn distinctly (hatched or outlined) and explained in the legend, never shown as zero.
- Works on mobile first. Keep the JS bundle small; avoid heavy UI frameworks unless agreed.

## How to work with me (Greg)

- Talk a decision through before writing code for it. If something isn't in the plan or an ADR, propose it and wait.
- Stop after each step for review.
- Small PRs, one per task.
- When the model repo's published file names or schemas change, update the data loading code and note the release tag it targets.
