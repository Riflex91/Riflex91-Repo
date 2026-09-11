# Adventure Land AiO Bot v3 — 3.0.0-alpha.8.1

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.8 includes

- first scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- one long-lived Farmer task per character; gameplay commands still originate through the Scheduler and Safe Game Adapter
- target selection through the existing Farm Planner, measured World Model performance and capability-based party fingerprint
- configurable target-claim policy with `party-only` as the default: unclaimed/self/party targets are allowed, unrelated-player targets are skipped
- central target-safety exclusions: Adventure Land Target Automatons are never farmed, even under `allow`; custom exclusions can be added at runtime
- **alpha.8 step 1 Combat Risk Gate** before Farmer/Planner decisions: new pulls can be rejected when live aggro or sufficiently strong learned death evidence indicates elevated risk
- **alpha.8 step 2 Emergency Disengage** during active `ENGAGE`: the current target is withheld from the Farmer when HP is critical or multi-aggro combines with already-low HP, so the existing Farmer immediately stops issuing attacks and falls back through reassessment/recovery
- unknown monsters are not rejected merely because performance data is missing
- `avoid` mode limits claimed targets to self only; `allow` permits targets claimed by any player
- range-aware local travel and basic attacks using observed character `range`, `speed` and `frequency` instead of hard-coded class assumptions
- recovery thresholds with HP/MP potion handling and a `BLOCKED` state when combat would be unsafe
- Shadow preview plans that rank/select targets without issuing gameplay commands
- `AIO_V3.farmer.enable()`, `disable()` and `status()` plus Farmer state in `AIO_V3.showStatus()`
- attack-target normalization in the Game Adapter so Adventure Land's `attack(target)` receives the live entity object
- all alpha.2 measurement, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.8.1` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

Economy actions such as `sell`, `bank`, `compound`, `upgrade` and `trade` remain outside the adapter allowlist. The Farmer currently performs only local combat/recovery primitives already allowed by the Safe Game Adapter.

The Farmer is enabled by default as a **shadow preview task**. It does not move, attack or consume potions until the user explicitly switches the adapter to active mode.

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
AIO_V3.getEvents(100)
AIO_V3.getEvents({ component: "farmer", limit: 50 })
AIO_V3.exportDiagnostics()
AIO_V3.saveWorld()
```

`AIO_V3.status().combatRisk` exposes the pre-pull risk-gate configuration and latest rejected pull. `AIO_V3.status().combatEmergency` exposes the emergency thresholds and latest disengage. `AIO_V3.farmer.status()` mirrors the latest risk and emergency records for Farmer diagnostics.

Shadow mode is the safe default:

```js
AIO_V3.setMode("shadow")
```

After checking `AIO_V3.showStatus()` and the Farmer preview, active mode is an explicit opt-in:

```js
AIO_V3.setMode("active")
```

Switching back to shadow immediately stops future Farmer gameplay commands:

```js
AIO_V3.setMode("shadow")
```

To stop scheduling the Farmer task entirely:

```js
AIO_V3.farmer.disable()
```

## Target-claim policy

The default is `party-only`:

```js
AIO_V3.farmer.setTargetPolicy("party-only")
```

Available policies:

- `avoid` — farm unclaimed monsters or monsters already targeting you; party-claimed and foreign-claimed monsters are skipped
- `party-only` — also allow monsters targeting a current party member; unrelated players are skipped
- `allow` — permit otherwise-safe monsters even when they currently target another player

A policy change clears the current Farmer target and forces a reassessment, so it also applies to monsters that change ownership while the Farmer is travelling or fighting.

## Target safety exclusions

The Farmer applies a safety filter before planner ranking, target selection, travel and combat. `automatron` is a built-in exclusion because Adventure Land exposes the city training objects as **Target Automatron**. Built-in safety exclusions cannot be removed.

Additional live exclusions can be added or removed without restarting:

```js
AIO_V3.farmer.addTargetExclusion("example")
AIO_V3.farmer.removeTargetExclusion("example")
```

`AIO_V3.farmer.status()` reports `targetExclusions` and the latest `lastSafetySkip` record. Skips are rate-limited in structured telemetry as `FARMER_TARGET_SKIPPED`.

## Combat Risk Gate — alpha.8 step 1

For **new, unclaimed pulls** the pre-pull gate considers current HP, existing aggro and sufficiently confident measured `deathsPerHour`. Missing performance data is neutral, so unknown monsters remain testable. Risk rejections are logged as `FARMER_TARGET_RISK_REJECTED` with score, threshold and contributing signals.

## Emergency Disengage — alpha.8 step 2

Step 2 is intentionally smaller than full escape behavior. It only runs when the Farmer is already in `ENGAGE`, and only against the Farmer's exact current target.

It currently disengages when either condition is true:

- HP is at or below **35%**
- at least **2 live monsters** are targeting the character while HP is at or below **55%**

When triggered, the current target is removed from the Scheduler-facing farm snapshot for that tick. The existing Farmer therefore clears the target, stops issuing further attacks, reassesses and reaches its existing recovery path without any new movement or class-specific logic. The event is logged as `FARMER_EMERGENCY_DISENGAGE` with the reason and observed signals.

This step does **not** run away from the monsters yet. Physical escape movement, kiting and safe-position routing remain separate later steps, so any live problem can be attributed to one small behavior change.

## Current Farmer scope

Alpha.8 step 2 still farms **safe live monsters on the current map that are already visible**. If a selected target is outside attack range, it walks toward a range-aware position, attacks when `can_attack(target)` permits, consumes HP/MP potions under configured thresholds, and re-evaluates after the target dies/disappears or an emergency disengage removes the active target.

It does not yet perform spawn routing, cross-map hunting, kiting paths, class-specific skills, loot/economy loops, buying potions or merchant logistics. Those remain later milestones so each active controller increment stays observable and bounded.

## Performance measurement

Performance remains based on observed character/snapshot deltas. Windows track EXP, net Gold, observed kills/deaths, potion consumption, character HP loss and observed monster HP loss. Mixed-target windows stay diagnostic and are not written into a monster profile.

## World knowledge and persistence

The World Model keeps `OBSERVED`, `INFERRED` and `HYPOTHESIS` evidence distinct. Persistence prefers Adventure Land `get`/`set`, then browser `localStorage`, with bounded data and non-blocking failures.

## Development

```bash
cd v3
npm run check
```

### Recovery compatibility retained

Adventure Land exposes `use_hp_or_mp()` as the CODE potion helper. The adapter keeps the logical `use_hp` / `use_mp` actions for the Farmer, but transparently falls back to `use_hp_or_mp()` when direct helpers are unavailable. Recovery HP potion use continues until the configured recovery threshold (75% by default).
