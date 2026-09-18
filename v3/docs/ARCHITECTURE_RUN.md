# Architecture Run Playbook

This document is the canonical execution contract for the keyword **`architektur-run`**.

When the keyword is given, the agent must not restart the migration blindly. It must first inspect this playbook, `v3/architecture-run.json`, the current `main` branch, and open pull requests, then continue from the first incomplete step.

## Goal

Consolidate the v3 runtime architecture without losing existing behavior, reliability fixes, live safety gates, observability, or public runtime compatibility.

The migration order is fixed:

1. Patch registry
2. Game command boundary
3. Complete command migration
4. Merchant mluck rotation
5. Shared utilities and hot-path cleanup
6. Absorb reliability hotfixes into owning modules
7. Remove the hotfix layer
8. Replace runtime inheritance with composition
9. Add the production Adventure Land browser/session driver

## Global execution rules

- Work strictly in step order. Do not start a later step while an earlier step is incomplete or red.
- Before changing code, inspect current `main`, open PRs, and the manifest status.
- Resume an existing architecture-run PR before opening another PR for the same step.
- Each step must be independently mergeable and revertible.
- Preserve behavior first; structural cleanup comes second.
- Never remove a reliability fix just because its hotfix wrapper is removed. Move the behavior into its owning module and keep or migrate the regression test.
- Do not centralize domain authority into `GameAdapter`. The adapter owns the technical live/shadow execution boundary only. Supervisor state, action budgets, merchant authorization, circuit breakers, persistence-before-action and other business/safety gates remain domain responsibilities.
- Any new Adventure Land write/mutation path must go through the command boundary after steps 2-3.
- Multiple decorators on the same method are allowed only with deterministic order. Multiple exclusive owners/replacements of the same method are an error.
- Do not introduce new alpha inheritance layers while this run is active.
- Keep `src/index.js` as the stable facade during the composition migration unless a step explicitly requires a backwards-compatible facade change.
- A failed validation stops the run at that step. Fix the failure before proceeding.

## Standard run algorithm

When `architektur-run` is invoked:

1. Read this file and `v3/architecture-run.json` from `main`.
2. Inspect open PRs whose branch/title belongs to `architecture-run` or one of the step branch names.
3. Reconcile manifest state with repository reality:
   - merged PR = completed;
   - open PR = in_progress;
   - no PR/branch and not completed = pending.
4. Select the lowest numbered non-completed step.
5. If that step has an open PR, continue it. Otherwise create its branch from current `main`.
6. Make the smallest safe commits for the step.
7. Run step-specific tests plus repository guards.
8. If green, update the manifest status and PR description/checklist.
9. Do not advance to the next step until the current PR is merged, unless the user explicitly asks to prepare later steps without implementation.

## Validation policy

For each implementation commit, run the directly affected tests and the static/logic checks that cover the changed boundary.

Before a step PR is considered ready to merge, run the repository preflight/check commands currently defined in `v3/package.json`. The manifest records the expected commands, but `package.json` is authoritative if scripts change later.

A step is complete only when:

- implementation and regression tests are present;
- relevant targeted tests pass;
- architecture/static guards pass;
- the PR is merged to `main`;
- `v3/architecture-run.json` reflects completion.

## Step 1 — Patch registry

**Branch:** `architecture/01-patch-registry`

Create a central patch registry, preferably under `v3/src/core/patch-registry.js`.

Required behavior:

- registry metadata includes module id, target method, patch kind (`decorate` or exclusive owner), and deterministic ordering metadata;
- two exclusive owners for the same method fail loudly;
- multiple decorators are allowed only when their order can be resolved;
- direct monkey-patching outside the approved mechanism is guarded against where practical;
- migrate representative existing patches first, including farmer local plan priority and live navigation.

Add dedicated registry tests and preserve existing navigation/farmer regression tests.

## Step 2 — Game command boundary

**Branch:** `architecture/02-game-command-boundary`

Make `GameAdapter` the single technical execution boundary for Adventure Land write commands.

Start by migrating merchant writes that currently call raw game APIs directly, including stand control and item delivery. Extend the adapter command catalog/allowlist in a structured way.

Keep domain-specific preflight gates in their domain modules. Remove only duplicated live/shadow execution checks that are genuinely replaced by the adapter boundary.

Add active/shadow tests for every newly migrated command.

## Step 3 — Complete command migration

**Branch:** `architecture/03-command-migration`

Search production source for remaining direct mutating Adventure Land API calls and migrate them through the adapter command boundary.

Add a static or logic guard preventing new direct calls to the protected mutation APIs from production modules.

Only after a mutation path uses the adapter may redundant local `mode === active` checks be removed.

## Step 4 — Merchant mluck rotation

**Branch:** `architecture/04-merchant-mluck`

Implement mluck as a composed merchant service/policy, not as another hotfix.

Expected behavior:

- inspect current party/snapshot state;
- prioritize missing or soon-expiring mluck;
- skip invalid/dead/unreachable targets;
- respect cooldown/resource/range constraints;
- execute through `adapter.command('use_skill', ['mluck', targetId])`;
- avoid buff spam and provide observable status/reasons.

Test active/shadow behavior and deterministic rotation across the active party topology.

## Step 5 — Shared utilities and hot paths

**Branch:** `architecture/05-runtime-hotpath`

Introduce small pure shared utilities for numeric and geometric helpers where duplication is clear (`finite`, `ratio`, `clamp01`, `distance`).

Do not merely centralize JSON deep clone calls in tick paths. Remove unnecessary deep clones from hot paths; keep cloning at persistence/diagnostic/API boundaries where isolation is required.

Replace repeated linear entity lookup with a snapshot-scoped entity index/map. Do not create a long-lived stale entity cache.

This step must not intentionally change domain decisions.

## Step 6 — Absorb reliability hotfixes

**Branch:** `architecture/06-absorb-reliability`

Move proven reliability behavior into the modules that own the behavior.

Suggested migration groups:

- farmer/navigation: live navigation, local plan priority, target efficiency, travel/terrain, resource topoff;
- party/combat/logistics: focus fire, cohesion/deadlock, controlled logistics, area pressure, persistence quota;
- content/persistence/bootstrap: content drift, dangerous content, account communication, bootstrap gates/discovery.

Compatibility wrappers may remain temporarily within this PR while behavior is moved, but the regression tests must follow the behavior into its permanent home.

## Step 7 — Remove hotfix layer

**Branch:** `architecture/07-remove-hotfix-layer`

Remove obsolete hotfix installers/wrappers after their behavior is owned by normal modules.

Simplify the farm-readiness runtime constructor/tick wiring and strengthen architecture rules so normal domain modules do not reintroduce dependency on the old reliability patch layer.

Keep permanent regression tests for the former hotfix bugs.

## Step 8 — Runtime composition

**Branch:** `architecture/08-runtime-composition`

Replace the alpha runtime inheritance chain incrementally with a composition root while maintaining a stable public facade.

Recommended order inside the step:

1. introduce composition root and lifecycle contract;
2. compose game/stability services;
3. compose merchant/economy/travel;
4. compose farmer/party/reliability services;
5. route public status/lifecycle methods through the facade;
6. remove obsolete alpha inheritance layers;
7. replace `StabilityGameAdapter extends GameAdapter` with composed tracking/guard services where practical.

Add API/status parity tests before deleting the old chain.

## Step 9 — Production browser/session driver

**Branch:** `architecture/09-production-browser-session`

Add the concrete host-side browser/session layer required for unattended operation without widening gameplay authority.

Required behavior:

- connect only to an explicitly configured loopback CDP endpoint;
- discover only page targets whose origin matches the configured Adventure Land origin;
- locate an allowed same-origin execution context that actually exposes the narrow `AIO_V3.operations` contract;
- reconnect with bounded retry/backoff after navigation, execution-context loss or page replacement;
- provide the validated execution context to the existing `BrowserBotClient` without exposing generic browser evaluation as a public host API;
- integrate with `ProductionHostHarness` lifecycle and observability;
- keep automatic process restart authority separate/default-off;
- add synthetic recovery and soak tests for target replacement, wrong-origin rejection, missing operations and bounded reconnect behavior.

This step does not add login credentials, public CDP exposure, arbitrary remote evaluation, gameplay action authority, or OS service installation.

## Step 10 — Windows host autostart and machine-reboot recovery

**Branch:** `architecture/10-production-host-service`

Make the existing production host harness recover automatically on the user's Windows gaming machine without turning the browser host into a Windows Session-0 service.

Required behavior:

- add a bounded Windows host supervisor around `ProductionHostHarness`;
- persist service start attempts/circuit state outside the browser process so crash loops remain bounded across host-process and machine restarts;
- run through Windows Task Scheduler in the interactive user session, because the Adventure Land browser/profile must remain in that user's desktop/profile context;
- launch the browser through the existing managed launcher, then let the Step-9 loopback-CDP session discover the Adventure Land runtime;
- provide graceful Ctrl+C/SIGINT/SIGTERM shutdown through the existing bounded harness stop path;
- install a per-user scheduled task with logon autostart, bounded restart attempts/interval, single-instance behavior and no generic shell/remote-control surface;
- keep persistent state under a dedicated per-user Windows data directory;
- keep secrets outside repository/config/status payloads;
- fail closed on corrupt persistent supervisor state or invalid production configuration;
- add crash-loop/start-budget/clean-shutdown/restart tests and a long supervisor soak;
- preserve `gameplayActionAuthority:false` and `rawGameplayActionAuthority:false`.

This step does not add cold-boot Adventure Land credential automation, public CDP access, arbitrary browser evaluation, remote shell access, systemd/Linux deployment or gameplay policy to the host.

## Step 11 — Windows Adventure Land session bootstrap and profile readiness

**Branch:** `architecture/11-windows-session-bootstrap`

Make Windows reboot/logon recovery tolerant of normal Chromium + Adventure Land + AIO runtime startup time without burning the Step-10 service restart budget.

Required behavior:

- add a bounded CDP startup window that waits for the actual same-origin `AIO_V3.operations` runtime before declaring service startup failed;
- poll inside the existing Step-9 session driver instead of restarting the whole host for every not-yet-ready page;
- expose startup state, attempts, deadline and timeout reason for diagnostics;
- require the Windows production configuration to use a dedicated persistent `--user-data-dir` and a remote-debugging port matching the configured loopback CDP endpoint;
- keep the browser profile persistent across Windows reboots so normal Adventure Land cookies/session data can survive;
- fail closed after the bounded startup window if the profile is logged out, the runtime never appears or CDP configuration is invalid;
- never store or inject Adventure Land username/password credentials;
- add delayed-runtime, timeout, profile-validation and restart-budget regression tests.

This step does not bypass Adventure Land login, automate passwords/2FA, expose CDP remotely or add gameplay authority.

## Step 12 — Production CRITICAL alerting and Windows host secrets

**Branch:** `architecture/12-production-alerting-windows-secrets`

Turn the existing durable alert relay into a Windows production alert path without exposing provider credentials to the browser/runtime.

Required behavior:

- configure two independently hosted HTTPS CRITICAL alert routes for production redundancy;
- store the complete transport secrets outside `host.json`, protected with Windows DPAPI `CurrentUser`;
- decrypt secrets only into the Windows host process environment and remove the parent PowerShell environment value after the child exits;
- build transports from a strict allowlisted secret schema, with bounded headers/values and no Host/Cookie/connection-control header injection;
- require distinct route hostnames when production critical alerting is enabled;
- pass both routes as required CRITICAL transports into the existing persist-before-claim `AlertRelay`;
- keep durable spool records pending until both required routes have accepted the alert, so a partial outage cannot silently look complete;
- provide an explicit canary command that exercises each route independently without acknowledging any gameplay/operator alert;
- expose route health/status without URL, header values or credentials;
- preserve bounded retry/backoff and fail closed if durable persistence or secret configuration is unavailable.

This step does not add gameplay authority, operator acknowledgement authority, public alert endpoints, remote shell access or Adventure Land credentials.

## Step 13 — Windows production canary and unattended certification

**Branch:** `architecture/13-windows-production-certification`

Turn the completed Windows production stack into a machine-verifiable staged 24/7 certification path.

Required behavior:

- add local read-only certification sampling over the authenticated loopback host API only;
- persist append-only, hash-chained evidence under the existing per-user Windows host-state directory;
- define ordered gates: canary → 1h → 24h → 72h → 7d;
- require healthy browser/session discovery, watchdog liveness, four-character group readiness, durable alert health and zero host/browser gameplay authority at every accepted sample;
- expose enough read-only host status to certify the Step-9 session and the last accepted beacon without adding a fifth browser operation;
- require explicit evidence for a controlled browser/process interruption followed by fresh-run reconciliation before the canary can pass;
- require an independently successful Step-12 dual-route alert canary before unattended promotion;
- never infer success from elapsed time alone: missed samples, unhealthy intervals, open restart circuits, blocked reconciliation or unresolved CRITICAL alert state fail the gate;
- keep certification evidence free of API tokens, alert credentials, cookies and browser secrets;
- provide Windows commands to start/status/finalize each gate and resume evidence collection after collector restart;
- add deterministic short-duration tests for all production-duration gate rules plus corruption/tamper detection.

Real wall-clock 1h/24h/72h/7d observations must be collected on the deployed Windows machine; CI validates the certification engine and safety invariants, not production uptime itself.

## Status and checkpoints

`v3/architecture-run.json` is the machine-readable checkpoint. Every architecture-run PR must update it only for facts that are true in that PR/branch.

Statuses:

- `pending`: not started on main;
- `in_progress`: an implementation PR exists;
- `blocked`: implementation exists but a known validation or design blocker prevents completion;
- `completed`: merged into main and validated.

The `next_step` field should be the lowest numbered step that is not `completed` on `main`.

## Completion condition

The architecture run is finished when all defined steps are `completed`, the full repository check is green, no obsolete architecture-run hotfix/patch layer remains, and new features can be implemented without extending the old alpha inheritance chain.
