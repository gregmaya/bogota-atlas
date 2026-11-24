# ADR-0004: Languages: Spanish default, English toggle

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Purpose and scope in [docs/plan.md](../plan.md)

## Context

V4 made the viewer Spanish only. The atlas is meant to be read by Bogotá's institutions and by an international methods audience, so every explanation and source should be available in English too.

## Decision

- The whole site is bilingual: Spanish by default, English on a toggle.
- The language is held in the URL (`lang=en`), so a shared link opens in the language it was shared in.
- Interface text comes from `src/i18n/es.json` and `src/i18n/en.json`. CI fails if their keys differ.
- Layer text (title, description, method, review, unit) comes from producers as `{es, en}` objects (`bogota-pop` ADR-0013).
- Map labels switch with the language (ADR-0007).
- Data stays as published: field names and source codes are never translated.

## Alternatives considered

- **Spanish interface, bilingual content:** half the site would ignore the toggle.
- **Both languages side by side:** doubles the length of every panel over the map.

## Consequences

- Supersedes V4.
- Every new piece of interface text is written twice, checked by CI.
