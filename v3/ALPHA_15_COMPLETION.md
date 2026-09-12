# Alpha.15 Completion Gate — Restart-Safe Economy Transaction Engine Foundation

Version target: `3.0.0-alpha.15.0`

Alpha.15 introduces the transaction boundary required before any destructive Merchant action may execute. The phase is intentionally shadow-only: it may plan, reserve, expire, reconcile and circuit-break Economy work, but it may not call `sell`, `bank_store`, `compound`, `upgrade`, `exchange`, `trade` or item-transfer APIs.

## Transaction contract

Supported transaction families are `SELL`, `BANK`, `EXCHANGE`, `COMPOUND` and `UPGRADE`. Each request receives a stable transaction ID and must pass a fresh Inventory Ledger preflight. The Ledger remains the only authority for item meaning.

Safety properties:

- exact `character:index` item identity is required;
- quantity may not exceed the observed stack;
- the transaction family must match the Ledger disposition;
- `UNDECIDED`, `KEEP`, group reserves and unrelated progression reservations fail closed;
- one item key may be reserved by at most one nonterminal transaction;
- reservations have bounded leases and are released on cancel/expiry/reconcile;
- transaction storage is schema-versioned and hard bounded;
- corrupt persistence fails closed;
- after restart every nonterminal transaction becomes `RECOVERING` and requires reconciliation;
- Alpha.15 reconciliation aborts safely instead of blindly resuming;
- action families have independent bounded failure windows and circuit breakers;
- the general `GameAdapter` still rejects destructive Economy actions.

## Runtime/API

Read/planning API:

- `AIO_V3.economy.status()`
- `AIO_V3.economy.transactions.status()`
- `list(limit)` / `get(id)`
- `plan(request)`
- `cancel(id, reason)`
- `reconcile(id)`
- `breaker(family)`
- `save()`

There is deliberately no `execute()` API and no public live-enable switch in Alpha.15.

## Certification scope

The Alpha.15 internal gate covers:

- frozen historical Alpha.14 runtime version semantics;
- schema/mode/no-authority boundaries;
- Ledger disposition preflight;
- protected-item fail-closed behavior;
- reservation exclusivity and release;
- transaction lease expiry;
- restart reconciliation;
- corrupt persistence;
- independent family circuit breakers;
- runtime integration and diagnostics;
- continued destructive-action rejection by `GameAdapter`;
- all prior Alpha.8–14 regression tests;
- generated browser bundle smoke;
- 2000-cycle transaction planning soak.

## Defaults

- runtime: `shadow`
- `productionReplacement=false`
- transaction live execution: OFF / unavailable
- Party transitions: OFF
- aura automation: OFF
- Party exploration: OFF
- Supervisor safe actions: OFF
- Brain gameplay authority: OFF
- compound/upgrade/exchange execution: unavailable

Alpha.15 is internally certified and merged before Alpha.16 Safe Travel begins. The first real 5–10 minute instrumented live canary is intentionally deferred until Alpha.17, when controlled Merchant execution and the monitoring/log GUI are present.

Freeze status: implementation complete; complete branch CI pending on the exact candidate head.
