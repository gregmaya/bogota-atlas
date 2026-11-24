# ADR-0010: Basemap flavour: Protomaps white

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Phase 0 in [docs/plan.md](../plan.md)

Amends the flavour in [ADR-0007](0007-basemap-sandwich.md). The rest of ADR-0007 stands.

## Context

ADR-0007 named the Protomaps light flavour, desaturated. Rendered over Bogotá, light shows green parks and blue water that compete with the data ramps. Protomaps also ships grayscale and white flavours that need no colour changes of our own.

## Decision

Use the Protomaps `white` flavour as shipped, with every label halo set to `--paper`. The flavour name is `basemap.flavor` in `atlas.config.json`; the matching sprite comes from the basemap release.

## Alternatives considered

- **light:** green and blue compete with data colours.
- **grayscale:** more texture, but its mid-grey ground lowers the contrast of pale data classes.
- **light, desaturated by us:** most control, but colour code to maintain and tune.

## Consequences

- Parks and water barely show. If a layer needs them as context, that is a Context layer, not a basemap change.
- Changing flavour is one value in `atlas.config.json`; all sprite flavours are already in the release.
