# Adventure Land Bot v4

V4 starts as a clean architecture baseline for the next generation of the Adventure Land bot.

## Goals

- 24/7 operation with explicit liveness, recovery and reconciliation boundaries
- clear separation between game domain, decision logic, intelligence, reliability and infrastructure
- simulation- and telemetry-driven development
- safe evolution toward adaptive and learning behavior
- reproducible CI, releases and architecture checks

## Repository layout

- `apps/` deployable/runtime applications
- `packages/` reusable bot modules
- `config/` validated configuration
- `infrastructure/` deployment and persistence assets
- `data/` schemas, reference data and fixtures
- `tests/` unit, integration, contract, regression, property and smoke tests
- `simulations/` deterministic scenario and replay harnesses
- `docs/` architecture, ADRs, contracts, protocols and runbooks
- `tools/` build, validation, release and development tooling

## Architectural rule

Runtime and version history must not leak into module names. Milestones such as alpha/beta/release belong in Git tags, releases and the changelog, not in production class or file names.

V3 remains the reference implementation while V4 is built incrementally.
