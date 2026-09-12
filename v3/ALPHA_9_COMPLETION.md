# Alpha.9 Completion — Autonomous Local Farming & Strategic Brain Foundation

Freeze version: `3.0.0-alpha.9.10`

Alpha.9 builds directly on the fully confirmed Alpha.8 Combat & Stability Foundation. This file is the canonical phase completion contract. The phase is not externally `CONFIRMED` until the final merged build passes the combined Adventure Land FULL Alpha.9 validation.

## Delivered phase capabilities

### Autonomous same-map farming

- Deterministic same-map spawn catalog from tolerant Adventure Land map metadata parsing.
- Quarantined/unknown content never enters active spawn navigation.
- Explicitly `APPROVED` monsters may become spawn goals immediately.
- `LEGACY_ALLOWED` monsters require measured farm confidence (`>= 0.10` default) before active spawn travel; unlearned legacy spawns are shadow-preview-only.
- Local goal selection uses the deterministic Farm Planner with bounded goal hysteresis, arrival hold and short local steps.
- No `smart_move`, cross-map routing, server changes or unknown-content exploration.
- Local navigation respects Alpha.8 movement outcome verification, pending-move coalescing and movement circuit breakers.
- Runtime only plans local navigation. Actual `move()` execution remains scheduler/Farmer-owned and is revalidated immediately before execution.
- Newly visible safe combat, recovery, emergency retreat, death, target acquisition and movement circuit state all outrank/cancel queued local farming movement.

### Progress watchdog

- Meaningful XP/gold/map progress resets the watchdog.
- Bounded states: `HEALTHY`, `WATCH`, `DEGRADED`, `COOLDOWN`.
- Repeated no-progress requests deterministic reassessment instead of retry churn.
- Reassessment never interrupts active combat/recovery/emergency handling.

### Strategic Brain interface

Fixed strategic actions:

- `continue`
- `change_farm_target`
- `replan_merchant`
- `explore`
- `wait`

The Brain is strategic only and has no reference to the gameplay adapter. `rawGameplayAccess` is false by contract.

Action masks keep `replan_merchant` and `explore` disabled in Alpha.9. `change_farm_target` is available only while safely idle with at least two deterministic safe local candidates. `wait` is bounded and available only while safely idle. Emergency handling masks every action except `continue`.

### Feature encoder

- Exactly 32 normalized, finite strategic features.
- Stable feature names and order.
- Values are clamped to `[0, 1]`.
- Missing/invalid telemetry maps to bounded conservative values rather than NaN/Infinity.

### Local Student and replay

- Architecture: `32 → 24 tanh → 5 softmax`.
- Xavier-like initialization.
- Online SGD/backprop.
- Gradient clipping and light L2 regularization.
- Bounded prioritized replay (512 default).
- Deterministic bounded validation subset.
- Model/replay export and schema-validated restore.

### Outcomes and reward

- Bounded pending strategic outcomes with a fixed lease.
- Reward uses measured farming progress, inventory headroom and safety/party/runtime signals.
- Death and explicit safety incidents carry strong penalties.
- Reward always clamped to `[-1, 1]`.

### Teacher distillation

- Teacher transport is `host-provided` and never required for gameplay.
- Teacher outage cannot block local farming.
- Responses are validated against the fixed action vocabulary and action mask.
- Invalid/masked responses fail closed.
- Confidence, action scores, reason, lesson and expected changes are bounded before entering telemetry/training state.
- `BRAIN_TEACH` is an elevated remote command and is denied by default by the Headless Control Gateway.

### Champion / Challenger / rollback

Defaults preserve the v2 governance concept:

- Champion eligibility: at least 80 samples, 120 updates, 60% Teacher agreement and sufficient outcomes.
- Challenger requires validation improvement.
- 20% bounded canary allocation.
- Safety incident immediately rejects a Challenger.
- Successful Challenger enters probation before final confirmation.
- Reward regression or safety incident during probation rolls back to the stored prior Champion.

### Brain quality

Bounded states:

- `warming`
- `healthy`
- `watch`
- `degraded`
- `quarantine`

Defaults include a 24-outcome window, 12-outcome minimum, 88% overconfidence threshold, 15 percentage-point reward-drop threshold and 20-minute quarantine. Only `healthy` quality may influence strategy or accept Challenger autonomy.

Combat Emergency Disengage is propagated as a Brain safety incident, clearing active preferences and entering quality quarantine.

### Brain Diary / Research summary

- Diary ring buffer: 80 entries default.
- Sensitive token/secret/password/auth/cookie/session-like fields are redacted.
- Research summary is deterministic and adds no AI request.
- Research summary intentionally excludes model weight matrices.
- Status/diagnostics remain JSON serializable and bounded.

### Brain persistence

- Brain state is staged into the existing World Model and saved through Alpha.8 resilient persistence.
- Persisted replay is a bounded tail, not the complete lifetime replay.
- State size is bounded (350 kB default).
- Unchanged Brain state is not restaged every persistence interval.
- Restore is atomic: corrupted state does not partially overwrite the current learning state.
- Restoring state never restores strategic influence; influence is always forced OFF.

### First conservative influence

Strategic influence defaults OFF.

When explicitly enabled, quality is healthy, a Champion exists and confidence clears the threshold, Brain influence can only:

- request a bounded `wait`, or
- prefer/rotate among deterministic already-safe same-map spawn candidates.

It cannot:

- attack or use skills,
- move directly,
- use potions,
- bypass content quarantine,
- bypass Combat Risk,
- bypass movement circuit breakers,
- interrupt Emergency Retreat/recovery/combat,
- cross maps,
- perform Merchant/economy actions,
- explore unknown content.

Remote activation of Brain influence is an elevated control and remains disabled by default.

## Alpha.8 invariants retained

Alpha.9 must preserve every Alpha.8 freeze contract, including:

- default `shadow` mode;
- `productionReplacement: false`;
- unknown-content quarantine;
- Emergency Disengage and verified Safe Retreat;
- command outcome verification;
- movement circuit breakers;
- stable scheduler waits;
- resilient persistence retry/circuit behavior;
- knowledge aging;
- bounded skill failure intelligence;
- headless operation without DOM, `game_log` or dashboard availability;
- bounded telemetry/status/state surfaces.

## Internal verification required before merge

The final Alpha.9 branch must pass all existing Alpha.8 regression tests plus Alpha.9 tests covering:

- tolerant spawn parsing;
- fail-closed spawn eligibility;
- active legacy-confidence gate and explicit approval override;
- scheduler-owned local move execution/cancellation;
- movement-circuit priority;
- progress-watchdog state/recovery;
- exact 32-feature contract;
- Student softmax/training;
- bounded prioritized replay;
- Teacher validation/action masks;
- Champion/Challenger/canary/probation/rollback;
- quality quarantine;
- reward bounds;
- atomic corrupted-state restore;
- Brain persistence bounds/deduplication;
- status polling without planner telemetry side effects;
- remote-control elevated gates;
- research redaction/no weight export;
- Brain inability to bypass movement/content/emergency gates;
- combined multi-thousand-tick shadow soak with zero real gameplay commands.

Browser VM smoke must prove the same Headless Contract with no DOM or `game_log` provided.

## Merge gate

Merge is permitted only when:

1. all changes remain under `v3/**`;
2. final generated browser bundle matches source;
3. all tests and smoke checks pass;
4. exact final PR-head CI is green;
5. merge uses expected-head protection.

## External certification gate

After merge, one combined safe FULL Alpha.9 validation is run in Adventure Land. The real loaded runtime is forced to `shadow` before validation and remains `shadow` afterwards. Active/failure scenarios use isolated synthetic runtimes and fake game commands.

Only a passing FULL Alpha.9 result marks this phase `CONFIRMED` and unlocks Alpha.10.

## Explicitly deferred

- cross-map navigation and server switching;
- deterministic Merchant/economy executor;
- sell/bank/compound/upgrade transactions;
- Gear Progression Planner;
- deliberate pull-control expansion;
- autonomous unknown-content combat;
- full per-class skill rotations;
- direct Brain gameplay commands.
