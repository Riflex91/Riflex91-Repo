# Adventure Land AiO Bot v3 — 3.0.0-alpha.8

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.8 includes

- first scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- one long-lived Farmer task per character; gameplay commands still originate through the Scheduler and Safe Game Adapter
- target selection through the existing Farm Planner, measured World Model performance and capability-based party fingerprint
- configurable target-claim policy with `party-only` as the default: unclaimed/self/party targets are allowed, unrelated-player targets are skipped
- central target-safety exclusions: Adventure Land Target Automatons are never farmed, even under `allow`; custom exclusions can be added at runtime
- **alpha.8 step 1 Combat Risk Gate** before Farmer/Planner decisions: new pulls can be rejected when live aggro or sufficiently strong learned death evidence indicates elevated risk
- existing combat is not abandoned by the new risk gate; monsters that already have a target continue through the existing target-claim policy
- unknown monsters are not rejected merely because performance data is missing
- `avoid` mode limits claimed targets to self only; `allow` permits targets claimed by any player
- range-aware local travel and basic attacks using observed character `range`, `speed` and `frequency` instead of hard-coded class assumptions
- recovery thresholds with HP/MP potion handling and a `BLOCKED` state when combat would be unsafe
- Shadow preview plans that rank/select targets without issuing gameplay commands
- `AIO_V3.farmer.enable()`, `disable()` and `status()` plus Farmer state in `AIO_V3.showStatus()`
- attack-target normalization in the Game Adapter so Adventure Land's `attack(target)` receives the live entity object
- all alpha.2 measurement, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.8` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

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

`AIO_V3.status().combatRisk` exposes the current risk-gate configuration and latest rejected pull. `AIO_V3.farmer.status().lastRiskSkip` mirrors the latest Farmer-facing rejection.

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

Alpha.8 deliberately adds only one combat-intelligence layer. The gate sits after static target safety and before Planner/Farmer target decisions.

For **new, unclaimed pulls** it currently considers:

- current HP relative to the Farmer recovery threshold
- whether another live monster is already attacking the character
- measured `deathsPerHour` for the monster/party fingerprint when confidence is high enough

A pull is rejected only when the combined risk score crosses the configured threshold. Missing performance data is neutral, so unknown monsters remain testable. Monsters that already have a target are treated as existing combat and are not abandoned by this gate; the normal `avoid` / `party-only` / `allow` ownership policy still decides whether the Farmer may engage them.

Risk rejections are rate-limited as `FARMER_TARGET_RISK_REJECTED` and include score, threshold and contributing signals.

This step intentionally does **not** add kiting, class-specific skills, escape routing, spawn routing or cross-map behavior. Those are separate follow-up steps after live validation.

## Current Farmer scope

Alpha.8 step 1 still farms **safe live monsters on the current map that are already visible**. If a selected target is outside attack range, it walks toward a range-aware position, attacks when `can_attack(target)` permits, consumes HP/MP potions under configured thresholds, and re-evaluates after the target dies/disappears.

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
