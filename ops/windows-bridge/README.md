# AIO Bot Windows Bridge

Native Windows desktop app for the Adventure Land v3 observability and local configuration path:

```text
Adventure Land v3 (Brave/Edge/Chrome)
        ↑ fixed same-origin CDP configuration handoff
AIO Bot Windows Bridge
        ├─ authenticated HTTPS → Supabase → ChatGPT signal/watch path
        ├─ local bounded problem diagnostics → Supabase problem mirror
        ├─ fixed Cloudflare Webinterface profile sync
        └─ DPAPI-protected Backblaze credentials → bot runtime memory
```

The app has **no gameplay authority** and no generic JavaScript, shell, movement, combat, Merchant, update, FTP, or remote-command endpoint. Telemetry evaluates only the fixed v3 debug expressions required for status and telemetry. Profile configuration is restricted to fixed same-origin Adventure Land contexts.

## What the app does

- detects an already running local Brave/Edge/Chrome DevTools endpoint;
- can start a dedicated local Brave/Edge/Chrome profile automatically;
- selects only an `https://adventure.land` page;
- reads the existing `AIO_V3.operations` debug surfaces;
- uploads bounded telemetry batches to the existing `bot-debug-ingest` Supabase Edge Function;
- keeps the event cursor durable and advances it only after a successful Supabase response;
- keeps important problem diagnostics locally bounded and mirrors accepted bundles to Supabase;
- provides a visible **TELEMETRIE AN/AUS** switch;
- provides a separate **SIGNALE AN/AUS** switch for the Supabase ChatGPT signal gate;
- securely provisions the dedicated browser profile for the existing Cloudflare Webinterface;
- securely stores Backblaze B2 `keyID` and `applicationKey` with Windows DPAPI;
- hands a fixed Backblaze configuration to the bot runtime;
- reconnects automatically with bounded exponential backoff;
- shows browser, bot, Supabase, Webinterface, Backblaze handoff, last-upload and error status.

Turning telemetry off stops Windows→Supabase uploads. It does not stop the Adventure Land bot and does not weaken any bot safety gate. Turning ChatGPT signals off is independent.

## Backblaze B2 for the bot

The Windows app contains a **Backblaze B2 für den Bot** section. The current non-secret defaults are:

```text
Endpoint: https://s3.eu-central-003.backblazeb2.com
Region:   eu-central-003
Bucket:   al-aio-bot
Prefix:   v4
```

Backblaze handoff defaults to enabled. On first setup, enter the Backblaze **Application Key ID (`keyID`)** and **Application Key** and choose **Speichern & an Bot senden**. These two credentials are stored together in a Windows-DPAPI-protected file for the current Windows user. They are never written to `settings.json`, `bridge-status.json`, GitHub, or Supabase telemetry.

The Bridge does **not** use the credentials to upload to Backblaze itself. Instead it injects the fixed configuration into allowed Adventure Land execution contexts as:

```text
globalThis.AIO_V3_BACKBLAZE_CONFIG
```

The object contains:

```text
schemaVersion
provider = backblaze-b2
endpoint
region
bucket
prefix
keyId
applicationKey
```

The config is placed in browser runtime memory only. It is **not stored in browser LocalStorage** by this feature. The Bridge reapplies it when it connects or reconnects to the dedicated Adventure Land profile. Deleting the credentials in the Windows app removes the DPAPI file, disables handoff, and clears the runtime global when the browser is reachable.

Use only a Backblaze Application Key restricted to the intended bucket and required capabilities. Do not use a master key.

Optional one-time import variables:

```text
AIO_V4_BACKBLAZE_KEY_ID
AIO_V4_BACKBLAZE_APPLICATION_KEY
```

If both are set and no DPAPI credential file exists, the Bridge imports them into DPAPI storage.

## Problem diagnostics without FTP

FTP/bplaced has been removed from the Windows Bridge. Important ERROR/CRITICAL and selected problem WARN events are still captured as sanitized gzip bundles in the bounded local spool:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\Diagnostics\
  latest-problem.json
  pending\
    problem-<timestamp>-<hash>.json.gz
    problem-<timestamp>-<hash>.json.gz.meta.json
  mirror-pending\
    mirror-<bundle-id>.json
```

Secret-like keys are redacted before serialization, including passwords, tokens, credentials, `applicationKey`, access keys, and key IDs. When the existing Supabase problem-diagnostics endpoint accepts a mirrored bundle, local cleanup is best effort. If Supabase is unavailable or the payload is too large, bounded local data remains available rather than affecting gameplay.

## Webinterface / Cloudflare profile sync

The Bridge intentionally uses its own Chromium profile instead of attaching remote debugging to the operator's normal browser profile. A fresh Bridge profile would otherwise be missing both the Webinterface write key and `cloud.enabled`.

The app fixes this without copying the normal browser profile:

1. the operator enters the existing Webinterface write key once in the Windows app, or sets `AIO_V3_WEB_DASHBOARD_WRITE_KEY`;
2. the key is stored in a per-user Windows DPAPI file;
3. once the dedicated browser is reachable, the app writes only the fixed AIO-v3 Cloudflare configuration to the Adventure Land origin;
4. it sets `cloud.enabled=true` while preserving unrelated control-plane settings;
5. if the protected write key is deleted, missing, unreadable, or Web Dashboard sync is disabled, the Bridge removes the Cloudflare credential from the dedicated profile and sets `cloud.enabled=false` fail-closed.

The only browser storage keys maintained by the Webinterface feature are:

```text
aio-v3:cloud-control:v1
aio-v3:control-plane-config:v1
```

The default Webinterface endpoint is:

```text
https://aio-bot-dashboard.hansijuergenlul.workers.dev
```

## Supabase connection

The Supabase project endpoint and current bot ID are preconfigured. The bearer token is intentionally **not** in GitHub and is never written to logs or status files.

On startup the app:

1. checks its DPAPI-protected token store;
2. if empty, checks `AIO_V3_DEBUG_TELEMETRY_TOKEN`;
3. if that variable contains a valid token, imports it automatically into the per-user DPAPI store;
4. otherwise lets the operator paste the token once in the app.

## Local files

```text
%APPDATA%\AioBotWindowsBridge\settings.json
%APPDATA%\AioBotWindowsBridge\telemetry-token.dpapi
%APPDATA%\AioBotWindowsBridge\web-dashboard-write-key.dpapi
%APPDATA%\AioBotWindowsBridge\backblaze-credentials.dpapi
%APPDATA%\AioBotWindowsBridge\bridge-state.json
%APPDATA%\AioBotWindowsBridge\bridge-status.json
```

The dedicated browser profile is under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\BrowserProfile
```

## Config migration

Config version 5 removes the old FTPS/bplaced settings from `settings.json`. Loading an older Bridge config migrates it to version 5; obsolete FTPS fields are not written back. The old FTP library and FTPS credential store are no longer part of the Windows Bridge project.

## Build

```powershell
dotnet restore .\ops\windows-bridge\AioBotWindowsBridge.csproj
dotnet build .\ops\windows-bridge\AioBotWindowsBridge.csproj -c Release --no-restore
dotnet publish .\ops\windows-bridge\AioBotWindowsBridge.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o .\artifacts\windows-bridge
```

Run:

```powershell
.\artifacts\windows-bridge\AioBotWindowsBridge.exe
```

## Safety properties

- CDP must be loopback HTTP only;
- Supabase and Webinterface endpoints must be HTTPS;
- the Backblaze endpoint must be HTTPS and match the configured Backblaze region;
- Backblaze bucket names are validated for S3-compatible use;
- only the configured Adventure Land HTTPS origin is accepted;
- CDP responses are bounded;
- telemetry events are capped at 200 per batch;
- the telemetry cursor advances only after Supabase accepts the batch;
- Webinterface and Backblaze profile-sync failures never stop or steer gameplay;
- telemetry and diagnostics failures never stop or steer gameplay;
- problem diagnostic storage is bounded;
- Backblaze credentials are DPAPI-protected for the current Windows user;
- Backblaze credentials are not placed in settings.json, GitHub, or Supabase telemetry;
- Backblaze credentials are not persisted to Adventure Land LocalStorage by the Bridge;
- no FTP/FTPS library or bplaced-specific configuration remains in the Windows Bridge;
- no service-role key is present in the desktop app;
- no generic evaluate/invoke or remote-shell surface is exposed.
