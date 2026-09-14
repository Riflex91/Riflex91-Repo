# AIO Windows telemetry bridge

Windows-first external observability bridge for Adventure Land v3.

The bridge attaches only to a local Chrome/Edge DevTools endpoint, selects an `https://adventure.land` page, reads the existing read-only `AIO_V3.operations` debug surfaces and forwards structured telemetry to the configured Supabase Edge Function.

It does **not** expose a shell, generic JavaScript evaluation API, movement, combat, Merchant actions or other gameplay authority.

## Build

```powershell
dotnet publish .\ops\windows-bridge\AioBotWindowsBridge.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o .\artifacts\windows-bridge
```

## Configuration

On first launch the bridge creates:

`%APPDATA%\AioBotControlCenter\windows-bridge.json`

The default configuration already points at the current AIO Supabase ingest endpoint. The ingest token is deliberately **not** stored in the repository or status file. Supply it through the Windows environment variable named by `telemetryTokenEnvironmentVariable` (default `AIO_V3_DEBUG_TELEMETRY_TOKEN`).

The existing Supabase client registration currently uses `botId = pi-main`, so the default keeps that ID for compatibility. It can be migrated to a Windows-specific ID later without changing the bridge protocol.

## Browser setup

Use a dedicated browser profile for remote debugging. Chrome 136+ requires a non-default `--user-data-dir` when `--remote-debugging-port` is enabled. The helper script does this automatically.

After publishing, copy `start-windows-stack.ps1` next to the published executable or pass `-BridgeExe` explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\ops\windows-bridge\start-windows-stack.ps1 -BridgeExe .\artifacts\windows-bridge\AioBotWindowsBridge.exe
```

The first time the dedicated browser profile opens, sign in to Adventure Land manually. Credentials remain in the browser profile and are never sent to the bridge or Supabase.

## Test one telemetry cycle

With Adventure Land open and the v3 bundle running:

```powershell
.\artifacts\windows-bridge\AioBotWindowsBridge.exe --once
```

A successful run exits with code 0 and writes:

`%APPDATA%\AioBotControlCenter\windows-bridge-status.json`

The status file contains no telemetry token. On success Supabase receives one row in `aio_debug_telemetry_batches` and updates `aio_debug_ingest_clients.last_used_at`.

## Safety properties

- CDP endpoint must be loopback HTTP only.
- only the configured HTTPS Adventure Land origin is accepted.
- Supabase ingest must use HTTPS.
- only hard-coded read-only debug expressions are evaluated.
- no generic evaluate/invoke surface is exposed.
- responses are bounded to 1 MiB.
- event reads are capped at 200 per batch.
- the event cursor advances only after Supabase accepts the batch.
- failures use bounded exponential backoff instead of blind retry loops.
- state and status are local to `%APPDATA%\AioBotControlCenter`.

This bridge is the Windows foundation for the later incident-detection and self-healing loop. Code repair and GitHub updates remain outside the gameplay authority boundary and must continue to pass repository CI before deployment.
