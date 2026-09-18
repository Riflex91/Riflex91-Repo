# Windows production host

This directory installs the v3 `ProductionHostHarness` as a bounded per-user Windows background task.

## Why Task Scheduler instead of a Windows Service

Adventure Land runs in a normal Chromium-family browser profile. A classic Windows Service runs in Session 0 and is intentionally isolated from the interactive desktop. Step 10 therefore uses a **per-user scheduled task triggered at logon**, so browser/profile ownership stays with the same Windows user that owns the Adventure Land session.

This still provides machine-reboot recovery: after Windows restarts and the user signs in, the host task starts automatically. Cold-boot login automation is deliberately outside Step 10.

## Install

Run PowerShell as the Windows user that owns the Adventure Land browser profile:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\ops\windows-host\install.ps1 -RepoPath C:\path\to\repo
```

The installer:

- detects Brave, Edge or Chrome;
- creates `%LOCALAPPDATA%\AioBot\host-service`;
- creates a dedicated browser profile at `%LOCALAPPDATA%\AioBot\browser-profile`;
- creates a 96-character random host API token and stores it encrypted with Windows DPAPI for **CurrentUser**;
- writes non-secret host configuration to `host.json`;
- registers `AioV3ProductionHost` with an **AtLogOn** trigger for the current user;
- configures one instance only and at most three Task Scheduler restarts, two minutes apart;
- starts the task immediately.

The v3 host adds a second independent persistent start budget: by default no more than four service starts in ten minutes. Exhaustion opens a 15-minute circuit stored on disk, so repeated task/process starts cannot become an unbounded crash loop.

## Runtime order

1. Windows Task Scheduler starts `run.ps1` in the interactive user session.
2. `run.ps1` decrypts the host API token and, when enabled, the DPAPI alert bundle only for the Node host process.
3. `windows-host-service.js` validates `host.json` and persistent supervisor state.
4. `ProductionHostHarness` starts the dedicated browser with `shell:false`.
5. Step 11 gives the dedicated profile/browser up to five minutes to expose the real same-origin `AIO_V3.operations` runtime, polling every two seconds without restarting the whole service.
6. Once ready, host heartbeat, reconciliation, durable alerts and the read-only loopback API start.
7. SIGINT/SIGTERM shuts the harness and browser down through the bounded stop path.

## Safety boundaries

The Windows host has no gameplay policy and reports both `gameplayActionAuthority:false` and `rawGameplayActionAuthority:false`. CDP remains loopback-only. The scheduled task exposes no remote shell and no generic browser-evaluation API. DPAPI-protected host/API/alert secrets are not written to `host.json`, logs, GitHub or runtime status and are not inherited by Chromium.

Automatic browser-process restart inside the host watchdog remains disabled by default. The Task Scheduler restart policy and persistent host start circuit are service-lifecycle controls only.

## Production CRITICAL alerting

Step 12 keeps alert provider secrets outside `host.json` and outside the browser process.

Configure two independently hosted HTTPS routes:

```powershell
.\ops\windows-host\configure-alerts.ps1
```

The script prompts without echo for the primary/fallback webhook URLs and optional `Authorization` header values, verifies that the route hostnames differ, and stores the complete secret bundle at `%LOCALAPPDATA%\AioBot\host-service\alert-secrets.dpapi` encrypted with DPAPI **CurrentUser**. It then enables `criticalAlertingEnabled` in the non-secret host configuration.

Run the explicit route canary before unattended operation:

```powershell
.\ops\windows-host\test-alerts.ps1 -RepoPath C:\path\to\repo
```

The canary sends an operator-initiated `HOST_ALERT_ROUTE_CANARY` independently to both configured routes. It does not acknowledge any bot/operator incident and has no gameplay authority.

For real CRITICAL alerts, both routes are required. The existing durable `AlertRelay` persists before claiming from the bot and keeps a record pending until both routes have accepted it. A partial provider outage therefore remains visible and is retried with bounded backoff instead of silently completing.

Host-only API/alert/diagnostics credentials are not inherited by Chromium. The Windows host launches the browser with a small allowlisted Windows environment instead of the Node host environment.

## Unattended certification

Step 13 adds a local, hash-chained production evidence path. See `v3/WINDOWS_UNATTENDED_CERTIFICATION.md` for the complete contract.

The gate order is `canary → 1h → 24h → 72h → 7d`. The canary performs the dual-route CRITICAL alert test and a controlled browser termination/restart/reconciliation drill before the stable timer starts. Later gates require a passed hash-valid predecessor.

Start the first gate with:

```powershell
.\ops\windows-host\start-certification.ps1 -RepoPath C:\path\to\repo -Gate canary -RestartAck ALPHA20_5_HOST_RESTART -Reset
```

Evidence remains local under `%LOCALAPPDATA%\AioBot\host-service\certification`. GitHub CI validates the collector implementation only; real 24h/72h/7d certification must come from the deployed Windows machine.

## Uninstall

```powershell
.\ops\windows-host\uninstall.ps1
```

Add `-DeleteState` only when the persistent host state, alert spool and encrypted token should also be deleted.

## Current limitation

The dedicated browser profile persists across Windows reboots. Step 11 waits through normal browser/page/runtime startup, but it never stores or enters Adventure Land username/password credentials. If the persisted session is no longer valid, the runtime-readiness window expires fail-closed and Step 10's bounded service circuit applies. After a full Windows reboot the task resumes automatically **after that Windows user logs in**.
