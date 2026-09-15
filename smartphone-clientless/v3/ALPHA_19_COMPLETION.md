# Alpha.19 — Merchant Economy Execution + Emergency Recovery

Release target: `3.0.0-alpha.19.0`

## Phase status

- Core implementation: **MERGED** via PR #68.
- Core merge commit: `5a1274d4f37703abc90c8c1a88e0efbf794e46c1`.
- Exact certified core PR head: `8d73ed95f26433edcf759e9fef6c788b7a107ee3`.
- Live-gate preparation: **MERGED** via PR #69.
- Live-gate preparation merge commit: `13d6e5d66b497d9bf00d2de2a0904acf285c6e98`.
- Exact certified live-gate preparation PR head: `21bd066494045925877c5683e0281047abee5121`.
- FULL production confirmation evidence: **PASSED / CONFIRMATION-ELIGIBLE** on 2026-09-12.
- Documentation evidence: `v3/ALPHA_19_LIVE_CONFIRMATION.md`.
- Phase status: **FULL CONFIRMED once this documentation-only confirmation PR is exact-head certified and merged**.
- Default runtime remains `shadow`.
- `productionReplacement=false` remains unchanged.
- Controlled Alpha.19 execution is default-off and requires exact `ALPHA19_SPACE_RECOVERY` acknowledgement.
- Paid expansion and Emergency Reclaim additionally require their own explicit per-enable budgets.
- No broad Travel, Craft, Upgrade, Compound, Exchange or Brain gameplay authority is introduced.

## Goal

Alpha.19 turns the Alpha.18 Bank Capacity planner into a bounded Merchant space-recovery execution path while retaining fail-closed authority boundaries.

The recovery preference remains:

1. deposit into an existing compatible stack
2. deposit into an existing free bank slot
3. consolidate a safe bank stack pair
4. open exactly one safe and financeable bank pack on the current bank floor
5. reclaim exactly one positively disposable inventory unit as the last destructive fallback
6. block only inventory-producing work when no executable safe recovery exists

The planner never turns a full bank into general SELL authority.

## Restart-safe parent operation journal

`MerchantSpaceRecoveryJournal` persists the complete parent operation before any raw action.

States:

- `RESERVED`
- `EXECUTING`
- `REOBSERVING`
- `RECOVERING`
- `COMMITTED`
- `BLOCKED`
- `ABORTED`
- `FAILED_SAFE`

Properties:

- per-character/item dedupe
- bounded lease
- persisted original request and selected plan
- persisted child evidence and raw-action count
- independent failure budget/circuit breaker
- bounded history capacity
- nonterminal operations load as `RECOVERING`
- restart reconciliation always aborts the old parent operation and requires fresh observation/planning; it never blindly repeats an uncertain raw action

A child transaction that has its own stronger reconciliation rules, such as bank expansion, still keeps those rules independently.

## Controlled bank consolidation

Alpha.19 deliberately does **not** treat `bank_swap()` as a stack merge because the official interface only guarantees moving/swapping positions.

Instead, a safe consolidation is implemented as a verified two-step operation:

1. verify source/target identity, level, live quantities, stack limit, bank floor and a free inventory workspace
2. `bank_retrieve(pack, sourceSlot, workspaceSlot)` exactly once
3. verify the exact source stack moved into the selected inventory workspace and total identity quantity is conserved
4. `bank_store(workspaceSlot, pack, targetSlot)` exactly once
5. verify source bank slot is free, destination quantity equals the exact combined quantity, workspace is free again and total identity quantity is conserved

If no inventory workspace exists, consolidation performs zero raw calls. Alpha.19 skips that non-executable recovery level rather than guessing or using an undocumented merge assumption.

If the first raw call succeeds but the intermediate state cannot be confirmed, the second call is not attempted. This intentionally fails safe; a later fresh observation must reconcile the live state.

## Controlled bank deposit

Existing `ControlledMerchantExecutor` remains the only live executor for ordinary `BANK` transactions.

Alpha.19 creates a normal persisted `BANK` transaction from the Inventory Ledger and lets the official `bank_store()` API choose the compatible stack/free slot. Commit still requires the existing server acknowledgement and/or verified inventory/bank identity balance rules.

The source item must therefore still be positively classified `BANK`, fresh in the Ledger, identity-stable and a complete live stack.

## Controlled expansion

Alpha.19 reuses the dedicated Alpha.18 bank-expansion transaction/executor.

Expansion is eligible only when:

- the live planner selects `EXPAND_BANK_PACK`
- the pack is still locked and observed at the exact persisted cost
- the current Merchant is already on the owning bank floor
- the gold reserve remains protected
- the expansion circuit is closed
- the official `open_bank_pack()` call and post-unlock verification pass
- the Alpha.19 parent enable explicitly sets `allowExpansionPurchase:true`

The ordinary `ALPHA19_SPACE_RECOVERY` acknowledgement alone cannot authorize a gold-spending expansion.

Alpha.19 grants no Travel authority. An expansion that requires another bank floor is not followed automatically. The recovery operation falls through only to independently safe lower-priority recovery or selective blocking.

Shell-funded expansion remains disabled.

## Emergency reclaim — hard destructive boundary

Emergency reclaim becomes executable for the first time in Alpha.19, but only through the existing controlled SELL transaction path and only under a stricter parent boundary.

Requirements immediately before SELL:

- current Bank Capacity decision still resolves to the same reclaim candidate after a fresh re-observation
- Inventory Ledger is fresh
- candidate remains positively classified `SELL`
- candidate identity/index/level is unchanged
- item metadata remains known
- existing low-risk SELL safety has no blockers
- content does not require revalidation
- protected minimum reserve remains preserved
- requested quantity is exactly `1`
- controlled SELL executor is explicitly scoped to SELL only
- the Alpha.19 parent enable explicitly sets `allowEmergencyReclaim:true`

The ordinary `ALPHA19_SPACE_RECOVERY` acknowledgement alone cannot authorize SELL.

Hard limits:

- maximum reclaim per parent operation: **one unit**
- bulk emergency reclaim: **forbidden**
- after the one-unit SELL, complete Bank Capacity re-observation is mandatory
- the parent operation then terminates even if the new plan would request another reclaim
- any second reclaim requires a completely new operation, fresh Ledger state and fresh capacity planning

This prevents a full bank from cascading into an automatic liquidation loop.

## Raw-action budget

A parent Alpha.19 operation may perform at most three raw gameplay calls.

This supports the longest intended safe chain:

- retrieve one bank stack for consolidation
- store that stack into its verified destination
- deposit the originally blocked inventory stack

Other paths are shorter:

- direct bank deposit: one raw call
- bank expansion + deposit: at most two raw calls
- emergency reclaim: exactly one raw SELL call

The parent journal records every child raw-action count. Exceeding the budget fails safe.

## Authority containment

Alpha.19 orchestrates existing controlled executors; it does not gain unrestricted raw gameplay access.

During one explicitly enabled operation it may temporarily scope:

- Controlled Merchant to `BANK` only, or
- Controlled Merchant to `SELL` only for the one-unit reclaim when the separate reclaim budget is true, or
- Controlled Bank Expansion for one same-floor expansion when the separate purchase budget is true, or
- Controlled Bank Consolidation for the verified retrieve/store pair

All child executors are disabled in `finally` paths.

The operation refuses to start if a child executor is already unexpectedly enabled.

No Alpha.19 path grants:

- Travel authority
- shell-spend authority
- Craft authority
- Upgrade authority
- Compound authority
- Exchange authority
- general SELL authority
- direct Strategic Brain gameplay authority

## Selective blocking

When no executable safe recovery exists, the parent result is `BLOCKED` with `globalBotStop=false`.

Combat, party, monitoring and other independent non-inventory work may continue according to their own safety policies.

## Internal test gate

Alpha.19 automated coverage includes:

- default-off and wrong-ack rejection
- separate expansion-purchase and Emergency-Reclaim budgets default-off
- restart recovery with no blind retry
- consolidation no-workspace fail-closed behavior
- exact retrieve/store consolidation and quantity conservation
- exactly-one-unit emergency reclaim
- mandatory post-reclaim re-observation
- fresh-plan drift blocking before SELL
- selective non-global blocking
- parent circuit breaker
- 2500-cycle bounded journal soak and active-operation dedupe
- combined live-gate source selection, real BANK canary, zero-action unauthorized paths and passive error detection

The exact final live-gate preparation PR head passed the complete repository test suite, generated browser bundle verification, browser bundle smoke and diff check before merge.

## Combined production live confirmation gate

The Alpha.19 combined live gate is deliberately evidence-driven. It never fabricates inventory pressure, fills the bank artificially, creates disposable items, or forces a SELL/expansion merely to obtain coverage.

Required gate acknowledgement:

`ALPHA19_FULL_LIVE_GATE`

Production observation window is fixed at **10 minutes**. Test-mode shortened windows are never confirmation-eligible.

The gate:

1. normalizes runtime to `shadow`, Farmer off and every controlled child executor off
2. verifies Merchant/alive/bank/no-combat/Supervisor/circuit/default-off invariants
3. proves a wrong Alpha.19 parent acknowledgement cannot enable authority
4. refreshes Inventory Ledger and chooses only a real, fresh item already classified `BANK`
5. reserves exactly one Alpha.19 parent recovery operation from that real source
6. optionally executes that one operation only when `allowControlledRecovery:true`
7. requires separate `allowExpansionPurchase:true` before a justified same-floor bank purchase
8. requires separate `allowEmergencyReclaim:true` before a justified one-unit SELL
9. never grants Travel authority for a cross-floor expansion
10. returns to `shadow`/default-off before the 10-minute passive window
11. fails closed on error events, opened circuits, authority leakage, unexpected action attempts or safety invariant violations

Recommended production invocation:

```js
AIO_V3.__runtime.runAlpha19CombinedLiveGate({
  ack: "ALPHA19_FULL_LIVE_GATE",
  allowControlledRecovery: true,
  allowExpansionPurchase: true,
  allowEmergencyReclaim: false
});
```

`allowExpansionPurchase:true` does not force a purchase. It only permits one if the real planner independently justifies a safe same-floor expansion and all preflight rules still pass.

`allowEmergencyReclaim:false` means a real situation that genuinely requires reclaim remains safe but does not authorize any SELL.

A preferred low-risk live canary is a real item that the operator already intends to bank. It must first be positively classified `BANK` through the existing Inventory Action Policy. The gate never changes that policy itself.

## Production confirmation evidence — 2026-09-12

The real production gate completed successfully for `3.0.0-alpha.19.0`.

Summary:

- `pass=true`
- `confirmationEligible=true`
- `confirmationBlockers=[]`
- `testMode=false`
- real fresh `BANK` source selected from the Inventory Ledger
- live plan: `DEPOSIT_FREE_SLOT`
- recovery canary: `COMMITTED`
- recovery coverage satisfied: true
- exactly one raw BANK action
- zero Emergency Reclaim actions
- two recorded reobservations
- no invariant failures
- full `600000 ms` passive observation satisfied
- 121 passive samples
- no violations
- no error events
- no unexpected parent, consolidation, Merchant, expansion or Travel action deltas
- all monitored circuits remained closed
- final mode `shadow`
- Farmer and every controlled executor disabled in the final state
- final Bank Capacity `actionAuthority=false`
- final safety violations: none

The complete reviewed evidence summary is recorded in `v3/ALPHA_19_LIVE_CONFIRMATION.md`.

A small manual Merchant movement during the passive window did not invalidate the production run. The Merchant remained in a valid bank context and the gate itself completed the required observation with no violations, errors, circuit openings, authority leakage or unexpected action attempts.

## Final confirmation requirement

The production behavior is now confirmed by a clean, confirmation-eligible live result. Alpha.19 becomes **FULL CONFIRMED** after this documentation-only confirmation PR is certified against its exact final head and merged into `main`.
