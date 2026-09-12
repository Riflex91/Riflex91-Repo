# Alpha.18 — Bank Capacity + Emergency Space Management Foundation

Release target: `3.0.0-alpha.18.0`

## Phase status

- Core Alpha.18 implementation: merged via PR #65.
- Combined live-confirmation runner: merged via PR #66.
- Combined production live gate: **PASS** on 2026-09-12.
- FULL confirmation: **FULL CONFIRMED**.
- Default runtime mode remains `shadow`.
- `productionReplacement=false` remains unchanged.
- Normal automatic destructive Economy autonomy remains disabled.
- Controlled bank expansion is default-off and requires exact `CONTROLLED_CANARY` acknowledgement.

## Verified official Adventure Land bank API

Verified against the current official `kaansoral/adventureland_mongodb` source at commit `ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4`:

- `open_bank_pack(pack, currency, timeout_ms)` is the official Promise API.
- It requires the character to be in a bank and on the bank floor owning the requested pack.
- It rejects already-unlocked packs and invalid currencies.
- Bank pack costs are available from the observed runtime `bank_packs` catalog; Alpha.18 does not hardcode pack names, pack counts, or prices.
- Calls through `open_bank_pack` use request correlation and the Promise resolves only after the bank-pack operation is acknowledged by the client event flow.

Alpha.18 therefore uses the official Promise API only and independently verifies the live before/after bank state before committing its local transaction.

## Dynamic Bank Capacity model

`BankCapacityManager` observes the live bank and live `bank_packs` catalog and builds a dynamic model for every observed pack:

- unlocked/locked state
- owning map/floor
- observed gold and shell cost
- capacity
- occupied/free slots
- compatible stack headroom
- conservative protected/reserved slots
- workspace availability
- safe same-pack consolidation opportunities

No pack names or pack counts are hardcoded.

## Space recovery order

For a blocked deposit Alpha.18 plans in this order:

1. compatible existing stack
2. existing free bank slot
3. safe stack consolidation
4. exactly one safe/financeable bank-pack expansion
5. `EMERGENCY_RECLAIM`
6. selective block of inventory-producing work only

A full bank does **not** create SELL permission.

## Bank expansion transaction safety

Bank expansion uses a dedicated transaction engine rather than the item-oriented Economy transaction engine.

Properties:

- unique transaction id
- per-pack dedupe
- persisted intent before raw action
- lease
- exact observed catalog-cost binding
- protected gold/resource reserve
- exact before/after capacity snapshots
- unlock verification
- restart reconciliation
- bounded preflight retry/backoff
- raw action attempt limit of one
- own failure window and circuit breaker
- timeout/fail-safe path

An uncertain raw action is never blindly retried after restart. Recovery first observes whether the pack became unlocked. If it did, the transaction reconciles as committed; otherwise it aborts and a future attempt requires a fresh transaction.

## Controlled expansion canary

`ControlledBankExpansionExecutor` is default-off.

Live execution requires:

- exact `CONTROLLED_CANARY` acknowledgement
- runtime `active`
- Merchant character
- alive
- no combat
- Supervisor `HEALTHY` or `WATCH`
- expansion circuit closed
- valid RESERVED transaction and lease
- correct bank floor
- pack still locked
- current observed cost exactly matching the persisted intent
- sufficient gold while preserving the protected reserve
- official `open_bank_pack()` API available

Alpha.18 controlled expansion is gold-only. Shell spending remains disabled for the controlled canary.

Commit requires the official Promise to complete and the requested pack to be observed as unlocked with positive capacity. Partial/ambiguous unlocks fail safe.

## EMERGENCY_RECLAIM

Reclaim is planning-only in Alpha.18 and never grants automatic SELL authority.

A reclaim candidate must already be positively classified `SELL` by the existing fail-closed Inventory Ledger and must independently pass the existing plain-stackable-material SELL safety policy.

Never eligible through this path:

- equipped/gear-like content
- progression/group reserves
- quest/event/exchange content
- unknown/drifted content
- locked/special items
- compound/upgrade candidates
- protected resources/minimum reserves
- anything without positive disposable classification

The planner selects the lowest loss/utility score and proposes exactly one unit. After one action a complete re-observation is mandatory before another decision. Bulk reclaim is forbidden.

## Selective work gate

If no safe space recovery action exists, Alpha.18 returns `BLOCK_INVENTORY_PRODUCING_WORK` with:

- `globalBotStop=false`
- combat/party/monitoring and other independent safe subsystems explicitly allowed to continue

The foundation exposes this bounded gate without adding destructive autonomy.

## Combined Alpha.18 live-confirmation gate

The live phase is intentionally a single combined Merchant run. It is started only by the explicit gate acknowledgement:

```js
AIO_V3.__runtime.runAlpha18CombinedLiveGate({
  ack: 'ALPHA18_FULL_LIVE_GATE',
  allowExpansionPurchase: true
});
```

Required starting context:

- current Alpha.18 browser bundle loaded
- Merchant character
- inside a bank with live bank state available
- alive and not in combat
- Supervisor `HEALTHY` or `WATCH`
- official `open_bank_pack()` API available

The gate first normalizes to a safe state: Farmer disabled, Controlled Merchant disabled, Controlled Travel disabled, Controlled Bank Expansion disabled, runtime `shadow`.

It then performs one combined validation:

1. precheck of Merchant/bank/API/Supervisor/capacity invariants
2. wrong-ack rejection probe for Controlled Bank Expansion
3. live Bank Capacity planning probe against the actual current bank state
4. at most one real controlled bank expansion, but only if the live planner itself selects `EXPAND_BANK_PACK`, the requested pack belongs to the current bank floor and `allowExpansionPurchase:true`
5. return to `shadow` and all controlled executors default-off
6. ten-minute passive observation window with repeated authority/circuit/Supervisor/capacity checks
7. final safe-state verification and one copyable result block

The gate **never fabricates a capacity crisis** merely to exercise expansion. If existing stack headroom, a free slot or safe consolidation resolves the live condition, expansion is recorded as `NOT_JUSTIFIED` and no purchase is attempted.

If a same-floor expansion is genuinely selected by the live planner, FULL-confirmation eligibility requires that the controlled transaction actually reaches verified `COMMITTED`. Choosing not to authorize that already-justified purchase leaves the phase unconfirmed.

A required expansion on another bank floor is not followed automatically: the live gate grants no Travel authority. That situation is recorded rather than bypassing Alpha.18's authority boundary.

`EMERGENCY_RECLAIM` remains planning-only throughout the live gate. The runner never executes a SELL action and never turns a full bank into SELL permission.

During the ten-minute passive observation window, confirmation is blocked by any of the following:

- runtime leaves `shadow`
- Farmer becomes enabled
- any Controlled Merchant/Travel/Bank Expansion executor becomes enabled
- Supervisor leaves `HEALTHY`/`WATCH`
- SELL/BANK/TRAVEL/Bank-Expansion circuit opens
- Bank Capacity gains action authority
- a controlled action attempt appears during the passive window
- an `error` EventLog entry appears during the passive window

Production live-gate duration is fixed at ten minutes. Short observation durations exist only behind the constructor-level test-mode hooks used by automated tests and are not confirmation-eligible.

At completion the runner prints/stores exactly one result block:

```text
=== ALPHA18 FULL LIVE GATE RESULT BEGIN ===
{ ... JSON result ... }
=== ALPHA18 FULL LIVE GATE RESULT END ===
```

The same text can be retrieved with:

```js
AIO_V3.__runtime.alpha18LiveGateResultText()
```

and is also stored as `AIO_V3_ALPHA18_LIVE_GATE_RESULT_TEXT` in the Adventure Land runtime root.

A live result is eligible for the later confirmation PR only when `pass=true`, `confirmationEligible=true`, the full observation duration is satisfied, no final violations remain, and any genuinely justified same-floor expansion has verified commit evidence.

## Production live confirmation evidence — 2026-09-12

The combined Alpha.18 production live gate completed successfully against release `3.0.0-alpha.18.0`.

Confirmation evidence:

- `pass=true`
- `confirmationEligible=true`
- `testMode=false`
- explicit gate acknowledgement was required and the wrong controlled-canary acknowledgement probe was rejected as expected
- forced capacity pressure was disabled
- `EMERGENCY_RECLAIM` execution authority remained disabled
- required observation window: `600000 ms`
- configured observation window: `600000 ms`
- `confirmationDurationSatisfied=true`
- passive samples: `121`
- precheck: PASS
- Supervisor remained within the allowed `WATCH` state; the only WATCH reason was `CONTENT_REVALIDATION_REQUIRED`
- live Bank Capacity observation retained `actionAuthority=false`
- live planner selected `DEPOSIT_FREE_SLOT` because safe free bank capacity already existed
- controlled expansion therefore correctly reported `NOT_JUSTIFIED`; no artificial capacity crisis was created and no bank-pack purchase was attempted
- `expansionCoverageSatisfied=true`
- passive-window violations: none
- passive-window error events: none
- unexpected Bank Expansion attempts: `0`
- unexpected Controlled Merchant attempts: `0`
- unexpected Controlled Travel attempts: `0`
- SELL, BANK, TRAVEL and Bank Expansion circuits remained closed
- final runtime mode: `shadow`
- final Farmer state: disabled
- final Controlled Merchant state: disabled
- final Controlled Travel state: disabled
- final Controlled Bank Expansion state: disabled
- final Bank Capacity action authority: disabled
- final violations: none
- confirmation blockers: none

The live bank had sufficient safe capacity, so a real expansion transaction was neither required nor permitted by the planner. This is the intended non-destructive confirmation path: the gate must not spend resources merely to manufacture expansion coverage.

This production result satisfies the Alpha.18 combined live-confirmation criteria. Alpha.18 is therefore **FULL CONFIRMED** once this documentation-only confirmation PR is exact-head CI-certified and merged.

## Internal tests

`alpha18-bank-capacity.test.js` covers:

- dynamic pack discovery
- compatible-stack priority
- free-slot priority
- stack consolidation priority
- sustainable capacity pressure
- blocked deposit expansion
- protected reserve / no funds
- positive-only emergency reclaim
- protected minimum reserve
- no safe reclaim candidate
- selective non-global blocking
- stale Ledger
- duplicate/dedupe
- stale/wrong cost
- persistence restart reconciliation
- no blind restart retry
- lease expiry
- circuit breaker
- controlled preflight rejection before raw action
- partial unlock failure
- successful controlled unlock verification
- 2500-cycle bounded soak

`alpha18-combined-live-gate.test.js` additionally covers:

- explicit gate acknowledgement requirement
- non-destructive `NOT_JUSTIFIED` path with existing safe capacity
- exactly one justified controlled expansion followed by default-off restoration
- justified same-floor expansion left unexecuted remains a confirmation blocker across returned, stored and printable result surfaces
- passive-window error-event detection and fail-closed result

Full repository tests, browser bundle smoke, generated bundle verification and diff check are required on the exact final confirmation PR head before merge.

## Confirmation result

The production combined live gate passed and the resulting documentation-only confirmation PR records the verified evidence. After exact-head CI certification and merge, Alpha.18 is **FULL CONFIRMED**.
