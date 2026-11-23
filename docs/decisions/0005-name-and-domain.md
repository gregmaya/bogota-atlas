# ADR-0005: Name and domain: bogota-atlas

- **Status:** Proposed
- **Date:** 2026-11-23
- **Plan reference:** Purpose and scope in [docs/plan.md](../plan.md)

## Context

V5 set the domain as `gregmaya.github.io/bogota-pop-viewer`. The site now shows street-network centrality as well as population, and is meant to read as a publication, not a tool attached to one model.

## Decision

The repo is `gregmaya/bogota-atlas` and the site is `gregmaya.github.io/bogota-atlas`. The displayed title is "Atlas de Bogotá" / "Bogotá Atlas".

## Alternatives considered

- **Keep `bogota-pop-viewer`:** no change needed, but the name undersells the second producer.
- **`bogota-viewer`:** accurate, but describes a tool rather than a publication.

## Consequences

- Supersedes V5.
- GitHub redirects the old repo URL. Links in the producer READMEs and `CLAUDE.md` files are updated to the new name.
- A custom domain can be added later without changing the repo.
