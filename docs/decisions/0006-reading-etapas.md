# ADR-0006: Reading etapas.json from several producers

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Architecture in [docs/plan.md](../plan.md)

## Context

`bogota-pop` ADR-0013 defines `etapas.json` and leaves it to the viewer to decide how it reads the file in release mode and in local mode. The atlas reads from two producers, each with its own file.

## Decision

- `atlas.config.json` lists producers, each with a pinned release tag for the public map and a dev channel (`latest` `dev-*` pre-release) for Etapas.
- Layers are keyed `producer/id`. The group order is fixed: `poblacion`, `red_vial`, then `context` on top.
- `schema/etapas.schema.json` mirrors ADR-0013 and is checked at deploy. A file with an unknown major `schema_version` fails the build.
- At deploy, any layer with `public: false` fails the build, even though producers already exclude them.
- **Release mode** reads `/data/<producer>/<tag>/etapas.json` from the site itself.
- **Local mode** (`npm run dev:local`) reads `../<producer>/data/processed/etapas/etapas.json`, which can include private layers. It is never used to build for deploy.

## Alternatives considered

- **One merged `etapas.json` written by a producer:** couples the producers to each other.
- **Fetch the producers' lists at runtime from GitHub:** CORS (ADR-0002), and the site would change without a deploy.

## Consequences

- A third producer is one entry in `atlas.config.json`.
- New `style.kind` values still need code here, agreed with the producers first.
