# Alpha.8 — Combat & Stability Foundation Freeze

Alpha.8 is now developed and certified as one coherent phase. Individual internal milestones remain independently testable, but they are not separate external release gates. Development does not move to Alpha.9 until the complete Alpha.8 phase passes CI, fault injection and the controlled FULL Alpha.8 validation.

## Phase freeze version

`3.0.0-alpha.8.20`

Default mode remains `shadow`. `productionReplacement` remains `false`. v2 production behavior remains untouched.

## What Alpha.8 contains

### Previously live-confirmed combat foundation

- Safe Retreat with bounded one-shot local movement.
- Multi-aggro target priority and self-aggro threat priority.
- Safe direct-damage skill candidate ladder.
- Skill execution fallback with bounded attempts.
- Cross-tick skill failure backoff and failure intelligence.
- Unknown-content quarantine / fail-closed content safety.
- Headless Operations Foundation with bounded telemetry, safe control gateway, state replication and supervisor health contract.

### Alpha.8 completion hardening

#### Command Outcome Verification

An API call returning without throwing is now treated as **accepted**, not automatically as observed gameplay success. Commands receive bounded outcome records with `PENDING`, `CONFIRMED` or `TIMED_OUT` states. Confirmation comes from subsequent game snapshots such as real position changes, target HP changes, target disappearance/death, MP consumption or potion effects.

#### Movement Stability

- Normal movement requests coalesce while a prior move is awaiting an observed outcome.
- Repeated unverified movement opens a bounded movement circuit.
- The circuit cools down and closes automatically.
- Confirmed movement resets the failure streak.
- Kiting is suppressed rather than bypassed with an attack while movement safety is circuit-open.
- Emergency Retreat supersedes ordinary pending movement.
- Emergency Retreat itself is tracked through an observed movement outcome and is explicitly marked confirmed or unconfirmed.

#### Scheduler / Long-State Hardening

Legitimate long waits such as `CHARACTER_DEAD`, missing snapshots or explicit Farmer blocked states are stable waiting states. They no longer trigger scheduler `NO_PROGRESS` retry churn. When the condition resolves, the same task resumes with a fresh stall window.

#### Resilient Persistence

- Failed world-state loads retry with bounded exponential backoff instead of becoming permanently considered loaded.
- Failed saves use bounded retry/backoff.
- Repeated save failures open a temporary persistence circuit instead of hot-looping storage calls.
- A later successful save clears the failure/circuit state.
- Serialization and storage errors remain gameplay-independent and observable.

#### Knowledge Aging

Learned farm performance is no longer treated as eternally fresh. Existing confidence is reduced as knowledge ages, stale data is marked `needsRevalidation`, and stale learned performance contributes conservative risk before new pulls. Production defaults are 6 hours fully fresh and 72 hours until stale, with a minimum freshness multiplier of 0.15.

#### Headless / Dashboard invariants

- No DOM, visible browser window, `game_log`, or connected dashboard is required for gameplay.
- Operator/audit telemetry exists even if the visible Adventure Land log is unavailable.
- Dashboard transport remains host-provided and cannot block the gameplay loop.
- Risk-increasing remote controls remain disabled unless the host explicitly opts in.
- State/status remain JSON serializable and bounded.

## Required Alpha.8 certification gates

Alpha.8 is only called **CONFIRMED** after all of the following are true:

1. All v3 unit and regression tests pass.
2. Browser bundle build and VM smoke pass without DOM or `game_log`.
3. Fault injection passes for command timeouts, movement stalls, persistence read/write faults, long death/wait states and state serialization failures.
4. Synthetic soak keeps event logs, command outcomes, scheduler history and telemetry bounded.
5. Unknown content remains quarantined and cannot bypass safety through an already-engaged state.
6. Safe Retreat remains emergency-first and its movement outcome is observable.
7. Headless Operations safety gates remain intact.
8. GitHub CI is green on the **exact final PR head**.
9. The merged final bundle passes one combined FULL Alpha.8 test in Adventure Land, ending in `shadow`.

Only after gate 9 passes does development advance to Alpha.9.

## Fault model explicitly covered

- command accepted but no observable gameplay effect
- movement accepted but character does not move
- repeated movement stalls
- circuit cooldown and recovery
- duplicate movement requests while one outcome is pending
- character death / long blocked state without task churn
- persistence read failure
- persistence write failure / circuit breaker
- stale learned performance
- unknown monster content
- skill outcome timeout and backoff integration
- Safe Retreat outcome confirmation / timeout
- dashboard absent
- DOM / `game_log` absent
- bounded long synthetic operation

## Deliberate non-goals of Alpha.8

Alpha.8 does not add cross-map navigation, deliberate pull control, economy, Merchant transactions, full class rotations, Brain autonomy, automatic browser-process restart, or autonomous unknown-content exploration. Those capabilities build on this stability foundation in later phases and must earn their own phase certification.
