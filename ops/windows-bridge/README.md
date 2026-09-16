# AIO Bot Windows Bridge

Native Windows desktop app for the Adventure Land v3 observability path:

```text
Adventure Land v3 (Brave/Edge/Chrome)
        ↓ fixed CDP debug/profile surfaces
AIO Bot Windows Bridge
        ├─ authenticated HTTPS → Supabase → ChatGPT signal/watch path
        └─ local problem spool → explicit FTPS/TLS → diagnostic archive
```

The app has **no gameplay authority** and no generic JavaScript, shell, movement, combat, Merchant, update, or browser-command endpoint. Telemetry evaluates only the fixed v3 debug expressions required for status and telemetry. The Webinterface profile sync uses a separate, fixed same-origin expression that can only maintain the two known AIO-v3 Cloudflare LocalStorage entries on `https://adventure.land`.

## What the app does

- detects an already running local Brave/Edge/Chrome DevTools endpoint;
- can start a dedicated local Brave/Edge/Chrome profile automatically when telemetry is enabled;
- selects only an `https://adventure.land` page;
- reads the existing `AIO_V3.operations` debug surfaces;
- uploads bounded telemetry batches to the existing `bot-debug-ingest` Supabase Edge Function;
- keeps the event cursor durable and advances it only after a successful Supabase response;
- provides a visible **TELEMETRIE AN/AUS** switch;
- provides a separate **SIGNALE AN/AUS** switch for the Supabase ChatGPT signal gate;
- securely provisions the dedicated browser profile for the existing Cloudflare Webinterface;
- can automatically archive important ERROR/CRITICAL and selected problem WARN events as compressed problem bundles;
- keeps FTPS problem bundles locally until an upload has been verified;
- reconnects automatically with bounded exponential backoff;
- shows browser, bot, Supabase, Webinterface, last-upload and error status.

Turning telemetry off stops Windows→Supabase uploads. It does not stop the Adventure Land bot and does not weaken any bot safety gate. Turning ChatGPT signals off is independent: telemetry may continue while ChatGPT-facing signals remain blocked.

## Diagnose & FTPS-Archiv

The Windows app contains a **Diagnose & FTPS-Archiv** section. For bplaced or another compatible server, enter:

- FTPS host name;
- port (normally `21` for explicit FTPS);
- user name;
- password;
- remote root directory (default `/diagnostics/v3`);
- whether the server certificate must be strictly validated (enabled by default).

Use **Verbindung testen** before enabling the automatic archive. The connection test uses the password currently typed in the PasswordBox, or the already stored password if the field is empty. **FTPS-Einstellungen speichern** writes only non-secret connection settings to `settings.json`. The password is stored separately with Windows DPAPI for the current Windows user.

The archive intentionally supports **explicit FTPS/TLS only**. Plain FTP is not used. Certificate validation is enabled by default and should stay enabled unless a controlled test server uses a certificate that Windows cannot validate.

When an important problem is seen in the existing bridge event stream, the bridge first creates a local gzip bundle containing the bounded debug snapshot, relevant events, trigger/cursor metadata and sanitized diagnostics. Secret-like object keys such as passwords, tokens, cookies, credentials and API keys are replaced with `[REDACTED]` before serialization.

Local spool layout:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\Diagnostics\
  latest-problem.json
  pending\
    problem-<timestamp>-<hash>.json.gz
    problem-<timestamp>-<hash>.json.gz.meta.json
```

Remote layout:

```text
/diagnostics/v3/
  <bot-id>/
    latest-problem.json
    YYYY-MM-DD/
      problem-....json.gz
      problem-....json.gz.sha256
```

Each upload is written to a temporary `.part` path, its remote byte size is checked, and it is then moved to the final name. The local bundle is deleted only after that sequence succeeds. A SHA-256 sidecar is uploaded as well. Repeated failures use bounded exponential backoff and pending bundles remain on disk. Local retention is bounded so a long server outage cannot grow the spool forever.

The FTPS archive is **observational only**. Archive/TLS/server failures are isolated from Supabase telemetry and from gameplay. The initial Windows integration performs automatic problem detection while the telemetry bridge is running, because it reuses the same fixed CDP debug reads instead of opening a second browser-control path. If FTPS is enabled while telemetry is off, the UI therefore shows that FTPS is ready but waiting for telemetry.

The FTPS password is never written to `settings.json`, `bridge-status.json`, GitHub or Supabase telemetry. It can optionally be imported once from `AIO_V3_DIAGNOSTICS_FTPS_PASSWORD`, after which the DPAPI copy is used.

## Webinterface / Cloudflare profile sync

The Bridge intentionally uses its own Chromium profile instead of attaching remote debugging to the operator's normal browser profile. As a result, normal-browser cookies and LocalStorage are not inherited. A fresh Bridge profile would otherwise be missing both the Webinterface write key and `cloud.enabled`, so bots started there would not publish their runtime data to the Webinterface.

The app fixes this without copying the normal browser profile:

1. the operator enters the existing Webinterface write key once in the Windows app, or sets `AIO_V3_WEB_DASHBOARD_WRITE_KEY`;
2. the key is stored in a per-user Windows DPAPI file;
3. once the dedicated browser is reachable, the app writes only the fixed AIO-v3 Cloudflare configuration to the Adventure Land origin;
4. it sets `cloud.enabled=true` while preserving unrelated control-plane settings;
5. if the protected write key is deleted, missing, unreadable, or Web Dashboard sync is disabled, the Bridge removes the Cloudflare credential from the dedicated profile and sets `cloud.enabled=false` fail-closed.

The only browser storage keys maintained by this feature are:

```text
aio-v3:cloud-control:v1
aio-v3:control-plane-config:v1
```

The default Webinterface endpoint is:

```text
https://aio-bot-dashboard.hansijuergenlul.workers.dev
```

The write key is never stored in `settings.json`, `bridge-status.json`, logs, GitHub, or Supabase telemetry. It is copied into the dedicated Adventure Land browser profile because the existing bot Cloud Control Plane reads that credential from the Adventure Land origin. The Bridge exposes no generic evaluate/invoke API to callers.

If the write key is saved while a bot runtime is already running, restart that bot runtime once so its already-created Cloud Control Plane reloads the newly provisioned browser storage. Subsequent bot starts in the dedicated Bridge profile inherit the stored configuration automatically.

## Supabase connection

The Supabase project endpoint and current bot ID are preconfigured. The bearer token is intentionally **not** in GitHub and is never written to logs or status files.

On startup the app:

1. checks its DPAPI-protected token store;
2. if empty, checks the Windows environment variable `AIO_V3_DEBUG_TELEMETRY_TOKEN`;
3. if that variable contains a valid token, imports it automatically into the per-user DPAPI store;
4. otherwise lets the operator paste the token once in the app.

After that one-time secret setup, connection and reconnection are automatic. There is deliberately no unauthenticated bootstrap path that could mint or disclose an ingest credential.

Local files are under:

```text
%APPDATA%\AioBotWindowsBridge\settings.json
%APPDATA%\AioBotWindowsBridge\telemetry-token.dpapi
%APPDATA%\AioBotWindowsBridge\web-dashboard-write-key.dpapi
%APPDATA%\AioBotWindowsBridge\diagnostics-ftps-password.dpapi
%APPDATA%\AioBotWindowsBridge\bridge-state.json
%APPDATA%\AioBotWindowsBridge\bridge-status.json
```

The dedicated browser profile is under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\BrowserProfile
```

The local diagnostic spool is under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\Diagnostics
```

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
- Supabase endpoints and the Webinterface endpoint must be HTTPS;
- only the configured Adventure Land HTTPS origin is accepted;
- CDP responses are bounded;
- Webinterface sync is limited to two fixed AIO-v3 LocalStorage keys and has no remote generic JavaScript surface;
- telemetry events are capped at 200 per batch;
- the telemetry cursor advances only after Supabase accepts the batch;
- Webinterface sync failures never stop or steer gameplay and do not block Supabase telemetry;
- telemetry failures never stop or steer gameplay;
- FTPS uploads use explicit TLS, certificate validation defaults to strict, and local bundles are deleted only after verified upload;
- FTPS/archive failures never stop or steer gameplay and never block Supabase telemetry;
- retries use bounded exponential backoff;
- Supabase token, Webinterface write key and FTPS password are DPAPI-protected for the current Windows user;
- no service-role key is present in the desktop app;
- no generic evaluate/invoke or remote-shell surface is exposed.
