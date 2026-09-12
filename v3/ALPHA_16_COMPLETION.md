# Alpha.16 Completion Gate — Safe Travel Foundation

Version target: `3.0.0-alpha.16.0`

Alpha.16 introduces bounded Travel planning and progress verification without granting live travel authority. The purpose is to prove destination validation, leases, no-progress handling and circuit breaking before `smart_move` is ever enabled for controlled Merchant work.

## Travel contract

- stable Travel Plan IDs;
- known-map validation from live game metadata;
- Content Drift revalidation blocks changed maps;
- unknown maps fail closed;
- server/region changes are forbidden;
- plan capacity is hard bounded;
- every plan has a lease and no-progress budget;
- progress requires a material position change or observed map transition;
- same-map coordinate destinations use an arrival radius;
- map-only cross-map plans complete only after the map change is observed;
- repeated failures open a bounded Travel circuit breaker;
- cancellation is terminal and observable;
- all status and diagnostics are JSON-safe.

## Authority boundary

Alpha.16 exposes planning/diagnostic APIs only:

- `AIO_V3.travel.status()`
- `list(limit)` / `get(id)`
- `plan(request)`
- `cancel(id, reason)`
- `breaker()`

There is deliberately no public `execute()` or live-enable API. `smart_move` is not invoked by Alpha.16.

## Certification scope

- historical Alpha.15 runtime version freeze;
- schema/mode/no-authority boundaries;
- known-map plan creation;
- unknown-map rejection;
- Content Drift map blocking;
- server-change rejection;
- synthetic same-map progress and arrival verification;
- synthetic cross-map observation verification;
- no-progress fail-safe behavior;
- circuit cooldown;
- cancellation terminality;
- Alpha.16 runtime integration;
- all prior Alpha.8–15 regressions;
- generated browser bundle smoke;
- 2000-cycle travel planning/cancel soak.

Defaults remain `shadow`, `productionReplacement=false`, Party live controls OFF, Economy live execution OFF, Brain no gameplay authority and unknown content quarantined.

The first real Travel execution is intentionally deferred to Alpha.17 where it is coupled to controlled Merchant transactions and the monitoring/log GUI.

Freeze status: implementation candidate pending branch and exact PR-head CI.
