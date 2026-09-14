# AIO Bot Windows Bridge

Native Windows desktop app for the Adventure Land v3 observability path:

```text
Adventure Land v3 (Edge/Chrome)
        ↓ read-only debug surfaces
AIO Bot Windows Bridge
        ↓ authenticated HTTPS
Supabase Aio-bot
        ↓ optional operator gate
ChatGPT signal/watch path
```

The app has **no gameplay authority** and no generic JavaScript, shell, movement, combat, Merchant, update, or browser-command endpoint. It evaluates only the fixed read-only v3 debug expressions required for status and telemetry.

## What the app does

- detects an already running local Edge/Chrome DevTools endpoint;
- can start a dedicated local Edge/Chrome profile automatically when telemetry is enabled;
- selects only an `https://adventure.land` page;
- reads the existing `AIO_V3.operations` debug surfaces;
- uploads bounded telemetry batches to the existing `bot-debug-ingest` Supabase Edge Function;
- keeps the event cursor durable and advances it only after a successful Supabase response;
- provides a visible **TELEMETRIE AN/AUS** switch;
- provides a separate **SIGNALE AN/AUS** switch for the Supabase ChatGPT signal gate;
- reconnects automatically with bounded exponential backoff;
- shows browser, bot, Supabase, last-upload and error status.

Turning telemetry off stops Windows→Supabase uploads. It does not stop the Adventure Land bot and does not weaken any bot safety gate. Turning ChatGPT signals off is independent: telemetry may continue while ChatGPT-facing signals remain blocked.

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
%APPDATA%\AioBotWindowsBridge\bridge-state.json
%APPDATA%\AioBotWindowsBridge\bridge-status.json
```

The dedicated browser profile is under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\BrowserProfile
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
- Supabase endpoints must be HTTPS;
- only the configured Adventure Land HTTPS origin is accepted;
- CDP responses are bounded to 1 MiB;
- telemetry events are capped at 200 per batch;
- the telemetry cursor advances only after Supabase accepts the batch;
- telemetry failures never stop or steer gameplay;
- retries use bounded exponential backoff;
- secrets are DPAPI-protected for the current Windows user;
- no service-role key is present in the desktop app;
- no generic evaluate/invoke or remote-shell surface is exposed.
