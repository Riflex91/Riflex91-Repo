# Adventure Land AiO Bot v3 — 3.0.0-alpha.8.2

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.8 includes

- scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- target selection through Farm Planner, measured World Model performance and capability-based party fingerprint
- configurable target-claim policy with `party-only` as the default
- central target-safety exclusions; Target Automatons are never farmed
- **step 1 Combat Risk Gate** before new pulls
- **step 2 Emergency Disengage** during unsafe active combat
- **step 4 Basic Kiting** during `ENGAGE`: sufficiently ranged characters create space when their current target gets too close
- range-aware local travel and basic attacks using observed `range`, `speed` and `frequency`, not fixed class names
- recovery thresholds with HP/MP potion handling
- shadow preview plans, structured telemetry, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.8.2` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

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

`AIO_V3.status().combatRisk` exposes pre-pull risk state. `AIO_V3.status().combatEmergency` exposes emergency thresholds and the latest disengage. `AIO_V3.farmer.status().kiting` exposes the Basic Kiting configuration and latest kite move.

Shadow mode remains the safe default:

```js
AIO_V3.setMode("shadow")
```

Active mode is explicit:

```js
AIO_V3.setMode("active")
```

## Combat Risk Gate — step 1

For new, unclaimed pulls the gate considers current HP, existing aggro and sufficiently confident measured `deathsPerHour`. Missing performance data is neutral. Rejections are logged as `FARMER_TARGET_RISK_REJECTED`.

## Emergency Disengage — step 2

Emergency Disengage currently triggers when either condition is true:

- HP is at or below **35%**
- at least **2 live monsters** target the character while HP is at or below **55%**

It removes only the exact current `ENGAGE` target from the Scheduler-facing snapshot, so the existing Farmer stops attacking and falls back through reassessment/recovery. It does not yet perform a dedicated escape route.

## Basic Kiting — step 4

Basic Kiting is deliberately small and capability based. It does not check `ctype` or hard-code Ranger behavior.

Default behavior:

- Kiting is enabled only when observed attack `range` is at least **80**.
- A target becomes "too close" below **45% of the character's attack range**.
- The desired spacing is **72% of attack range**.
- Movement is directly away from the current target and the step size is bounded by observed `range` and `speed`.
- The kite move has its own **650 ms** cooldown.
- A target focused on somebody other than the current character is not repositioned by the kiting layer.
- If a kite `move` command fails, the Farmer falls back to its existing attack behavior rather than entering `BLOCKED`.

Successful kite requests are logged as `FARMER_KITE_MOVE_REQUESTED`; failures as `FARMER_KITE_MOVE_FAILED`. `AIO_V3.farmer.status().kiting.lastMove` records the latest successful reposition request.

This is **not** circle kiting, obstacle-aware pathing, safe-retreat routing or a skill rotation. Those remain separate increments.

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

Alpha.8.2 still farms safe live monsters that are already visible on the current map. It can recover, select targets, travel locally, attack, reject unsafe pulls, disengage from emergency combat and make simple distance corrections during suitable ranged combat.

It does not yet perform spawn routing, cross-map hunting, obstacle-aware kiting, class-specific skills, loot/economy loops, buying potions or merchant logistics.

## Development

```bash
cd v3
npm run check
```

Adventure Land recovery compatibility remains unchanged: logical `use_hp` / `use_mp` actions fall back to `use_hp_or_mp()` when needed, and HP potion use continues through the configured 75% recovery threshold.
