# V4 Dependency Rules

These rules are enforced by `dependency-cruiser.cjs` and should be treated as architecture contracts.

- `packages/*` never imports from `apps/*`.
- `core` remains foundational and does not depend on higher-level packages.
- `domain` does not depend on orchestration, intelligence, reliability, observability or adapters.
- `decision` does not invoke adapters directly; application composition provides ports/bindings.
- `intelligence` may analyze and propose, but cannot directly control Adventure Land or other adapters.
- `reliability` detects, blocks, recovers and reconciles; it does not own planning or learned strategy.
- Runtime cycles are forbidden.

When a dependency does not fit these rules, prefer introducing a protocol/port or moving responsibility to the package that owns the behavior instead of weakening the boundary.
