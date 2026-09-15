# Adventure Land AiO Bot v3 — 3.0.0-alpha.8.11

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.8 includes

- scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- target selection through Farm Planner, measured World Model performance and capability-based party fingerprint
- configurable target-claim policy with `party-only` as the default
- central target-safety exclusions; Target Automatons are never farmed
- Combat Risk Gate before new pulls
- Emergency Disengage during unsafe active combat
- **Safe Retreat Movement**: one bounded local `move` away from the current emergency threat cluster, executed only by the scheduler-owned Farmer
- Basic Kiting during `ENGAGE`
- Skill Usage v5: the same conservative direct-damage single-target safe pool, with bounded preflight fallback, bounded execution fallback, cross-tick per-skill backoff, and bounded repeated-failure intelligence
- Combat Target Reassessment v3: preserve self-aggro distance hysteresis and add a narrow threat override when another already-attacking self-aggressor has a materially higher known incoming-DPS proxy
- range-aware local travel and basic attacks using observed `range`, `speed` and `frequency`, not fixed class names
- recovery thresholds with HP/MP potion handling
- shadow preview plans, structured telemetry, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.8.11` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

Economy actions such as `sell`, `bank`, `compound`, `upgrade` and `trade` remain outside the adapter allowlist. The Farmer performs only bounded combat/recovery primitives through the Scheduler and Safe Game Adapter.

## Adventure Land runtime API

```js
AIO_V3.showStatus()
AIO_V3.status()
AIO_V3.farmer.status()
AIO_V3.farmer.setTargetPolicy("party-only")
AIO_V3.farmer.addTargetExclusion("example")
AIO_V3.farmer.removeTargetExclusion("example")
AIO_V3.farmer.disable()
AIO_V3.farmer.enable()
AIO_V3.getEvents({ component: "farmer", limit: 100 })
AIO_V3.exportDiagnostics()
AIO_V3.saveWorld()
```

`AIO_V3.status().combatRisk` exposes pre-pull risk state. `AIO_V3.status().combatEmergency` exposes emergency thresholds, the latest disengage and whether a retreat is pending. `AIO_V3.farmer.status().safeRetreat` exposes Safe Retreat configuration plus the latest move/failure. `AIO_V3.farmer.status().kiting` exposes Basic Kiting. `AIO_V3.farmer.status().skillUsage` exposes the highest-ranked safe metadata candidate, bounded preflight/execution fallback settings, adaptive failure-backoff configuration, active per-skill backoffs and recent failure streaks, the latest decision including rejected candidates and command attempts, the latest execution outcome, the latest failure recovery and the latest successful use. `AIO_V3.farmer.status().targetReassessment` exposes the bounded reassessment policy, the distance and threat switch factors, the threat metric, latest decision and latest target switch.

Shadow mode remains the safe default:

```js
AIO_V3.setMode("shadow")
```

Active mode is explicit:

```js
AIO_V3.setMode("active")
```

## Combat Risk Gate

For new, unclaimed pulls the gate considers current HP, existing aggro and sufficiently confident measured `deathsPerHour`. Missing performance data is neutral. Rejections are logged as `FARMER_TARGET_RISK_REJECTED`.

## Emergency Disengage

Emergency Disengage currently triggers when either condition is true:

- HP is at or below **35%**
- at least **2 live monsters** target the character while HP is at or below **55%**

It removes only the exact current `ENGAGE` target from the Scheduler-facing snapshot. In active mode the Runtime also records one pending Safe Retreat request containing the current target and observed self-aggressors. The Runtime itself does **not** call `move` or any other gameplay action for the retreat.

## Safe Retreat Movement — alpha.8.5

Safe Retreat is deliberately small and local. It is not pathfinding and it is not a permanent flee mode.

Default behavior:

- only an active Emergency Disengage can arm a retreat; shadow mode never arms one
- the Runtime records the retreat as pending; the scheduler-owned Farmer consumes it once
- the retreat vector points away from the observed emergency cluster: the current combat target plus monsters currently targeting self
- closer positioned threats weigh more heavily in the escape direction
- movement uses the observed character speed for roughly **1.5 seconds** of travel, bounded to **35–90** distance units by default
- the only movement primitive is local `move(x, y)` through the Safe Game Adapter
- there is no `smart_move`, routing, obstacle solving or repeated flee loop in this step
- after the one movement attempt the current target is cleared and the Farmer enters `RECOVER`, then continues through normal reassessment
- a failed or unavailable retreat move is logged but **never** puts the Farmer into `BLOCKED`

Successful movement requests are logged as `FARMER_SAFE_RETREAT_REQUESTED`; command failures as `FARMER_SAFE_RETREAT_FAILED`; missing/disabled movement decisions as `FARMER_SAFE_RETREAT_SKIPPED`.

## Basic Kiting

Default behavior:

- Kiting is enabled only when observed attack `range` is at least **80**.
- A target becomes too close below **45% of attack range**.
- Desired spacing is **72% of attack range**.
- Movement is directly away from the current target and bounded by observed `range` and `speed`.
- Kite movement has its own **650 ms** cooldown.
- Targets focused on somebody else are not repositioned by this layer.
- Failed kite movement falls back to existing attack behavior rather than entering `BLOCKED`.

Successful requests are logged as `FARMER_KITE_MOVE_REQUESTED`; failures as `FARMER_KITE_MOVE_FAILED`.

## Skill Usage v5 — alpha.8.11

The safe skill boundary from v1 remains unchanged. Alpha.8.8 added bounded preflight fallback, Alpha.8.9 added bounded same-tick execution fallback, Alpha.8.10 added short per-skill memory for retryable command failures across later engage ticks, and Alpha.8.11 adds bounded repeated-failure intelligence. This increment still does **not** add a class-specific rotation, a hard-coded `ranger` branch, AoE, support/debuff skills or any new skill category.

The Farmer inspects live `G.skills` metadata and builds a candidate list only from skills that satisfy all of these conditions:

- `type === "skill"`
- hostile single-target skill (`target === true` or `target === "monster"`)
- compatible with the observed character class and level
- not an item-consume, slot-bound or persistent action
- direct damage with `damage_multiplier > 1`

Safe candidates are ranked deterministically by higher `damage_multiplier`, then higher metadata cooldown, then stable skill ID. For each candidate in that order, the Farmer preserves the default **30% max-MP reserve**, checks Adventure Land's live skill availability/cooldown/requirement helper, and checks the game's skill-range helper. A candidate rejected by one of those gates is recorded and the next candidate from the **same safe pool** may be considered.

The four bounded Alpha.8.8 improvements remain:

- if the highest-ranked safe skill would violate the MP reserve, try the next safe candidate instead of abandoning the skill path immediately
- if it is unavailable because of cooldown or a live requirement, try the next safe candidate
- if it is out of range, try the next safe candidate
- expose `candidateCount`, selected `candidateRank`, and `rejectedCandidates` in the latest skill decision/use telemetry

Alpha.8.9 keeps five bounded execution behaviors:

- only adapter result `COMMAND_FAILED` is considered retryable; global `COMMAND_UNAVAILABLE` and other failures stop the skill retry chain immediately
- a command-failed skill is skipped and the same safe candidate ladder is re-evaluated from live MP, cooldown/requirement and range gates before another attempt
- at most **2** `use_skill` command attempts are allowed in one engage tick by default
- if no safe execution fallback is available, the retry limit is exhausted, or the failure is non-retryable, control falls back to the existing normal attack path rather than entering a skill loop
- execution telemetry records every bounded attempt, retryability, whether a retry was planned, the final execution outcome and whether an execution fallback was used

Alpha.8.10 keeps five bounded cross-tick behaviors:

- every retryable `COMMAND_FAILED` arms a backoff for that exact safe skill only; non-retryable failures never create a backoff
- the base backoff is **2000 ms**, with the base configuration clamped to **500–10000 ms**
- while a backoff is active, the same safe ladder rejects that candidate with reason `SKILL_COMMAND_BACKOFF` and revalidates lower-ranked candidates through the existing MP, cooldown/requirement and range gates
- expired backoffs are pruned automatically, so the original higher-ranked skill becomes eligible again without manual state reset
- `FARMER_SKILL_BACKOFF_ARMED`, `activeFailureBackoffs`, `lastBackoff`, `backoffArmed` and `backoffMs` expose the bounded state in events/status/diagnostics

Alpha.8.11 adds five bounded repeated-failure behaviors:

- retryable failures are counted **per exact skill**; a failure of one safe candidate does not poison other candidates
- repeated failures within the memory window increase that skill's backoff from **2 s → 4 s → 8 s**, capped at **8 s** by default; multiplier and maximum are bounded configuration values
- a real `executed` success for that skill immediately clears its failure streak and active backoff; a `shadow` result deliberately does not fabricate a recovery
- if the skill has no retryable failure for **30 s** by default, its failure history expires and the next failure starts again at the base backoff
- `failureStreak`, `recentFailureStreaks`, `lastFailureRecovery` and `FARMER_SKILL_FAILURE_STREAK_RESET` make escalation and recovery explicit in status/events/diagnostics

Rank 1 keeps preflight reason `SAFE_DIRECT_DAMAGE_SKILL`; a lower-ranked safe candidate uses `SAFE_DIRECT_DAMAGE_FALLBACK_SKILL`. A successful second command attempt is additionally identified by execution reason `SAFE_DIRECT_DAMAGE_EXECUTION_FALLBACK`. A candidate failed earlier in the same engage tick still uses `PREVIOUS_COMMAND_FAILED`; that same-tick reason intentionally takes precedence over the cross-tick `SKILL_COMMAND_BACKOFF` marker so Alpha.8.9 telemetry remains stable.

The command path remains `use_skill(skill, target)` through the Safe Game Adapter. The adapter resolves the target ID back to the live Adventure Land entity before calling the game API. `FARMER_SKILL_USE_FAILED` reports `executionAttempt`, `retryable`, `willRetry`, `maxCommandAttempts`, `backoffArmed`, `backoffMs` and `failureStreak`; successful execution remains `FARMER_SKILL_USED`. `lastExecution`, `lastDecision.executionAttempts`, `executionOutcome` and `executionFallbackUsed` expose the bounded execution chain, while active backoffs, recent streak state and the latest confirmed recovery are reported separately.

No candidate outside the existing v1 direct single-target damage safety classifier can enter preflight, execution fallback or failure intelligence. Kiting still has priority, the existing 750 ms skill interval remains in force between engage ticks, and Alpha.8.5–8.10 safety behavior is unchanged.

## Combat Target Reassessment v3 — alpha.8.7

Reassessment runs only during a healthy active `ENGAGE`. Recovery, Emergency Disengage and target-policy rejection remain higher-priority paths.

The Alpha.8.6 behavior remains the fallback:

- if the current target does **not** attack self and one or more already-live safe monsters do, switch to the **nearest self-attacker**
- if the current target already attacks self and it is the only self-attacker, keep it
- if multiple monsters already attack self, the nearest alternative can replace the current target only when its distance is at most **70%** of the current target distance
- reassessment checks remain rate-limited to **750 ms** by default
- actual target switches retain the separate **2500 ms** cooldown

Alpha.8.7 adds one narrow threat override only between monsters that are already attacking the character:

- the threat metric is `G.monsters[mtype].attack × frequency`
- both the current self-attacker and an alternative must have valid positive `attack` and `frequency` metadata before threat can override distance
- an alternative must have a threat score of at least **125%** of the current target's score by default
- if several alternatives meet the threat path, the highest threat score wins; equal scores use the shorter distance and then stable ID order
- if threat metadata is missing, incomplete, or below the 25% advantage threshold, the live-confirmed Alpha.8.6 distance rule remains in control
- this path never introduces a new pull; candidates still come only from the Scheduler-facing safe snapshot after Target Safety and Combat Risk filtering

Threat switches are logged as `FARMER_TARGET_REASSESSED` with reason `HIGHER_SELF_AGGRO_THREAT`. Telemetry includes `currentThreatScore`, candidate `threatScore`, `threatSwitchThreshold`, distances and attacker count. `AIO_V3.farmer.status().targetReassessment` exposes `selfAggroThreatSwitchFactor: 1.25` and the threat metric alongside the existing distance hysteresis.

This version deliberately does **not** consider target XP, target HP, planner score, loot value or learned farm profitability for mid-combat switching. It does not estimate armor-adjusted real damage, special attacks or future damage; `attack × frequency` is only a bounded first-pass prioritization signal among already active self-aggressors.

## Target-claim policy

The default is `party-only`:

```js
AIO_V3.farmer.setTargetPolicy("party-only")
```

- `avoid` — unclaimed monsters or monsters already targeting self
- `party-only` — also party-targeted monsters
- `allow` — otherwise-safe monsters regardless of current target owner

## Target safety exclusions

`automatron` remains a built-in non-removable exclusion. Additional runtime exclusions can be managed with:

```js
AIO_V3.farmer.addTargetExclusion("example")
AIO_V3.farmer.removeTargetExclusion("example")
```

## Current scope

Alpha.8.11 still farms safe live monsters already visible on the current map. It can recover, select targets, travel locally, attack, reject unsafe pulls, emergency-disengage, make one short local emergency retreat, make simple ranged distance corrections, use the highest-ranked currently usable member of the existing conservative single-target direct-damage skill pool with bounded MP/cooldown/range fallback, make one bounded retry to another revalidated safe skill after a retryable command failure, temporarily avoid an exact safe skill that just produced a retryable command failure, progressively but boundedly damp repeated failures of that exact skill and reset the streak on confirmed success, prioritize an already attacking self-aggressor over a non-self-focused target, resolve multi-aggro toward a materially closer self-attacker, and prioritize a materially higher known `attack × frequency` self-aggressor without abandoning the existing switch cooldown.

It does not yet perform emergency pathfinding, obstacle-aware escape routing, repeated flee behavior, spawn routing, cross-map hunting, obstacle-aware kiting, HP/XP/planner-based target switching, armor/special-attack-aware threat modeling, AoE or full skill rotations, loot/economy loops, buying potions or merchant logistics.

## Stability direction

`STABILITY_ROADMAP.md` records the project-wide unattended-operation invariants: bounded actions, leases/timeouts, risk budgets, anti-thrashing, circuit breakers, crash-safe transactions, persistent/schema-versioned state, content-drift handling, sustainable equipment progression, deterministic Brain safety boundaries and soak/fault certification.

## Development

```bash
cd v3
npm run check
```

Adventure Land recovery compatibility remains unchanged: logical `use_hp` / `use_mp` actions fall back to `use_hp_or_mp()` when needed, and HP potion use continues through the configured 75% recovery threshold.
