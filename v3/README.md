# Adventure Land AiO Bot v3 — 3.0.0-alpha.8.4

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.8 includes

- scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- target selection through Farm Planner, measured World Model performance and capability-based party fingerprint
- configurable target-claim policy with `party-only` as the default
- central target-safety exclusions; Target Automatons are never farmed
- Combat Risk Gate before new pulls
- Emergency Disengage during unsafe active combat
- Basic Kiting during `ENGAGE`
- Skill Usage v1: one conservative direct-damage single-target skill selected from live `G.skills` metadata
- **Combat Target Reassessment v1**: a bounded switch from a non-self-focused current target to an already attacking self-aggressor
- range-aware local travel and basic attacks using observed `range`, `speed` and `frequency`, not fixed class names
- recovery thresholds with HP/MP potion handling
- shadow preview plans, structured telemetry, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.8.4` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

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

`AIO_V3.status().combatRisk` exposes pre-pull risk state. `AIO_V3.status().combatEmergency` exposes emergency thresholds and the latest disengage. `AIO_V3.farmer.status().kiting` exposes Basic Kiting. `AIO_V3.farmer.status().skillUsage` exposes the selected v1 skill, latest decision and latest successful use. `AIO_V3.farmer.status().targetReassessment` exposes the bounded reassessment policy, latest decision and latest target switch.

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

It removes only the exact current `ENGAGE` target from the Scheduler-facing snapshot, so the existing Farmer stops attacking and falls back through reassessment/recovery. It does not yet perform a dedicated escape route.

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

## Skill Usage v1

This increment deliberately adds only one narrow skill path. It does not contain a class-specific rotation or a hard-coded `ranger` branch.

The Farmer inspects live `G.skills` metadata and selects at most one skill that satisfies all of these conditions:

- `type === "skill"`
- hostile single-target skill (`target === true` or `target === "monster"`)
- compatible with the observed character class and level
- not an item-consume, slot-bound or persistent action
- direct damage with `damage_multiplier > 1`

Before use it preserves a default **30% max-MP reserve**, checks Adventure Land's live skill availability/cooldown helper, and checks the game's skill-range helper. Kiting has priority: if the target is currently too close, the Farmer repositions first and does not cast the skill on that tick.

The command path is `use_skill(skill, target)` through the Safe Game Adapter. The adapter resolves the target ID back to the live Adventure Land entity before calling the game API. If the skill command fails, the Farmer logs `FARMER_SKILL_USE_FAILED` and falls back to the existing attack path instead of entering `BLOCKED`.

Successful uses are logged as `FARMER_SKILL_USED`.

## Combat Target Reassessment v1 — alpha.8.4

Reassessment runs only during a healthy active `ENGAGE`. Recovery, Emergency Disengage and target-policy rejection remain higher-priority paths.

The first policy is intentionally conservative:

- if the current target already attacks the character, **keep it**, even when another self-attacker is closer
- if the current target does not attack the character and no other monster attacks self, **keep it**
- if the current target does not attack self but one or more already-live monsters do, switch to the **nearest self-attacker**
- reassessment checks are rate-limited to **750 ms** by default
- actual target switches have a separate **2500 ms** cooldown
- only monsters already present in the Scheduler-facing safe snapshot can become reassessment targets, so Target Safety, Combat Risk and target-claim filtering remain upstream

A successful switch is logged as `FARMER_TARGET_REASSESSED` with previous target, next target, attacker count and distance. `AIO_V3.farmer.status().targetReassessment.lastDecision` shows the latest decision and `lastSwitch` shows the latest actual switch.

This version deliberately does **not** switch targets for better XP, lower HP, higher damage opportunity or arbitrary planner score. It also does not rotate between multiple self-attackers while the current target is already attacking self. Those broader threat-scoring decisions remain later work.

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

Alpha.8.4 still farms safe live monsters already visible on the current map. It can recover, select targets, travel locally, attack, reject unsafe pulls, emergency-disengage, make simple ranged distance corrections, use one conservative single-target damage skill, and prioritize an already attacking self-aggressor over a current target that is not attacking self.

It does not yet perform dedicated emergency escape routing, spawn routing, cross-map hunting, obstacle-aware kiting, broad threat-score target switching, skill rotations, loot/economy loops, buying potions or merchant logistics.

## Development

```bash
cd v3
npm run check
```

Adventure Land recovery compatibility remains unchanged: logical `use_hp` / `use_mp` actions fall back to `use_hp_or_mp()` when needed, and HP potion use continues through the configured 75% recovery threshold.
