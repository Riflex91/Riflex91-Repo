# Adventure Land AiO Bot v3 — 3.0.0-alpha.2

v3 remains isolated beside the v2 production bot. `bot.js` is not replaced, and this alpha remains **shadow/research-first**.

## What alpha.2 adds

- measured rolling performance windows for EXP, net Gold, kills, deaths, potion consumption, damage taken and observed monster HP loss
- performance aggregation per monster and capability-based party fingerprint
- persistent World Model storage with bounded size, periodic saves, safe restore and non-blocking failure handling
- live discovery of monsters, NPCs and objects, plus clearly marked `INFERRED` knowledge from the current map's metadata
- richer structured diagnostics with event filtering, component/severity/reason summaries and diagnostic snapshots
- a Research Journal that records hypotheses and observation-only experiments without executing gameplay actions
- continued planner use of measured EXP/h / Gold/h when enough evidence exists
- generated Adventure Land browser bundle at `dist/aio-v3.js`

## Safety boundary

`3.0.0-alpha.2` is still **not** the production replacement. Economy actions such as `sell`, `bank`, `compound`, `upgrade` and `trade` are not in the adapter allowlist.

Research experiments are proposal/observation records only. Any experiment that requires an action is marked `BLOCKED` with `ALPHA_OBSERVATION_ONLY`. The Research layer has no command path to the Game Adapter.

Telemetry and persistence failures are logged but do not block scheduler/gameplay execution.

## Runtime API

```js
AIO_V3.status()
AIO_V3.getEvents(100)
AIO_V3.getEvents({ component: "performance", limit: 50 })
AIO_V3.exportDiagnostics()
AIO_V3.saveWorld()
AIO_V3.setMode("shadow")
AIO_V3.start()
AIO_V3.stop()
```

Research foundation:

```js
AIO_V3.research.hypothesis({
  type: "monster",
  entityId: "goo",
  fact: "profitable_at_current_level",
  value: true,
  confidence: 0.25,
  rationale: "Needs measured windows"
})

AIO_V3.research.proposeExperiment({
  kind: "MEASURE",
  target: "goo",
  method: "Observe several farming windows without changing economy behavior"
})
```

## Performance measurement

Performance is based on observed character/snapshot deltas. A window tracks:

- EXP gained, including level-up handling when `G.levels` is available
- net character Gold delta
- observed monster death transitions
- character death transitions
- potion inventory consumption
- character HP loss
- observed monster HP loss

A window is only written into a monster performance profile when one monster is dominant enough to attribute the window safely. Mixed/unknown-target windows remain in diagnostics but do not contaminate the learned farm profile.

## World knowledge and persistence

The World Model keeps `OBSERVED`, `INFERRED` and `HYPOTHESIS` evidence distinct. Live entities/objects are `OBSERVED`; current-map metadata is `INFERRED`.

Persistence prefers Adventure Land's `get`/`set`, then browser `localStorage`, and can be replaced with a test/custom storage adapter. Reads/writes are defensive and never allowed to stop gameplay. World entities and performance profiles are bounded to prevent unbounded 24/7 growth.

## Diagnostics

`AIO_V3.exportDiagnostics()` returns JSON with:

- runtime/scheduler state
- current snapshot
- World Model summary plus recent knowledge/performance profiles
- current and recent performance windows
- Research summary/experiments
- structured event summary and ring buffer

Secret-like keys continue to be redacted.

## Development

```bash
cd v3
npm run check
```

The next milestone can build the first real Farmer state machine on top of this measurement/discovery foundation instead of mixing learning logic into controller ticks.
