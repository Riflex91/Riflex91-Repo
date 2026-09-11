# Adventure Land AiO Bot v3 — 3.0.0-alpha.1

This is the first v3 foundation. It intentionally lives beside the v2 production bot and does **not** replace `bot.js` yet.

## What this alpha contains

- one deterministic scheduler with one active task owner per character
- explicit task states, retries, progress/stall detection and structured reasons
- a safe game adapter with `shadow` mode as the default
- a tri-state world model (`UNKNOWN`, `KNOWN_TRUE`, `KNOWN_FALSE`)
- observed/inferred/hypothesis evidence separation
- capability-based party descriptions instead of fixed Ranger/Merchant assumptions
- a farm candidate ranker that prioritizes safety, then EXP/h and Gold/h, with confidence/travel awareness
- structured ring-buffer diagnostics with secret redaction and incident export
- an Adventure Land browser bundle at `dist/aio-v3.js`

## Important safety boundary

`3.0.0-alpha.1` is a **shadow/research foundation**, not the production replacement. It does not automatically sell, bank, compound, upgrade or trade items. The adapter can only execute a deliberately small set of commands in active mode, and active mode must be explicitly enabled.

This lets v3 collect evidence and validate its scheduler/world model before it is trusted with irreversible economy actions.

## Running in Adventure Land

Use the generated `dist/aio-v3.js` as the code body for a test character. It exposes:

```js
AIO_V3.status()
AIO_V3.getEvents(100)
AIO_V3.exportDiagnostics()
AIO_V3.setMode("shadow")
AIO_V3.start()
AIO_V3.stop()
```

The bundle starts automatically in `shadow` mode unless `globalThis.AIO_V3_AUTOSTART = false` is set before loading it.

`AIO_V3.setMode("active")` is deliberately guarded. In this alpha it only unlocks reversible/low-risk movement/combat primitives exposed by the adapter; economy actions remain unavailable.

## Diagnostics

`AIO_V3.exportDiagnostics()` returns one JSON string containing the manifest, current snapshot, scheduler state, world-model summary and the retained structured events. The logging layer refuses to retain common secret fields such as tokens, passwords, API keys, authorization headers, cookies and write keys.

For a bug report, copy the returned JSON to a file and upload it. Later v3 milestones will add automatic Cloudflare batching and incident bundles without making gameplay depend on telemetry.

## Development

```bash
cd v3
npm run check
```

The source uses small CommonJS modules so Node can test them directly. `scripts/build.js` creates a dependency-free browser bundle for Adventure Land.
