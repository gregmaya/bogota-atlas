# ADR-0001: Stack: Vite, React, TypeScript, MapLibre GL JS, PMTiles

- **Status:** Proposed
- **Date:** 2026-11-23
- **Plan reference:** Decisions, Phase 0 in [docs/plan.md](../plan.md)

## Context

V1 (closed 2026-11-14 in the `bogota-pop` plan) chose a static site with Vite, MapLibre GL JS and PMTiles. The atlas now needs bilingual panels, an inspect panel, swipe compare and, later, charts in panels. Hand-built panels with plain TypeScript get harder to keep consistent as these pile up. The site must still stay small and easy to read.

## Decision

Vite + React + TypeScript, with MapLibre GL JS and the `pmtiles` protocol. Kept lean:

- No router: one page; state that should survive a reload lives in the URL.
- No global state library at first; React context plus `useReducer`. Zustand only if prop-passing becomes a problem.
- No i18n library: two JSON dictionaries and one `t()` helper (ADR-0004).
- No UI kit: plain CSS with custom properties from `docs/style.md`, one CSS module per component.
- Charts later with Observable Plot inside a single wrapper component.
- Tooling: ESLint, Prettier, `tsc --noEmit`, Vitest. Node version pinned in `.nvmrc`.

## Alternatives considered

- **Vanilla TypeScript:** smallest bundle, but every panel's state and re-rendering is hand-written, and charts later would add more of it.
- **Svelte:** smaller than React and well suited, but React has the wider ecosystem for charts and map components.
- **A React map wrapper (react-map-gl):** convenient, but adds a layer between the code and MapLibre's own docs. The map is created once in one component and driven imperatively.

## Consequences

- The bundle is larger than vanilla; it is checked in CI (Phase 0) so growth is visible.
- Any new dependency is a decision to talk through first (CLAUDE.md).
