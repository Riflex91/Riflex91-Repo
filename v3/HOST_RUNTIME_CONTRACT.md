# v3 External Host Runtime Contract

This document defines the Alpha.20.5 boundary between the Adventure Land gameplay bundle and an external headless host. It extends `HEADLESS_CONTRACT.md`; it does not grant new gameplay authority.

## Authority split

The gameplay runtime remains authoritative for combat, Merchant, party, travel, content safety, transaction reconciliation, leases, circuits and all raw Adventure Land actions. The external host may supervise the browser/process lifecycle and transport already-produced telemetry/alerts. It must not duplicate or replace gameplay policy.

The host-side modules therefore expose:

- `gameplayActionAuthority:false`
- `rawGameplayActionAuthority:false`
- process restart authority only after explicit operator acknowledgement
- no attack, move, `smart_move`, town, buy, sell, bank, transfer, upgrade, compound, party-transition or aura decision path.

A dashboard is a client of the same host/runtime surfaces. It is never the authoritative source of gameplay decisions.

## Public bot-to-host surface

The public browser bundle exposes the host contract under `AIO_V3.operations`:

- `hostHeartbeat()` returns the current `AIO_V3_HOST_WATCHDOG_BEACON`
- `pendingAlerts(limit)` reads pending bot alerts without mutating them
- `claimAlerts(ids)` marks only the exact persisted alert IDs as handed off
- `peekAlerts(limit)` is an observational alert view
- `acknowledgeAlert(id, options)` remains an explicit operator acknowledgement path
- `configureSafeRecovery(config)` and `safeRecoveryStatus()` expose the already-bounded gameplay-side safety-reduction layer.

The recommended host poll order is heartbeat first, then alert ingest. Host polling failure must not block the gameplay loop.

## Dead-man / process watchdog

`HostWatchdogSupervisor` validates every beacon before it can affect process supervision. A valid beacon must have the supported schema/type, a positive monotonic sequence within a run, an exact lease/deadline relation and a contract that explicitly says the host owns restart while the beacon carries no gameplay action authority.

A missed beacon deadline is unhealthy. The host applies a startup grace period and restart delay before a process restart can be considered. Automatic process restart is **default OFF** and can only be enabled with the exact acknowledgement:

`ALPHA20_5_HOST_RESTART`

Even after acknowledgement, restart authority is process-only. Restarts are bounded by a cooldown and a sliding-window budget. Budget exhaustion opens the host restart circuit instead of entering a restart loop. After a successful restart request, the supervisor discards the previous run/sequence and waits for a fresh beacon from the new process.

The host must not infer a successful gameplay recovery merely because a browser/process restart was requested. The restarted bot must reobserve current game state and let its deterministic subsystems reconcile persisted/nonterminal work under their existing safety rules.

## Durable alert handoff

The bot alert queue and external transport use a persist-before-claim handshake:

1. host calls `pendingAlerts(limit)` without mutating the bot queue;
2. host writes those alerts to its durable local spool;
3. only after the durable write succeeds, host calls `claimAlerts(ids)` with the exact persisted IDs;
4. external delivery proceeds from the host spool, independently of the bot process;
5. transport failure leaves the alert in the host spool for bounded retry/backoff.

This ordering prevents a transport/process failure between dequeue and persistence from silently losing a critical alert. If durable host persistence is unavailable, the relay must fail closed and must not claim new bot alerts.

The host relay never automatically acknowledges operator alerts. Bot/operator acknowledgement is a distinct action from transport delivery.

## Host persistence

`JsonFileStateStore` uses bounded JSON with temp-file write, fsync and atomic rename. The target file is restricted to mode `0600` where supported. Missing state may initialize an empty spool. Corrupt, oversized or unreadable existing state fails closed; the host must not overwrite a corrupt spool merely to resume delivery.

No credentials belong in the gameplay bundle or persisted alert payload. Email, push, WhatsApp or other provider credentials must come from the external host secret store/environment and be passed only to injected transport adapters.

## Transport policy

`AlertRelay` is provider-agnostic. Transports are injected functions with explicit severity routing. Delivery uses bounded exponential backoff and a bounded attempt count. The relay retains failed/uncompleted records and is capacity-bounded; it may prune completed records to make room, but it must not discard an undelivered record merely to claim a new bot alert.

Provider success means only that the host transport accepted the alert. It does not change bot state and does not acknowledge the incident on behalf of the operator.

## Deployment boundary

This Alpha.20.5 slice supplies the host-side supervision primitives, not a production deployment package. A real unattended deployment still requires a concrete headless-browser/process launcher, authenticated host API, durable host directory, provider adapters/secrets, service supervision and production observation.

The bot is not considered overnight-ready solely because these classes exist. Before the unattended overnight gate, the deployed stack must prove:

- live beacon/dead-man detection outside the browser process;
- bounded real process restart and restart-circuit behavior;
- durable alert handoff across host/browser restarts;
- at least one real critical alert delivery path plus a fallback path where required;
- no blind transaction/travel/party resume after restart;
- stable four-character liveness and reconciliation;
- no unexpected raw gameplay action during the reliability soak.
