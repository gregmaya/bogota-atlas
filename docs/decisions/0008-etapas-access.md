# ADR-0008: Etapas: public but unlisted

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Purpose and scope in [docs/plan.md](../plan.md)

## Context

Etapas shows intermediate pipeline layers so each stage can be reviewed on a map. Showing the work supports trust, but most visitors should land on the finished map.

## Decision

Etapas is deployed with the public site and opened with `?etapas=1`. Nothing on the site links to it. When it is open, a persistent banner says the layers are work in progress, in the active language. Lot-level layers never reach it (ADR-0006, `bogota-pop` ADR-0006).

## Alternatives considered

- **Public and linked:** visitors would mistake review layers for results.
- **Local only:** reviewers without the repos could not see it.

## Consequences

- Anyone with the link can see Etapas; it is unlisted, not private.
