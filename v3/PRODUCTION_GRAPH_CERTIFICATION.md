# V3 Production Graph Certification

## Purpose

This block certifies the autonomous gear-production graph without adding new gameplay authority.

The certification consists of two independent, actionless components:

1. **Production Acquisition Coverage Audit**
2. **Production Graph E2E Soak Auditor**

The combined certification gate is diagnostic only. It does not enable, disable or bypass live production authority.

## Acquisition Coverage

Runtime entry point:

`runtime.auditProductionCoverage()`

The audit walks every craftable gear output from `G.craft` whose item metadata maps to a real equipment slot. Recipe inputs are resolved recursively through the same source families used by live production.

Classifications:

- `FULLY_RESOLVED`
- `EVENT_CURRENTLY_INACTIVE`
- `EVENT_SOURCE_UNVERIFIED`
- `QUEST_DESTINATION_UNVERIFIED`
- `MUTATION_UNSUPPORTED`
- `NO_SAFE_SOURCE`
- `CONTENT_DRIFT`
- `MISSING_GAME_DATA`
- `RECIPE_CYCLE`
- `MAX_DEPTH`

`EVENT_CURRENTLY_INACTIVE` is treated as temporarily deferred coverage rather than a structural gap. Unknown event identity, unknown quest destination, unsupported mutation, content drift and missing data remain fail-closed.

Farm paths retain the V3 probabilistic policy:

- `expectedHours` is telemetry;
- P50 is reported;
- **P90 is the scheduling/certification quantile**;
- paths above the preferred 12-hour P90 threshold remain eligible but deprioritized.

## E2E Soak Auditor

Runtime entry point:

`runtime.observeProductionSoakSample(sample)`

The auditor has `actionAuthority:false`. It consumes observations only.

Core invariants:

- no gameplay action while restart reconciliation is pending;
- no duplicate irreversible commit for the same idempotency/operation key;
- irreversible BUY/CRAFT/EXCHANGE/UPGRADE/COMPOUND/TRANSFER observations require a key;
- all Farmers remain on one Production objective;
- no Farmer combat after `MATERIAL_READY_FOR_HANDOFF`;
- handoff cannot begin while a farm requirement remains;
- inactive events cannot execute;
- Production farm decisions must use `decisionQuantile: P90`;
- protected transfers require explicit authorization;
- terminal completion requires verified recipient settlement;
- no Production task, material objective, exchange demand or mutation demand may remain after completion.

The violation journal and irreversible-key dedupe window are both bounded for 24/7 operation.

## Recipient settlement

A final Craft commit no longer completes the Production Intent immediately.

The state becomes:

`OUTPUT_READY_FOR_DELIVERY`

The Merchant production cycle then holds the target stable until the intended recipient is visible in trusted runtime/registry state with the produced item either:

- in recipient inventory, or
- equipped in the intended slot.

Only then is the intent archived as:

`COMPLETED / FINAL_PRODUCTION_RECIPIENT_VERIFIED`

At settlement, remaining Production task/objective/mutation/exchange state is cleared/released before another Production target may start.

This prevents a final Merchant-side craft delta from being mistaken for end-to-end gear delivery.

## Certification gate

Runtime entry point:

`runtime.productionCertificationGate()`

Default requirements:

- acquisition coverage has no structural gaps;
- temporarily inactive known events are allowed as deferred coverage;
- soak has no invariant violation;
- at least **5000** soak samples have been observed.

The gate returns `ready:true` only if all requirements pass.

It remains diagnostic:

`actionAuthority:false`

## Synthetic certification

Regression coverage includes:

- mixed BUY / FARM / QUEST / EVENT / leveled-material coverage;
- missing G data;
- unsupported leveled mutation;
- content drift;
- known inactive event deferral;
- 5000-sample clean E2E soak;
- restart-pending action rejection;
- duplicate irreversible action detection;
- Farmer split detection;
- handoff overfarming/combat detection;
- inactive-event execution detection;
- non-P90 scheduling detection;
- protected-transfer detection;
- recipient-verification requirement;
- orphan task/objective/demand detection;
- bounded soak/dedupe state;
- final recipient settlement before a new Production plan.

## Controlled real Production soak

The Merchant Production controller now feeds the same E2E auditor automatically from trusted live Runtime state. No second certification definition is introduced.

Runtime entry point:

`runtime.productionRealSoakStatus()`

The observer is diagnostic only:

- `actionAuthority:false`;
- it does not enable or execute gameplay actions;
- it does not change the existing log format or add required log lines;
- it observes only when Production-relevant Runtime state exists;
- the first relevant live observation also runs the Production Acquisition Coverage Audit;
- committed Merchant Production operations are attached once by their persisted operation ID;
- restart/recovery, handoff, event activity, P90 farm decisions, recipient settlement and post-completion cleanup are projected into the existing soak schema when trustworthy Runtime evidence is available.

The soak auditor persists a bounded checkpoint containing the sample count, violation journal, active target identity and bounded irreversible-operation dedupe window. This keeps the certification meaningful across Browser/Bot restarts without allowing unbounded storage growth. Checkpoint writes are throttled and forced for important state changes such as newly observed irreversible commits or invariant violations.

A separate persisted observer cursor prevents the same already-observed committed operation from being re-submitted as a new real action after restart.

Real-soak evidence should be evaluated together:

- `runtime.auditProductionCoverage()`;
- `runtime.productionRealSoakStatus()`;
- `runtime.productionCertificationGate()`;
- the normal operational logs.

The normal logs remain unchanged. Log handoffs should still be reviewed broadly for all detectable runtime faults, not only Production certification failures.

Fresh-main sync note: the real-soak observer remains source-compatible with parallel V3 merchant-autonomy changes; the generated runtime bundle must always be rebuilt from the merged source state before release.
