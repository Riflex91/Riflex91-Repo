# Alpha.20.5 Production Host Harness

This document is the operating contract for the Alpha.20.5 external host harness. The harness supervises process liveness, exposes read-only host status and transports bot-generated alerts. It does **not** decide or execute Adventure Land gameplay.

## Safety boundary

The host must remain outside the gameplay authority boundary:

- `gameplayActionAuthority:false`
- `rawGameplayActionAuthority:false`
- no attack, movement, `smart_move`, town, Merchant transaction, party transition or aura command path
- no policy that converts host health, dashboard input or transport state into a new gameplay action
- no blind replay of work after restart.

A process restart is not gameplay recovery. After a restart, the new browser run must reobserve the world and the existing deterministic v3 subsystems must reconcile their own persisted state.

## Narrow browser bot client

`BrowserBotClient` is now the canonical host-side adapter for an already validated Adventure Land Page/Frame-like execution context. It exposes exactly four asynchronous methods:

- `hostHeartbeat()` — return the current host watchdog beacon;
- `pendingAlerts(limit)` — return pending bot alerts without mutation;
- `claimAlerts(ids)` — claim only the exact IDs that the host has already persisted durably;
- `reconciliationStatus()` — return bot-owned, observation-only post-restart reconciliation evidence.

The adapter has no public generic `evaluate`, `invoke` or `call` method. Its in-page dispatcher contains a hard-coded allowlist for those four operations only. Claim IDs, results, pending-alert limits and execution time are bounded; the production origin defaults to `https://adventure.land`.

`ProductionHostHarness` may receive an existing `botClient`, or it may construct `BrowserBotClient` from `browserPage`, `browserFrame` or `browserContext`. Supplying the execution context is still the responsibility of a later production browser/session driver.

A bridge timeout is fail-closed. The underlying page evaluation remains marked in flight until it actually settles, preventing a stalled page from accumulating parallel host requests.

## Bot-owned restart reconciliation

`AIO_V3.operations.reconciliationStatus()` is computed inside the gameplay runtime. It always declares zero action authority and fails closed if required runtime status surfaces are unavailable or if unresolved work is observed.

The host may use this evidence only to decide whether post-restart observation is clean. It must not translate blockers or a clean result into gameplay commands, blind retries or replayed transactions.

## Process launcher

Configure `ManagedProcessLauncher` with a concrete executable plus an argument array:

- `command`: executable path;
- `args`: bounded argument array;
- `cwd`: optional working directory;
- `env`: host-side environment values;
- `stopGraceMs`: bounded graceful shutdown period;
- `outputCapacity`: bounded in-memory stdout/stderr tail.

The launcher always uses `shell:false` and `detached:false`. Do not pass a shell command string containing redirection, pipes, chained commands or embedded secrets.

Shutdown is SIGTERM first and SIGKILL only after the bounded grace period. The returned `forced` field describes the **current stop attempt**; cumulative historical forced kills remain available only in launcher statistics.

## Read-only host API

`HostApiServer` is deliberately limited to loopback addresses. Production configuration requires:

- `apiHost` = `127.0.0.1`, `::1` or another explicitly supported loopback representation;
- a strong bearer token supplied from the host secret store/environment;
- no credential embedded in the gameplay bundle or repository configuration.

The API is observability-only. Risk-increasing control endpoints are not part of this slice.

If remote dashboard access is needed later, terminate authentication/TLS in a separately hardened local gateway or tunnel rather than binding the host API directly to a public interface.

## Durable alert state

Set `alertStatePath` to a host-owned persistent directory that survives browser restarts. The directory should be accessible only to the service account running the host.

Alert handoff order is mandatory:

1. read pending bot alerts;
2. persist them to the host spool;
3. verify the durable write succeeded;
4. claim those exact bot alert IDs;
5. deliver from the host spool;
6. retain failed delivery records for bounded retry/backoff.

If existing durable state is corrupt, unreadable or oversized, ingestion fails closed. Do not delete or overwrite the spool automatically to make the service appear healthy.

## Alert transports

`createWebhookAlertTransport` provides the first transport adapter foundation. Production destinations must use HTTPS. Provider tokens, email credentials, push keys and similar secrets belong only in the external host environment or secret manager.

Transport acceptance does not acknowledge an incident on behalf of the operator. Alert acknowledgement remains a separate explicit bot/operator action.

At least one real CRITICAL delivery route must be canary-tested before the unattended overnight gate. If the reliability policy requires a fallback channel, the fallback must be independently configured and tested rather than sharing the same single point of failure.

## Restart authority

Automatic restart is **default OFF**. Enabling it requires the exact acknowledgement:

`ALPHA20_5_HOST_RESTART`

Even then, authority is limited to restarting the managed external process. The watchdog enforces startup grace, missed-deadline handling, restart delay, cooldown and a sliding restart budget. Exhausting that budget opens the restart circuit instead of looping.

After a restart the controller waits for a fresh run ID. `RestartReconciliationObserver` then consumes only observation-only bot reconciliation evidence. Evidence claiming gameplay authority is invalid and blocks clean recovery.

## Remaining production browser/session driver

The narrow browser contract adapter now exists, but the host still needs a concrete deployment-specific browser/session driver. That later component must:

- launch or attach to the intended supported browser/session;
- identify the correct Adventure Land page and, if applicable, frame;
- reject unrelated pages/origins instead of evaluating them;
- survive bounded navigation/reconnect/page-close events;
- handle the chosen login/session bootstrap strategy without putting credentials into the bot bundle;
- provide the validated Page/Frame-like context to `BrowserBotClient`;
- expose no unauthenticated or generic remote browser-evaluation surface.

A Playwright, Puppeteer, CDP or equivalent implementation is an implementation choice of that driver, not part of the gameplay bundle and not a source of gameplay authority.

## Safe deployment sequence

A production canary should follow this order:

1. Provision a dedicated service account, durable host-state directory and secret source.
2. Install/pin the intended browser executable and construct the argument array without shell evaluation.
3. Configure the production browser/session driver and bind its validated Adventure Land Page/Frame to `BrowserBotClient`; verify no generic evaluation surface is exported.
4. Verify all four narrow calls against the real page while restart authority remains disabled.
5. Configure the loopback API with a strong host-only bearer token.
6. Configure alert transports from host secrets; keep restart authority disabled.
7. Start `ProductionHostHarness` and verify a fresh valid heartbeat plus stable polling.
8. Verify persist-before-claim alert handoff with a non-destructive test alert and restart the browser to prove spool survival.
9. Verify bot-owned `reconciliationStatus()` stays observation-only and that no blind resume occurs.
10. Exercise a controlled browser/process failure while restart authority is still operator-controlled; verify bounded detection and diagnostics.
11. Only after the canary is clean, explicitly enable `ALPHA20_5_HOST_RESTART` and exercise one bounded restart→fresh-run→reconcile cycle.
12. Confirm restart budget/circuit behavior and critical-alert delivery before any unattended overnight gate.

## Shutdown

A normal host shutdown must stop the polling interval, close the loopback API and stop the managed process through the bounded launcher path. A previous forced shutdown must not cause a later graceful shutdown to be reported as forced.

Pending durable alerts are not discarded merely because the browser process stops. They remain host-owned until delivery policy completes or an operator handles the incident.

## Not included in this slice

The following remain separate work and must not be inferred from the existence of the harness or `BrowserBotClient`:

- concrete production Playwright/Puppeteer/CDP-or-equivalent session driver, page/frame discovery and Adventure Land login/session boot handling;
- OS service definitions such as systemd/Windows Service/container orchestration and machine reboot recovery;
- production secret-manager integration;
- provider-specific email/WhatsApp/push account setup and fallback routing;
- remote dashboard exposure/authentication;
- automatic updater/install/rollback;
- real unattended production certification.

## Overnight gate prerequisites

Do not call the stack overnight-ready until a real deployment has demonstrated:

- Merchant + three combat characters remain fresh and reconciled;
- the production browser/session driver consistently selects only the intended Adventure Land context;
- all four narrow bridge calls work over a long real session without generic browser authority;
- external dead-man detection works when the browser is actually unavailable;
- exactly bounded process restarts, with restart circuit behavior verified;
- fresh-run reconciliation after restart and zero blind resume;
- durable alert survival through browser/host interruption;
- a real critical alert reaches the intended operator route;
- no open critical circuits or unresolved transactions/recoveries at gate start;
- no unexpected raw gameplay action during the reliability observation.

Synthetic tests and host soaks are necessary certification evidence for the code slice, but they do not replace this real deployment gate.
