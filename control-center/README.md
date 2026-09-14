# AIO Bot Control Center

Native Windows control plane for the Adventure Land v3 bot.

## Current scope

- WPF / .NET 8 desktop application
- read-only GitHub `main` status
- read-only Raspberry Pi host/runtime status
- read-only telemetry endpoint status
- authenticated Raspberry Pi operations control for start, stop, restart, deploy-main and rollback
- local configuration in `%APPDATA%/AioBotControlCenter/settings.json`
- no gameplay authority and no generic remote shell
- optional Windows-first telemetry bridge in `ops/windows-bridge` for reading the local Adventure Land v3 debug surfaces and forwarding them to Supabase

## Local build

```powershell
dotnet build .\control-center\AioBotControlCenter.csproj -c Release
dotnet build .\ops\windows-bridge\AioBotWindowsBridge.csproj -c Release
```

## Publish standalone Windows builds

```powershell
dotnet publish .\control-center\AioBotControlCenter.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
dotnet publish .\ops\windows-bridge\AioBotWindowsBridge.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## Windows telemetry bridge

For Windows-only operation, `ops/windows-bridge` attaches to a loopback Chrome/Edge DevTools endpoint, accepts only an `https://adventure.land` page, reads only the existing v3 debug/status surfaces and forwards telemetry to the authenticated Supabase ingest endpoint.

The bridge does not expose arbitrary browser evaluation or gameplay commands. Its token stays in a Windows environment variable and is never written to the repository or bridge status file.

See `ops/windows-bridge/README.md` for setup and the one-cycle Supabase test.

## Raspberry Pi configuration

Start the app once and press **Open settings folder**. Edit `settings.json` locally. Never commit tokens.

```json
{
  "GitHubRepository": "Riflex91/Adventure-Land---The-Code-MMORPG---Bot--public",
  "GitHubToken": "",
  "PiHostUrl": "http://127.0.0.1:8787",
  "PiHostToken": "",
  "PiControlUrl": "http://127.0.0.1:8790",
  "PiControlToken": "",
  "TelemetryReadUrl": "",
  "TelemetryReadToken": ""
}
```

The safest remote setup keeps both Pi APIs on loopback and uses SSH tunnels from Windows. If the operations daemon is bound to a LAN address directly, it refuses to start unless TLS certificate and key paths are configured.

Every mutation from the Windows app includes a unique idempotency key. Deploy-main is implemented by the Pi daemon, not the desktop app: it requires a clean repository, fetches `origin/main`, records the previous SHA, checks out the new SHA, restarts the configured systemd bot service and verifies that the service is active. Failed deployments attempt to restore the previous SHA automatically.
