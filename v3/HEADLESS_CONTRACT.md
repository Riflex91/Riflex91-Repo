# v3 Headless Operations Contract

This contract is binding for v3 unattended/headless operation and future web-dashboard integration.

## Runtime independence

The gameplay runtime must continue operating when all operator surfaces are absent. No subsystem may require a visible browser window, DOM access, `game_log`, or a live dashboard connection. Adventure Land itself still runs inside the browser/headless-browser environment; v3 does not reimplement the game protocol in Node.js.

## Telemetry boundary

`AIO_V3.operations` exposes a bounded telemetry outbox. The bot only copies already-sanitized EventLog records into that outbox. A host process may drain and forward batches to a dashboard. Network transport is deliberately outside the gameplay runtime.

Required host behavior:

- drain in bounded batches
- authenticate and encrypt remote transport
- retry with backoff outside the gameplay loop
- tolerate dropped old telemetry when the bounded queue overflows
- never block Adventure Land commands while telemetry is offline

## Remote-control boundary

Remote control uses explicit command envelopes only:

- `commandId`
- `action`
- `params`
- `issuedAt`
- `expiresAt`

The gateway deduplicates command IDs, enforces a maximum TTL, rejects unknown actions, rejects future/expired envelopes, and records audit events. Arbitrary JavaScript evaluation is not supported.

Risk-increasing commands are disabled by default and require an explicit host-side `allowElevatedRemoteControl` opt-in. This includes activating command execution, enabling the Farmer, switching target policy to `allow`, removing target exclusions, and approving quarantined monster content. Safety-reducing commands such as switching to shadow, disabling the Farmer, adding exclusions, or quarantining content remain available without elevated control.

Authentication/authorization remains a host/dashboard responsibility; credentials are not stored in the v3 gameplay bundle.

## State replication boundary

The gameplay runtime continues to use its local persistence layer. In addition, `AIO_V3.operations` exposes a coalesced latest World Model replica for external durable storage. The replica keeps only the newest pending serialized state and is size-bounded. Serialization failures remain contained and visible in status instead of blocking gameplay.

A host may persist these replicas to a database/object store and maintain last-known-good backups. Import/reconciliation and schema migration remain separate future work; v3 must never blindly resume half-finished transactions from an external snapshot.

## External supervisor contract

`AIO_V3.operations.status().health` exposes freshness-oriented health information suitable for an external process supervisor:

- `HEALTHY`
- `WATCH`
- `DEGRADED`
- snapshot age
- runtime heartbeat age

The external host is responsible for detecting a dead browser/process and restarting it. Internal bot logic cannot recover if the whole browser process no longer exists.

Future supervisor work will add restart/reconnect reconciliation, but the interface is intentionally host-agnostic so the bot can later run under Docker, systemd, Kubernetes, a VM service, or another headless-browser supervisor.

## Dashboard design rule

The dashboard is a client of status, telemetry and command APIs. It must never contain authoritative combat, Merchant, Brain or safety logic. If the dashboard disappears, the bot continues according to its locally validated policy. If the bot disappears, the dashboard reports it as stale/offline rather than inventing state.
