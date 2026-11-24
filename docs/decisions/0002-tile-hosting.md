# ADR-0002: Tile hosting: copied into GitHub Pages at deploy

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Architecture in [docs/plan.md](../plan.md)

## Context

Producers attach PMTiles and `etapas.json` to GitHub Releases. As far as is known, release downloads redirect to a storage host that does not send CORS headers, so a browser on another origin cannot read them. PMTiles also needs HTTP range requests. V2 chose GitHub Pages with Cloudflare R2 as the fallback.

## Decision

The deploy workflow downloads the pinned release files of each producer into the build (`public/data/<producer>/<tag>/`) and publishes them with the site on GitHub Pages. Tiles are then same-origin.

The workflow fails before deploying if:

- any single file is over 90 MB (Pages limit: 100 MB), or
- the whole site is over 800 MB (Pages limit: about 1 GB).

Phase 0 checks range requests on the live site with the basemap extract.

## Alternatives considered

- **Read release assets directly:** no copy step, but blocked by CORS.
- **Cloudflare R2 from the start:** no size limits, but needs an account, credentials in two producer repos and a bucket to look after. It stays the fallback when the budget check starts failing.
- **Each producer serves its own Pages site:** CORS headers on every site, and three deploys to keep in step.

## Consequences

- A producer release reaches the site only through a deploy here, which is also when it gets validated.
- Etapas keeps only the latest `dev-*` per producer, to stay inside the budget.
- Moving to R2 later means changing the base URL in `atlas.config.json` and the upload step, not the app.
