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

## Local build

```powershell
dotnet build .\control-center\AioBotControlCenter.csproj -c Release
```

## Publish a standalone Windows build

```powershell
dotnet publish .\control-center\AioBotControlCenter.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## Configuration

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
