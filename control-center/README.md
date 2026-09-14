# AIO Bot Control Center

Native Windows control-plane foundation for the Adventure Land v3 bot.

## Current scope

- WPF / .NET 8 desktop application
- read-only GitHub `main` status
- read-only Raspberry Pi host status
- read-only telemetry endpoint status
- local configuration in `%APPDATA%/AioBotControlCenter/settings.json`
- no gameplay authority
- restart/deploy/rollback buttons deliberately disabled until the Pi daemon has authenticated idempotent command endpoints and rollback health checks

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
  "PiHostUrl": "http://raspberrypi.local:8787",
  "PiHostToken": "",
  "TelemetryReadUrl": "",
  "TelemetryReadToken": ""
}
```

The first release is intentionally observation-only. Control actions are added only after the daemon-side API can guarantee authentication, idempotency, post-deploy health checks, and rollback.
