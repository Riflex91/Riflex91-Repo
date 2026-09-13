# Adventure Land v3 Logic Guardian

The Logic Guardian protects cross-module behavior that ordinary unit tests can miss. It is deliberately separate from the Release Guardian: release checks answer "is this build coherent?" while logic checks answer "can individually valid subsystems combine into an impossible state?"

## Hard rule

Never fix liveness by weakening safety. In particular, Target Automatron remains non-attackable, unknown content stays fail-closed, dangerous/custom exclusions stay blocked, and supervisors may stop automation but may not bypass TargetSafety.

## Deterministic gate

`npm run logic:guard` runs a small high-value suite before the full test matrix. The machine-readable contract is `logic/invariants.json`. Invariants marked `test` must reference real deterministic tests; the contract test fails if those references drift.

The liveness suite explicitly covers the Alpha20.23 failure class: an attack decision can reject a target while a different subsystem blocks navigation. If useful work is expected and there is neither a safe alternate action nor an explicit safe stop, the model classifies that state as `DEADLOCK`.

It also checks bounded Farmer progress in healthy fixtures and verifies that shadow planning advances rather than remaining indefinitely at revision zero.

## AI adversarial review

Pull requests can additionally run a read-only Codex review from `.github/workflows/v3-ai-logic-review.yml`. The reviewer reads `.github/codex/v3-logic-review.md`, the invariant registry, and the PR diff. Its job is to construct counterexamples across TargetSafety, navigation, Farmer FSM, supervisor, party control, Merchant authority, local-plan priority and live gates.

The AI reviewer is advisory and never edits, pushes, approves or merges. Deterministic tests remain the hard gate. If `OPENAI_API_KEY` is not configured as a repository Actions secret, the AI job exits successfully with an explicit skip message; normal CI is unaffected.

## Local commands

- `npm run release:guard` — release/version consistency.
- `npm run logic:guard` — invariant and liveness gate.
- `npm run preflight` — both guardians, in that order.
- `npm run check:full` — complete build/test/bundle/cloud checks.
- `npm run check` — preflight followed by the full suite.

## Review policy

A semantic review should block only for a concrete invariant violation, a reproducible hidden deadlock/livelock, an authority escalation, or a safety bypass. Speculative concerns should be warnings with a proposed regression test.

Mutation testing is a later hardening layer; it should be introduced only after the invariant suite is stable so it measures test strength instead of adding noise to every hotfix.
