# ADR-0007: Basemap: Protomaps, split around the data

- **Status:** Proposed
- **Date:** 2026-11-23
- **Plan reference:** Architecture in [docs/plan.md](../plan.md)

## Context

The data layers need a calm grey basemap. Labels must stay readable above the data, not hidden under a choropleth, and they must follow the site language.

## Decision

- The basemap is a Protomaps extract of the Bogotá region (`pmtiles extract`, bounds in `atlas.config.json`), served with the site like the data (ADR-0002), with fonts and sprites self-hosted.
- The style is generated with `@protomaps/basemaps` (light flavour, desaturated) and split in two by layer type:
  1. Base: everything except `symbol` layers, at the bottom.
  2. Labels: the `symbol` layers only, at the top, generated for `es` or `en`.
- Changing language swaps only the label layers.
- Attribution: OpenStreetMap contributors and Protomaps, always visible.

## Alternatives considered

- **CARTO Positron or another hosted style:** quicker, but depends on a third party's terms and uptime, and its labels are not easy to separate.
- **MapTiler or Stadia:** API keys and free-tier limits.

## Consequences

- The extract is rebuilt by hand when a fresher OSM build is wanted; the date of the build is recorded in `atlas.config.json`.
- Map labels use Protomaps' Noto Sans glyphs until Barlow glyphs are generated (plan, Later).
