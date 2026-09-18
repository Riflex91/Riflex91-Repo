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

- `hostHeartbeat()` returns the current `AIO_V3_HOST_WATCHDOG_BEACON`;
- `pendingAlerts(limit)` reads pending bot alerts without mutating them;
- `claimAlerts(ids)` marks only the exact persist-before-claim alert IDs as handed off;
- `reconciliationStatus()` returns bot-owned, observation-only restart reconciliation evidence;
- `peekAlerts(limit)` remains an observational operator/debug view;
- `acknowledgeAlert(id, options)` remains an explicit operator acknowledgement path;
- `configureSafeRecovery(config)` and `safeRecoveryStatus()` expose the already-bounded gameplay-side safety-reduction layer.

The external `BrowserBotClient` is deliberately narrower than the complete `AIO_V3.operations` object. It may dispatch only the first four host-contract methods above. It has no public generic `evaluate`, `invoke` or `call` surface.

The recommended host poll order is heartbeat first, then alert ingest. Host polling failure must not block the gameplay loop.

## Bot-owned reconciliation evidence

The host must never infer that gameplay state is safe merely because a browser process restarted or a new page loaded. `AIO_V3.operations.reconciliationStatus()` is computed inside the deterministic v3 runtime and always reports:

- `actionAuthority:false`;
- `rawGameplayActionAuthority:false`;
- an explicit bounded blocker list;
- `observedClean:true` only when the required runtime status surfaces are available and no unresolved active/recovering operation is observed.

The evidence currently fails closed for unresolved economy transactions, bank expansion, Merchant-space recovery, bank consolidation, travel, party-lifecycle work, a running Alpha.20 live gate and an active safe-recovery incident. Missing or throwing required status surfaces are blockers, not assumed-clean state.

The host may observe this result after a fresh run. It may not use the result to replay, resume or manufacture gameplay actions.

## Narrow browser bridge

`BrowserBotClient` accepts an injected Page/Frame-like execution context and exposes only:

- `hostHeartbeat()`;
- `pendingAlerts(limit)`;
- `claimAlerts(ids)`;
- `reconciliationStatus()`.

The browser execution context is kept private to the bridge. The in-page dispatcher is a hard-coded allowlist switch; arbitrary operation names such as attack, movement, Merchant actions or `smart_move` fail closed. Claim IDs, result sizes and pending-alert limits are bounded. Production origins are HTTPS-only and default to `https://adventure.land`.

Only one page evaluation may be in flight. If an evaluation reaches its timeout, the bridge reports the timeout but continues treating the underlying evaluation as in flight until it actually settles; this prevents a stalled browser context from accumulating parallel requests.

This bridge is a **contract adapter**. The production host pairs it with `CdpAdventureLandSessionDriver`, which attaches only to an explicitly configured loopback CDP endpoint, filters page targets to the configured Adventure Land origin, discovers an execution context that actually exposes the narrow `AIO_V3.operations` contract, and reconnects after bounded context/page loss. Step 11 adds a bounded startup-readiness window so normal Windows/browser/runtime boot time is absorbed inside one host-service start rather than consuming repeated Step-10 restart admissions. Login credentials remain outside the driver. The driver exposes no generic browser evaluation as a remote-control API.

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

Step 12's Windows production configuration injects exactly two required CRITICAL HTTPS transports whose hostnames must differ. A CRITICAL spool record is complete only after both required transports have accepted it; partial delivery remains durable and retryable. The explicit route canary exercises both routes independently but has neither operator acknowledgement nor gameplay authority.

Windows transport URL/header secrets are DPAPI-protected for `CurrentUser`, decrypted only into the Node host process and omitted from enumerable configuration/status surfaces. Chromium runs with an allowlisted Windows environment and does not inherit host-only API/alert/provider credentials.

Provider success means only that the host transport accepted the alert. It does not change bot state and does not acknowledge the incident on behalf of the operator.

## Production host harness boundary

Alpha.20.5 now includes a concrete **production host harness foundation** under `v3/host/**`:

- `ManagedProcessLauncher` for a bounded external process lifecycle with `shell:false`, graceful-stop timeout, forced-kill fallback and serialized restart;
- `HostApiServer` for authenticated, read-only, loopback-only host observability;
- `JsonFileStateStore` plus `AlertRelay` for durable persist-before-claim alert handoff;
- `createWebhookAlertTransport` as a host-secret-backed HTTPS transport adapter foundation;
- `HostWatchdogSupervisor` and `HeadlessHostController` for external dead-man supervision and bounded process-only restart authority;
- `RestartReconciliationObserver` for fresh-run, observation-only post-restart reconciliation evidence;
- `BrowserBotClient` for the four-method, origin-locked browser contract bridge;
- `ProductionHostHarness` for wiring those pieces together without adding gameplay authority.

`ProductionHostHarness` may receive a prebuilt `botClient`, an injected validated Page/Frame-like context, or the Step-9 loopback CDP session driver. Step 10 adds a Windows per-user Task Scheduler supervisor around this harness, including persisted crash-loop budgeting and graceful host shutdown. Step 11 adds dedicated-profile and bounded runtime-readiness bootstrap. Step 12 adds DPAPI-protected dual-route CRITICAL delivery and host/browser environment isolation. It remains intentionally **not a gameplay/login credential automation system**: username/password/2FA entry, production secret-manager integration, provider accounts and non-Windows service orchestration remain separate.

The concrete deployment and operating procedure is documented in `PRODUCTION_HOST_HARNESS.md`.

## Unattended certification evidence boundary

Step 13 adds a read-only certification consumer of the existing loopback host API. It does not add a fifth `BrowserBotClient` operation.

The host API may include the current `ProductionHostHarness.status()` result and an allowlisted last-beacon summary for certification. Those surfaces must remain observability-only and must not expose provider credentials, arbitrary browser evaluation or gameplay commands.

Certification evidence is append-only and SHA-256 chained. A later gate requires a hash-valid passed `FINAL` record from its immediate predecessor. Time elapsed without continuous healthy samples is insufficient.

The production sequence is `canary → 1h → 24h → 72h → 7d`. The canary requires independently successful dual-route CRITICAL delivery and a controlled process-recovery drill that proves a fresh run and observation-only reconciliation. 24h+ additionally requires an explicit SHA-256-linked operator review artifact for expected-vs-unexpected runtime actions, because the narrow host boundary intentionally does not gain arbitrary gameplay introspection.

## Remaining unattended-deployment requirements

Before the unattended overnight gate, the deployed stack must prove all of the following with real production evidence:

- the loopback CDP production session driver can supply the correct Adventure Land execution context to `BrowserBotClient` without exposing generic page-evaluation or gameplay authority;
- all four narrow bridge calls work against a real Adventure Land session, including bot-owned `reconciliationStatus()`;
- live beacon/dead-man detection continues outside the browser process;
- bounded real browser/process restart and restart-circuit behavior work under the Windows Task Scheduler + persistent host start circuit;
- after restart, a fresh run is observed and deterministic bot reconciliation completes before the host considers recovery clean;
- durable alert handoff survives host/browser restarts and corrupt/unavailable persistence fails closed;
- both independently hosted CRITICAL alert routes are canary-tested and a real durable alert is observed on both routes;
- credentials are host-side only and are absent from the browser bundle, alert payloads and read-only API surfaces;
- stable Merchant + three-combat-character liveness is maintained through the reliability observation;
- no blind transaction, travel or party resume occurs after restart;
- no unexpected raw gameplay action occurs during the reliability soak.

The existence of the host classes, narrow browser bridge, Step-13 certification engine or a green synthetic soak alone does **not** make the bot overnight-ready. Restart authority remains default-off until the deployment canary explicitly enables `ALPHA20_5_HOST_RESTART`.
