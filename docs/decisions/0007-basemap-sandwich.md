# ADR-0007: Basemap: Protomaps, split around the data

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Architecture in [docs/plan.md](../plan.md)

## Context

The data layers need a calm grey basemap. Labels must stay readable above the data, not hidden under a choropleth, and they must follow the site language.

## Decision

- The basemap is a Protomaps extract of the Bogotá region (`pmtiles extract`), served with the site like the data (ADR-0002), with fonts and sprites self-hosted.
- **Bounds:** the bounding box of Bogotá's urban area (DANE MGN 2018, clase 1, cabecera) buffered by 10 km: `-74.314, 4.371, -73.911, 4.924`. Max zoom 15, the deepest Protomaps builds; MapLibre overzooms past it. About 24 MB (dry run, build 2026-11-23).
- **Hosting:** the extract is attached to a release of this repo, tagged `basemap-YYYY-MM-DD` after the Protomaps build date. `atlas.config.json` pins the tag, the bounds and the build date, and `fetch-data` downloads it into `public/data/basemap/` like a producer file. It is never committed to git.
- The `pmtiles` command-line tool is pinned to one version and downloaded into the git-ignored `.tools/bin/`.
- The style is generated with `@protomaps/basemaps` (light flavour, desaturated) and split in two by layer type:
  1. Base: everything except `symbol` layers, at the bottom.
  2. Labels: the `symbol` layers only, at the top, generated for `es` or `en`.
- Changing language swaps only the label layers.
- Attribution: OpenStreetMap contributors and Protomaps, always visible.

## Alternatives considered

- **CARTO Positron or another hosted style:** quicker, but depends on a third party's terms and uptime, and its labels are not easy to separate.
- **MapTiler or Stadia:** API keys and free-tier limits.
- **Protomaps hosted API or OpenFreeMap:** saves about 24 MB of the 800 MB budget (3%), but adds a key visible in the page (Protomaps) or a donation-run service with no uptime promise (OpenFreeMap).
- **Bounds covering all of Bogotá D.C.:** includes Sumapaz down to latitude 3.73 for 29 MB. Not chosen; the atlas centres on the urban area.
- **Commit the extract to git, or re-extract at every deploy:** the first keeps every copy in git history forever; the second changes the basemap silently between deploys and depends on build.protomaps.com being up.

## Consequences

- The extract is rebuilt by hand when a fresher OSM build is wanted: cut it, attach it to a new `basemap-*` release, change the tag in `atlas.config.json`.
- Data layers in rural Sumapaz sit outside the basemap and are drawn over a plain background.
- `atlas.config.json` exists from Phase 0, holding only the basemap entry; producers are added in Phase 2.
- Map labels use Protomaps' Noto Sans glyphs until Barlow glyphs are generated (plan, Later).
