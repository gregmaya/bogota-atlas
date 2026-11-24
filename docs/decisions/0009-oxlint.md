# ADR-0009: Linter: oxlint instead of ESLint

- **Status:** Accepted
- **Date:** 2026-11-23
- **Plan reference:** Phase 0 in [docs/plan.md](../plan.md)

Amends the tooling line of [ADR-0001](0001-stack.md). The rest of ADR-0001 stands.

## Context

ADR-0001 named ESLint. The official Vite React + TypeScript template, as of 2026-11, ships oxlint and TypeScript 7 (the native compiler) instead. ESLint's TypeScript plugin would have to be checked against TypeScript 7, possibly by pinning TypeScript 5.

## Decision

Use oxlint with the template's configuration (`react`, `typescript`, `oxc` plugins). Prettier formats, `tsc -b` typechecks, Vitest tests, as ADR-0001 says.

## Alternatives considered

- **ESLint:** larger set of plugins, but more configuration and an uncertain fit with TypeScript 7 today.

## Consequences

- Linting is fast and follows the template's defaults, so future template updates are easy to compare.
- A rule only available as an ESLint plugin would need a new decision.
