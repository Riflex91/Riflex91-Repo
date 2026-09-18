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
2. `run.ps1` decrypts the API token into the child process environment only.
3. `windows-host-service.js` validates `host.json` and persistent supervisor state.
4. `ProductionHostHarness` starts the dedicated browser with `shell:false`.
5. Step 9 discovers the Adventure Land runtime through loopback CDP.
6. Host heartbeat, reconciliation, durable alerts and the read-only loopback API start.
7. SIGINT/SIGTERM shuts the harness and browser down through the bounded stop path.

## Safety boundaries

The Windows host has no gameplay policy and reports both `gameplayActionAuthority:false` and `rawGameplayActionAuthority:false`. CDP remains loopback-only. The scheduled task exposes no remote shell and no generic browser-evaluation API. The DPAPI token is not written to `host.json`, logs, GitHub or runtime status.

Automatic browser-process restart inside the host watchdog remains disabled by default. The Task Scheduler restart policy and persistent host start circuit are service-lifecycle controls only.

## Uninstall

```powershell
.\ops\windows-host\uninstall.ps1
```

Add `-DeleteState` only when the persistent host state, alert spool and encrypted token should also be deleted.

## Current limitation

The dedicated browser profile must already contain a valid Adventure Land login/session. Step 10 does not automate credentials or bypass login. After a full Windows reboot the task resumes automatically **after that Windows user logs in**.
