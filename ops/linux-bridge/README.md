# AL Bot V6 Linux Bridge

Linux host for the AL Bot V6 transport, cloud/archive paths, knowledge watcher and 24/7 recovery.

The implementation reuses the production V6 transport sources from ops/windows-bridge for CDP, Supabase, Cloudflare, Backblaze, diagnostics and knowledge handling. Linux-specific code replaces the operating-system layer.

## 24/7 supervision

Two independent layers are used. systemd supervises the Linux Bridge process with Restart=always and WatchdogSec=45. LinuxWatchdogSupervisor separately checks the managed browser and the ALBot V6 CDP contract.

Recovery is staged: start the browser if CDP is absent; require a valid V6 snapshot/identity; after repeated bot/CDP failures send Page.reload; after further failures restart only the browser launched with the dedicated bridge profile; and apply a persistent browser-start budget of four starts per ten minutes followed by a 15 minute circuit breaker.

Supabase, Cloudflare and Backblaze outages are observational and are not treated as browser/bot crashes. Character movement is not used as liveness. When the V6 snapshot exposes a heartbeat timestamp, freshness is checked; otherwise successful bounded CDP/V6 snapshot execution is the liveness proof.

## Local UI

The bridge serves a loopback-only page at http://127.0.0.1:18741. Mutating calls require an in-memory per-process admin token and a custom header. No CORS policy is enabled. Secrets are never returned by the API.

## Secrets

Persistent secrets use Linux Secret Service through secret-tool: telemetry-token-v6, web-dashboard-write-key-v6, backblaze-key-id-v6 and backblaze-application-key-v6. Install libsecret-tools and run a Secret Service such as GNOME Keyring or KWallet Secret Service. Environment variables remain supported for unattended deployments. There is no plaintext secret fallback in settings.json.

## Browser

Supported discovery order is Brave, Google Chrome, Chromium and Microsoft Edge. The browser uses a dedicated profile under ~/.local/share/aio-bot-linux-bridge/browser-profile and loopback CDP only. The watchdog only kills a PID after verifying /proc/<pid>/cmdline contains that exact profile path.

## Knowledge watcher

The constrained Windows implementation is shared: repository scope remains v5/wissensbasis/**, no force push, main is not locally merged/rebased into the knowledge branch, hourly cadence, optional live knowledge import and the Git Credential Manager PAT flow. Linux live import defaults off until an absolute Linux path is intentionally configured.

## Self-update

The fixed channel is linux-bridge-latest. The manifest pins build number, source SHA, asset URL, size and SHA-256. A verified update replaces the running executable and exits with code 75; systemd starts the verified new binary. A .previous rollback copy is retained.

## Build

dotnet restore ops/linux-bridge/AioBotLinuxBridge.csproj
dotnet build ops/linux-bridge/AioBotLinuxBridge.csproj -c Release
dotnet run --project ops/linux-bridge/AioBotLinuxBridge.csproj -c Release -- --self-test
dotnet publish ops/linux-bridge/AioBotLinuxBridge.csproj -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true -o artifacts/linux-bridge

Telemetry remains disabled by default until settings.json enables telemetryEnabled and a valid V6 telemetry token exists.


If `secret-tool` is not installed, the bridge can still start for browser/watchdog/status operation and can use environment-provided secrets. Persisting new secrets through the local UI remains fail-closed until Linux Secret Service is available.
