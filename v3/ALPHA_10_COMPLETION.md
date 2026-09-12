# Alpha.10 Completion Gate — Shadow Strategic Brain Foundation

Version target: `3.0.0-alpha.10.0`

Alpha.10 introduces the first v3 strategic Brain layer, but keeps it strictly observational. The deterministic Alpha.8/Alpha.9 safety, combat and local-farming stack remains the sole gameplay authority.

## Phase goal

The Brain may encode safe strategic farm candidates, produce a recommendation, compare it with the deterministic planner, learn from that teacher signal, retain a bounded replay history and report measured quality. It may not execute or alter gameplay.

The phase establishes four migration primitives from v2 without importing v2 weights:

1. versioned deterministic feature encoding;
2. bounded experience replay;
3. a small bounded Student scorer with teacher distillation;
4. quality states including quarantine telemetry.

## Hard authority boundary

Alpha.10 deliberately does **not** give the Brain access to:

- `GameAdapter` or `StabilityGameAdapter`
- Scheduler task submission
- Farmer controller mutation
- local-farming plan mutation
- `attack`, `move`, `use_skill`, `buy`, `sell`, `compound`, `upgrade`, `smart_move` or any raw gameplay primitive

`brain.mode` is always `shadow`, even when the bot adapter is explicitly switched to `active`.

`actionAuthority`, `directActionAccess` and `executorBypassAllowed` remain `false`.

A Brain recommendation can disagree with the deterministic planner and still has no execution path. Alpha.9 continues to select and execute the actual local-farming plan.

## Candidate safety

The Alpha.10 runtime feeds the Brain only candidates already emitted by Alpha.9 `LocalFarmPlanner.spawnCandidates()`:

- current map only;
- known spawn metadata only;
- monster content disposition must be `APPROVED` or `LEGACY_ALLOWED`;
- quarantined/unknown content is excluded before Brain evaluation.

The Brain never grants content approval and cannot weaken Content Safety.

## Feature schema

Feature schema version: `1`.

All features are finite and bounded to `[0, 1]` before entering the Student scorer. The schema covers relative XP/gold rate, survival signal, confidence, travel efficiency, measured-evidence marker, HP/MP reserve and current-plan affinity.

Malformed numeric observations (`NaN`, `Infinity`, missing denominators) are sanitized instead of propagating into model state.

## Bounded learning and replay

- Replay is a fixed-capacity FIFO buffer.
- Default capacity is 256 records; configuration remains hard-clamped.
- Student weights are finite and hard-clamped.
- Teacher distillation uses a bounded learning rate and only compares the Brain recommendation with the deterministic planner's top candidate.
- No v2 weights are imported.
- No model persistence is activated in this phase.
- No stochastic exploration or autonomous canary traffic is activated.

## Quality / quarantine telemetry

Measured teacher agreement is tracked in a bounded rolling window.

States:

`WARMUP → HEALTHY / WATCH / QUARANTINED`

Quarantine in Alpha.10 is a trust/telemetry state only. Because the Brain already has zero action authority, quarantine never needs to revoke gameplay permissions.

`AIO_V3.status().brain` exposes the JSON-safe Brain status. `AIO_V3.brain.replay(limit)` exposes only the bounded in-memory replay records for diagnostics.

## Internal certification

The Alpha.10 suite covers at minimum:

- versioned feature schema;
- finite `[0,1]` feature bounds;
- malformed numeric fault injection;
- bounded replay capacity and drop accounting;
- explicit no-action/no-executor Brain API boundary;
- bounded teacher distillation and capped finite weights;
- quality-state accounting;
- empty-candidate behavior;
- unknown/unapproved spawn exclusion through Alpha.9 candidate safety;
- bot `active` mode cannot promote Brain authority;
- malicious/disagreeing Brain recommendation cannot replace the deterministic Alpha.9 plan;
- JSON-safe status/diagnostics;
- 2000-evaluation synthetic shadow soak with bounded replay and quality windows;
- all Alpha.8 and Alpha.9 regression tests;
- generated browser bundle smoke coverage.

## Still out of scope

Alpha.10 does not add:

- Brain-controlled gameplay;
- Champion/Challenger traffic;
- outcome/reward learning;
- persistent Brain weights;
- cross-map routing;
- pull control;
- full skill rotation;
- economy/Merchant actions;
- destructive inventory actions;
- server changes;
- aggressive exploration.

## Phase release gate

Alpha.10 becomes `CONFIRMED` only after all of the following are true:

1. version is `3.0.0-alpha.10.0`;
2. default mode remains `shadow`;
3. `productionReplacement` remains `false`;
4. all implementation changes are under `v3/**`; v2 `bot.js` is untouched;
5. complete CI is green;
6. browser bundle is generated and matches sources;
7. pull-request workflow is green on the **exact final PR head**;
8. the exact validated PR head is merged to `main`;
9. one combined safe FULL Alpha.10 Adventure Land certification test passes;
10. final real runtime is restored to `shadow`.

Only after the FULL phase gate is confirmed may the next autonomy phase begin.
