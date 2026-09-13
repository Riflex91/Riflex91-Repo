# Adventure Land v3 Logic Guardian

The Logic Guardian protects cross-module behavior that ordinary unit tests can miss. It is deliberately separate from the Release Guardian: release checks answer "is this build coherent?" while logic checks answer "can individually valid subsystems combine into an impossible state?"

## Hard rule

Never fix liveness by weakening safety. In particular, Target Automatron remains non-attackable, unknown content stays fail-closed, dangerous/custom exclusions stay blocked, and supervisors may stop automation but may not bypass TargetSafety.

## Deterministic gate

`npm run logic:guard` runs a small high-value suite before the full test matrix. The machine-readable contract is `logic/invariants.json`. Invariants marked `test` must reference real deterministic tests; the contract test fails if those references drift.

The liveness suite explicitly covers the Alpha20.23 failure class: an attack decision can reject a target while a different subsystem blocks navigation. If useful work is expected and there is neither a safe alternate action nor an explicit safe stop, the model classifies that state as `DEADLOCK`.

It also checks bounded Farmer progress in healthy fixtures and verifies that shadow planning advances rather than remaining indefinitely at revision zero.

## Property-based safety checks

`fast-check` exercises the high-risk logic with reproducible generated states rather than a few hand-written examples. The property suite currently generates 1,000 combinations per property with fixed seeds so every CI failure can be reproduced exactly.

The first properties lock the exact `DEADLOCK` boundary and the Alpha20.23 navigation-release rule: self-aggro, selected, planned, failed TargetSafety evaluation, null safety results, or any reason other than the exact training-target denial must stay fail-closed.

## Static analysis

`npm run static:guard` combines two free deterministic analyzers:

- TypeScript `checkJs` validates the small pure Logic Guardian model with strict JSDoc contracts without converting runtime JavaScript to TypeScript.
- `dependency-cruiser` blocks circular dependency chains in critical Farmer/reliability/Merchant modules, forbids production runtime imports from tests, and prevents Merchant modules from directly importing Farmer runtime modules.

Invariants enforced this way are marked `static-analysis`. Invariants that still require human architectural judgment may remain `manual-review`.

## Local commands

Run `npm install` once in `v3/` before using the new guard tools locally.

- `npm run release:guard` — release/version consistency.
- `npm run logic:guard` — deterministic invariant, liveness and property gate.
- `npm run test:properties` — property-based tests only.
- `npm run typecheck:logic` — strict `checkJs` pass over the typed Logic Guardian model.
- `npm run check:architecture` — dependency-cruiser architecture rules.
- `npm run static:guard` — typecheck plus architecture analysis.
- `npm run preflight` — Release Guardian, Logic Guardian and static guard.
- `npm run check:full` — complete build/test/bundle/cloud checks.
- `npm run check` — preflight followed by the full suite.

## Review policy

A semantic review should block only for a concrete invariant violation, a reproducible hidden deadlock/livelock, an authority escalation, or a safety bypass. Speculative concerns should be warnings with a proposed regression test.

Mutation testing is a later hardening layer; it should be introduced only after the invariant suite is stable so it measures test strength instead of adding noise to every hotfix.
