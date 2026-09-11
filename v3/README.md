# Adventure Land AiO Bot v3 — 3.0.0-alpha.3

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced. The browser bundle still starts in **shadow mode** by default, so copying it into Adventure Land does not immediately take control of the character.

## What alpha.3 adds

- first scheduler-owned Farmer state machine: `ASSESS → SELECT_TARGET → TRAVEL → ENGAGE → RECOVER → REASSESS/BLOCKED`
- one long-lived Farmer task per character; gameplay commands still originate through the Scheduler and Safe Game Adapter
- target selection through the existing Farm Planner, measured World Model performance and capability-based party fingerprint
- safe live-target selection that avoids monsters already claimed by unrelated players
- range-aware local travel and basic attacks using observed character `range`, `speed` and `frequency` instead of hard-coded class assumptions
- recovery thresholds with HP/MP potion handling and a `BLOCKED` state when combat would be unsafe
- Shadow preview plans that rank/select targets without issuing gameplay commands
- `AIO_V3.farmer.enable()`, `disable()` and `status()` plus Farmer state in `AIO_V3.showStatus()`
- attack-target normalization in the Game Adapter so Adventure Land's `attack(target)` receives the live entity object
- all alpha.2 measurement, persistence, discovery, research and diagnostics foundations

## Safety boundary

`3.0.0-alpha.3` is **not** the v2 production replacement. Default mode remains `shadow` and `productionReplacement` remains `false`.

Economy actions such as `sell`, `bank`, `compound`, `upgrade` and `trade` remain outside the adapter allowlist. The Farmer currently performs only local combat/recovery primitives already allowed by the Safe Game Adapter.

The Farmer is enabled by default as a **shadow preview task**. It does not move, attack or consume potions until the user explicitly switches the adapter to active mode.

## Adventure Land runtime API

```js
AIO_V3.showStatus()
AIO_V3.status()
AIO_V3.farmer.status()
AIO_V3.farmer.disable()
AIO_V3.farmer.enable()
AIO_V3.getEvents(100)
AIO_V3.getEvents({ component: "farmer", limit: 50 })
AIO_V3.exportDiagnostics()
AIO_V3.saveWorld()
```

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

## Current Farmer scope

Alpha.3 intentionally starts small. It farms **safe live monsters on the current map that are already visible**. If a selected target is outside attack range, it walks toward a range-aware position, attacks when `can_attack(target)` permits, consumes HP/MP potions under configured thresholds, and re-evaluates after the target dies/disappears.

It does not yet perform spawn routing, cross-map hunting, kiting paths, class-specific skills, loot/economy loops, buying potions or merchant logistics. Those remain later milestones so the first active controller stays observable and bounded.

## Performance measurement

Performance remains based on observed character/snapshot deltas. Windows track EXP, net Gold, observed kills/deaths, potion consumption, character HP loss and observed monster HP loss. Mixed-target windows stay diagnostic and are not written into a monster profile.

## World knowledge and persistence

The World Model keeps `OBSERVED`, `INFERRED` and `HYPOTHESIS` evidence distinct. Persistence prefers Adventure Land `get`/`set`, then browser `localStorage`, with bounded data and non-blocking failures.

## Development

```bash
cd v3
npm run check
```
