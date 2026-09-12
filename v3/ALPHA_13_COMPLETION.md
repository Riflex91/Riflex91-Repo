# Alpha.13 Completion Gate — Global Supervisor + Content Drift Foundation

Version target: `3.0.0-alpha.13.0`

Alpha.13 intentionally combines the next two tightly coupled roadmap foundations into one certification unit: the Global Supervisor / Recovery foundation and the persistent Content Drift / Novelty foundation. The separate planned Alpha.14 drift-only phase is therefore absorbed into Alpha.13 rather than opened in parallel. This preserves the project rule of one freeze, one exact PR-head CI gate and one post-merge FULL test per formal phase.

The default remains safe: runtime `shadow`, `productionReplacement=false`, Party transitions OFF, aura automation OFF, Party exploration OFF, Brain shadow-only, Global Supervisor safe actions OFF, Content Drift observation-first.

## Global Supervisor

The supervisor aggregates bounded health signals from:

- progress watchdog;
- combat/movement command circuit state;
- persistence failure/circuit state;
- Party transition state;
- Brain quality/quarantine state;
- Content Drift revalidation pressure;
- explicit per-subsystem quarantine.

Health states are:

`HEALTHY -> WATCH -> DEGRADED -> SAFE_MODE / RECOVERY -> QUARANTINE`

The progress watchdog counts only material progress such as XP gain, Gold gain, map change or bounded movement distance. Repeated target/state churn is not treated as real progress.

Brain or Content quarantine is isolated and cannot by itself force unrelated deterministic combat into global quarantine. Party `FAILED_SAFE` is isolated as a Party quarantine and only degrades the global state. Critical progress/combat/persistence failures may escalate globally.

## Recovery boundary

Automatic supervisor recovery is **default OFF**.

When explicitly enabled, its authority is restricted to safety reduction only:

- disable Party transitions;
- disable Paladin aura automation;
- disable Party exploration;
- disable Farmer;
- return runtime to `shadow`.

The supervisor has no raw movement/combat/inventory/character-lifecycle action path. Safe fallback attempts have cooldowns, a rolling recovery budget and telemetry. Exhausted recovery budgets suppress further loops rather than retrying forever.

## Content Drift / Novelty foundation

`ContentDriftMonitor` maintains deterministic, bounded fingerprints for Adventure Land metadata categories:

- monsters;
- maps, including spawn/door metadata inside map definitions;
- NPC catalog;
- items;
- skills;
- events.

Large catalogs are scanned incrementally with a hard per-scan budget. Current map and visible monster definitions receive priority observations.

The first pass builds a baseline and does not misclassify all pre-existing game content as novel. After a category baseline is complete:

- a new record becomes `QUARANTINED` and emits `CONTENT_NOVELTY_DETECTED`;
- a changed fingerprint becomes `QUARANTINED` and emits `CONTENT_DRIFT_DETECTED`;
- explicit revalidation moves the record back to `OBSERVED`;
- another later change re-quarantines it.

Records are schema-versioned, capacity-bounded, JSON-safe and persist across restarts. Corrupt/unsupported persisted data fails closed to an empty baseline rebuild rather than being trusted.

## Gameplay fail-closed coupling

For monster metadata specifically, a post-baseline novelty or fingerprint drift is forwarded to the already-authoritative CombatRisk content-safety gate. The monster is reclassified `QUARANTINED` before normal targeting can trust the changed definition.

The Content Drift monitor itself has `actionAuthority=false` and no direct gameplay action access. It only supplies observations and revalidation requirements; the deterministic content-safety layer remains authoritative.

## Public diagnostics

Alpha.13 adds read/status APIs:

- `AIO_V3.supervisor.status()`;
- `AIO_V3.supervisor.setSafeActionsEnabled(bool)`;
- `AIO_V3.supervisor.quarantineSubsystem(name, reason)`;
- `AIO_V3.supervisor.clearSubsystemQuarantine(name)`;
- `AIO_V3.contentDrift.status()`;
- `AIO_V3.contentDrift.records(limit)`;
- `AIO_V3.contentDrift.requiresRevalidation(category, id)`;
- `AIO_V3.contentDrift.markRevalidated(category, id)`;
- `AIO_V3.contentDrift.save()`.

All status and diagnostics remain JSON-safe and headless-compatible.

## Internal certification

The Alpha.13 suite must cover at minimum:

- watchdog HEALTHY/WATCH/DEGRADED/SAFE_MODE/QUARANTINE escalation;
- material-progress reset;
- subsystem isolation;
- explicit manual quarantine and recovery;
- safe-action default OFF;
- safety-reduction-only fallback actions;
- cooldown and recovery-budget loop suppression;
- deterministic canonical fingerprints independent of object key order;
- non-finite/function sanitization;
- baseline construction without false novelty;
- new post-baseline content quarantine;
- changed known-content quarantine;
- explicit revalidation and later re-quarantine;
- bounded incremental large-catalog scanning;
- persistence restore and corrupt-data fail-closed behavior;
- monster-definition drift integration with CombatRisk quarantine;
- Alpha.13 runtime default-authority boundary;
- generated browser bundle smoke checks;
- all prior Alpha.8/9/10/11/12 regression tests;
- 2000-cycle combined supervisor/content-drift soak.

## Explicitly still forbidden/default-off

Alpha.13 does not enable:

- supervisor safe actions by default;
- automatic unknown-content exploration;
- automatic content approval after repeated observation;
- cross-map Party routing or `smart_move` Party assembly;
- server switching;
- Brain gameplay authority;
- destructive Merchant/economy actions;
- arbitrary remote JavaScript execution.

## Release gate

Alpha.13 becomes `CONFIRMED` only after:

1. version is exactly `3.0.0-alpha.13.0`;
2. default mode remains `shadow`;
3. `productionReplacement=false`;
4. all changes stay under `v3/**` and v2 is untouched;
5. supervisor safe actions default OFF;
6. Content Drift remains observation-first/no direct action authority;
7. all previous Party/Brain/Combat safety defaults remain unchanged;
8. all unit/integration/fault/synthetic/regression/soak tests pass;
9. generated bundle matches source;
10. branch CI is green;
11. PR workflow is green on the exact final PR head;
12. that exact head is merged to `main`;
13. one combined safe Adventure Land Alpha.13 FULL certification passes after merge;
14. final runtime is restored to `shadow` with supervisor live safe actions and all Party live controls disabled.
