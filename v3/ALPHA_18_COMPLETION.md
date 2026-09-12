# Alpha.18 — Bank Capacity + Emergency Space Management Foundation

Release target: `3.0.0-alpha.18.0`

## Phase status

- Implementation: in progress until the exact final PR head passes CI and is merged.
- FULL confirmation: **NOT YET CONFIRMED**.
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

Full repository tests, browser bundle smoke, generated bundle verification and diff check are required on the exact final PR head before merge.

## Live phase still required after merge

Alpha.18 must **not** be called FULL CONFIRMED after implementation CI alone. A combined live phase is still required before a later confirmation PR may mark the phase FULL CONFIRMED.
