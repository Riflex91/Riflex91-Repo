# Alpha.8.13 — Headless Operations Foundation

This block makes headless operation and web-dashboard integration a first-class runtime contract without embedding a web server into gameplay code.

## Guarantees

- No DOM, visible window, `game_log`, or dashboard connection is required for gameplay.
- Structured telemetry is copied into a bounded outbox that a host/dashboard bridge may drain asynchronously.
- Dashboard/control input enters through a deduplicated, TTL-bounded allowlist gateway.
- Risk-increasing remote actions are disabled unless the host explicitly enables elevated control.
- World-state replication is coalesced to the latest bounded snapshot instead of blocking gameplay on remote storage.
- External supervisors can read headless health (`HEALTHY`, `WATCH`, `DEGRADED`) from tick/snapshot freshness.
- In-game visible messages are an optional mirror; audit events exist even when `game_log` does not.

## Explicit non-goals

- No HTTP/WebSocket server is embedded in the Adventure Land bot.
- No credentials or dashboard secrets are stored by v3.
- No arbitrary remote JavaScript execution.
- No automatic browser restart yet; this block defines the supervisor contract that an external host will use.
- No change to v2 production behavior.

Command Outcome Verification moves to Alpha.8.14 so the operations boundary is stable before command semantics are extended.
