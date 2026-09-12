# Alpha.17 — Controlled Merchant/Travel Canary + Session Monitor

Release target: `3.0.0-alpha.17.0`

## Phase status

- Implementation: merged and exact-head certified.
- FULL confirmation: **CONFIRMED pending merge of this documentation-only confirmation PR**.
- Default runtime mode remains `shadow`.
- `productionReplacement=false` remains unchanged.
- No live canary authority is enabled by default.

## Scope

Alpha.17 introduced the first explicitly opt-in controlled live boundary for two previously shadow/synthetic foundations while keeping every higher-risk family outside scope.

### Controlled Merchant executor

- SELL and BANK only.
- Exact operator acknowledgement `CONTROLLED_CANARY` is required before enabling.
- Runtime must already be `active` and the controlled character must be a living Merchant.
- Supervisor must be HEALTHY or WATCH.
- Combat, stale Ledger state, changed item identity/quantity/disposition, expired transaction leases, Content Drift revalidation, open action-family circuits and missing game APIs fail closed.
- SELL/BANK use the official Promise APIs only.
- Transaction state is persisted before the raw action and again before verification.
- Failure or mismatch enters `FAILED_SAFE` and feeds the per-family Economy circuit breaker.
- COMPOUND, UPGRADE, EXCHANGE, TRADE and SEND_ITEM remain outside live authority.

### Controlled Travel executor

- Uses only a previously validated Safe Travel plan.
- Exact operator acknowledgement `CONTROLLED_CANARY` is required before enabling.
- Merchant/alive/no-combat/Supervisor gates apply.
- Plan lease, Travel circuit, known-map/content-drift contract and server-change prohibition are rechecked before execution.
- Uses official `smart_move()` only; timeout aborts with `stop("smart")`.
- Unknown-map travel and server changes remain forbidden.

### Session monitor and debug GUI

- Session Monitor exports current runtime state plus the complete retained redacted EventLog.
- GUI remains read-only and exposes no gameplay authority.
- `Log kopieren` supports Clipboard API, legacy copy fallback and manual selected-text fallback.
- Headless operation remains supported.

## Internal certification

The final SELL fail-closed hotfix was frozen at exact PR head:

`6e41fe76430f8773cddde23a4873ebc30acbac8b`

Validation on that exact head:

- complete suite: **273/273 PASS**
- browser bundle smoke: PASS
- PR generated-browser-bundle verification: PASS
- diff check: PASS
- no v2 / `bot.js` changes

It was merged to `main` as:

- merge commit: `1377d1d3d73bcd7da330df9ad5147a8bc395a869`
- tree: `ce7e072117e6677b06ca1265fbdd05c8e3de9fd6`
- parent 1: `b8bece5d09a1e0999963b84454004fbcff2750b4`
- parent 2 / exact validated PR head: `6e41fe76430f8773cddde23a4873ebc30acbac8b`

## Combined live phase evidence

### Precheck / monitor UI

- operator precheck: PASS
- monitor GUI visibility/drag/resize/copy workflow: PASS
- crowded-bank registry stabilization retained only the Merchant self entry and ignored foreign visible entities without churn

### Controlled Travel

- real position-changing controlled travel canary: PASS
- observed return/arrival: PASS
- authority restored to default-off after the canary

### Inventory index boundary

Live boundary diagnostic:

- `character.isize = 42`
- `character.items.length = 43`
- one raw client-side item existed beyond server-authoritative valid range `0..41`
- Ledger exposed **0** entries beyond `isize`
- Controlled Merchant inventory-index guard active

This confirmed the BANK-3 root cause and the `character.isize` fix live.

### Controlled BANK

Fresh BANK-4 canary: PASS.

Observed result:

- `executed: true`
- `committed: true`
- `reason: SERVER_ACK_COMMIT`
- server response included `success:true`, `place:"bank"`, `bank_action:"store"`
- `commitBasis: SERVER_ACK`
- `serverAcknowledged: true`
- `localObservationConfirmed: true`
- inventory identity quantity changed exactly `8 -> 7`
- bank identity quantity changed exactly `0 -> 1`

Earlier BANK-1/BANK-2/BANK-3 failures were never retried or reused; each produced a separate root-cause fix before the next fresh transaction.

### SELL safety

A positive irreversible SELL canary was deliberately **not forced** because the live Merchant inventory contained no genuinely low-risk disposable candidate.

The first negative SELL gate exposed a real regression: `shoes` could be classified as SELL before execution. The negative test aborted before transaction execution, so no `sell()` call occurred.

The resulting fail-closed hardening added:

- plain stackable `material`-only positive eligibility
- raw live-item level/lock/special protection
- dual-frame metadata consensus (`root.G.items` and `parent.G.items`)
- gear/quest/exchange/event/cash/soulbound/compound/upgrade structural protection
- independent final Controlled Merchant SELL preflight immediately before the raw Adventure Land API

Post-merge negative live test: PASS.

Real `shoes` entries remained protected (`UNDECIDED` or `RESERVE_PROGRESSION`), with no SELL disposition, no transaction attempts and no `sell()` calls.

### 10-minute monitored observation

Observation window:

- start: `2026-09-12T13:55:28.469Z`
- finish: `2026-09-12T14:05:29.670Z`
- duration: ~601 seconds

Result: **PASS**.

Observed during the window:

- runtime remained `shadow`
- Controlled Merchant remained disabled
- Controlled Travel remained disabled
- Farmer remained disabled
- no economy transaction active or recovering
- every Economy circuit closed
- Travel circuit closed
- Controlled Merchant: 0 attempts, 0 commits, 0 rejects, 0 failed-safe, 0 timeouts
- Controlled Travel: 0 attempts, 0 completes, 0 rejects, 0 failed-safe, 0 timeouts, 0 aborts
- retained EventLog: 571 events
- error-severity events: **0**
- telemetry dropped events: 0
- telemetry capture errors: 0
- persistence load/save errors: 0
- persistence save circuit: closed
- background execution drift events: 0
- background execution arm failures: 0
- scheduler stable
- Inventory Ledger: 30/42 occupied, 12 free slots, 3 workspace slots available
- invalid inventory indexes: 0
- out-of-range Ledger entries: 0
- registry: only `My_Merchant`, no member churn

The supervisor remained `WATCH`, never DEGRADED/safe-mode/quarantined, because Content Drift correctly quarantined five fingerprint changes under `CONTENT_REVALIDATION_REQUIRED`:

- `maps:bank`
- `maps:test`
- `maps:uhills`
- `npcs:newupgrade`
- `npcs:basics`

No additional Content Drift appeared during the 10-minute observation window. This is accepted fail-closed Content Drift behavior rather than an Alpha.17 runtime failure.

## Completion judgement

Alpha.17 satisfies its intended bounded live-control and monitoring objectives:

- Controlled Safe Travel verified live
- controlled BANK verified end-to-end by server ACK and local identity balance
- authoritative inventory bounds verified live
- SELL proven fail-closed for protected/ambiguous real inventory
- no destructive SELL forced without a clearly disposable candidate
- 10-minute shadow observation completed without unexpected authority, errors, open circuits, persistence failure or registry churn
- safe/default-off boundaries remained intact

After this documentation-only confirmation PR passes exact-head CI and is merged, Alpha.17 is **FULL CONFIRMED**.

## Next Merchant priority — Bank Capacity + Emergency Space Management

Bank/storage is a first-class safety subsystem for the next economy phase.

Required design goals:

1. Discover and model all actually observed/unlocked bank packs dynamically; never assume pack count from hard-coded names.
2. Track per-pack capacity, free slots, existing compatible stacks and protected workspace requirements.
3. Consolidate compatible stacks and use existing packs before buying more capacity.
4. Observe the next bank expansion cost and unlock mechanism instead of hard-coding it.
5. Buy one additional bank chest only when sustained capacity pressure or a concrete blocked deposit justifies it and protected gold/resource reserves remain after purchase.
6. Treat expansion as a restart-safe transaction with preflight, lease, dedupe, cost verification, new-capacity verification, timeout, fail-safe and circuit breaker.
7. Never sell an item merely because storage is full while safe capacity expansion is still possible.
8. If expansion is not affordable/possible, enter a bounded `EMERGENCY_RECLAIM` mode rather than stopping the entire bot.
9. Emergency reclaim may sacrifice only positively classified disposable items, choosing the least harmful candidate by replacement cost, rarity, acquisition difficulty, quantity surplus, progression value and protected minimum reserves.
10. Progression gear, equipped/reserved gear, quest/event/exchange content, unknown/drifted content, locked/special items and other protected reservations remain non-sacrificable.
11. Reclaim exactly one minimal action/unit at a time, re-observe capacity, then decide again; never bulk-sell blindly.
12. If no safe sacrifice candidate exists, block only inventory/loot-producing work that requires space; do not stop unrelated safe bot subsystems.
13. Add synthetic/fault/restart coverage and a 2000+ cycle soak before any controlled live bank-expansion or emergency-reclaim canary.
