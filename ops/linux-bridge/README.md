# AIO Bot Linux Bridge

Eigenständiger Linux-Port der AIO Bot Bridge.

**Wichtig:** Die Windows-Anwendung unter `ops/windows-bridge/**` bleibt vollständig eigenständig und wird von diesem Projekt weder geändert noch zum Build benötigt.

## Architektur

Die Linux Bridge übernimmt die plattformneutralen Funktionen der Windows Bridge:

- Adventure-Land-CDP-Verbindung
- Supabase-Telemetrie und Signal-Control
- Web-Dashboard-/Cloudflare-Profil-Sync
- Backblaze-Konfiguration und expliziter Live-Self-Test
- lokale Problem-Diagnostik
- V5-Test-Deployment
- Wissenswächter / Knowledge-Sync
- lokale Live-Wissensdatenbank
- V5-Readiness-Test
- automatischer, SHA-256-verifizierter Self-Updater

Linux-spezifisch ersetzt sie:

- WPF/WinForms durch ein lokales Webinterface
- Windows DPAPI durch Secret Service / libsecret (`secret-tool`)
- Windows-Laufwerks-/PowerShell-Prüfungen durch `findmnt` + `lsblk`
- Windows-Browserpfade durch PATH-basierte Brave/Chrome/Chromium/Edge-Erkennung
- `.exe`-Updates durch native Linux-Binaries

## Lokales Webinterface

Standard:

```text
http://127.0.0.1:8791
```

Der Listener muss Loopback-HTTP bleiben. Ändernde Requests werden zusätzlich durch einen pro Prozess zufällig erzeugten CSRF-Token geschützt. Es wird absichtlich kein CORS aktiviert.

## Verzeichnisse

Konfiguration:

```text
$XDG_CONFIG_HOME/aio-bot-linux-bridge/settings.json
```

Fallback:

```text
~/.config/aio-bot-linux-bridge/settings.json
```

Status, Browserprofil, Diagnostik und Knowledge-Arbeitskopie:

```text
$XDG_STATE_HOME/aio-bot-linux-bridge/
```

Fallback:

```text
~/.local/state/aio-bot-linux-bridge/
```

Standardpfad der lokalen V5-Wissensdatenbank:

```text
~/AdventureLand-V5/wissensdatenbank
```

Der Pfad ist konfigurierbar, muss aber absolut sein und darf nicht direkt die Dateisystemwurzel sein.

## Secrets

Persistente Secrets werden **nicht** als Klartextdatei abgelegt. Die Bridge verwendet `secret-tool` und damit den Linux Secret Service / libsecret.

Verwendete Secrets:

- Supabase Telemetrie-Token
- Web-Dashboard Write Key
- Backblaze Key ID + Application Key

Falls kein Secret Service vorhanden ist, kann die Bridge Secrets aus den bestehenden Umgebungsvariablen verwenden:

```text
AIO_V3_DEBUG_TELEMETRY_TOKEN
AIO_V3_WEB_DASHBOARD_WRITE_KEY
AIO_V4_BACKBLAZE_KEY_ID
AIO_V4_BACKBLAZE_APPLICATION_KEY
```

Ohne Secret Service verweigert die Weboberfläche die persistente Speicherung. Es gibt keinen Klartext-Dateifallback.

## Voraussetzungen

Erforderlich:

- Linux x64 oder ARM64
- Git
- `findmnt` und `lsblk` aus util-linux
- ein Chromium-basierter Browser mit CDP-Unterstützung

Empfohlen:

- `secret-tool` / libsecret
- Git Credential Manager für den Wissenswächter

Unter Debian/Ubuntu sind die Linux-Hilfsprogramme typischerweise über `util-linux` und `libsecret-tools` verfügbar.

Der Wissenswächter behält das bestehende Least-Privilege-Konzept bei: Fine-grained PAT, nur `Riflex91/Riflex91-Repo`, Contents Read/Write. Die Bridge liest oder protokolliert den PAT nicht.

## Build

Framework-Build:

```bash
dotnet restore ./ops/linux-bridge/AioBotLinuxBridge.csproj
dotnet build ./ops/linux-bridge/AioBotLinuxBridge.csproj -c Release --no-restore
dotnet run --project ./ops/linux-bridge/AioBotLinuxBridge.csproj -c Release --no-build -- --self-test
```

Self-contained Single File für die aktuelle Architektur:

```bash
./ops/linux-bridge/build.sh
```

Explizit:

```bash
./ops/linux-bridge/build.sh linux-x64
./ops/linux-bridge/build.sh linux-arm64
```

## Installation als User-Service

Nach dem Publish:

```bash
./ops/linux-bridge/install.sh ./artifacts/linux-bridge/linux-x64/AioBotLinuxBridge
systemctl --user start aio-bot-linux-bridge
```

Logs:

```bash
journalctl --user -u aio-bot-linux-bridge -f
```

Die Weboberfläche ist anschließend unter `http://127.0.0.1:8791` erreichbar.

## Browser

Unterstützte Namen:

- Brave: `brave-browser`, `brave`
- Chrome: `google-chrome-stable`, `google-chrome`
- Chromium: `chromium`, `chromium-browser`
- Edge: `microsoft-edge-stable`, `microsoft-edge`

Für Server ohne Desktop kann `browserHeadless=true` gesetzt werden. Die Bridge fügt absichtlich **nicht** automatisch `--no-sandbox` hinzu.

## Self-Update

Alle 60 Sekunden wird der feste Architekturkanal geprüft:

```text
linux-bridge-latest-linux-x64
linux-bridge-latest-linux-arm64
```

Ein Update wird nur angenommen, wenn:

1. die Buildnummer höher als die laufende ist,
2. das Manifest exakt den festen GitHub-Assetpfad enthält,
3. Dateigröße stimmt,
4. SHA-256 stimmt.

Erst danach wird das neue Binary gestartet, wartet auf das Ende des Elternprozesses, ersetzt die installierte Datei, verifiziert sie erneut und startet die Bridge neu. Bei einem Fehler wird die vorherige Binärdatei soweit möglich wiederhergestellt.

## Sicherheit

- Dashboard und CDP müssen Loopback bleiben.
- Supabase, Web-Dashboard und Backblaze müssen HTTPS verwenden.
- Keine Service-Role-Keys im Linux-Programm.
- Kein generischer Remote-Shell-/Evaluate-Endpunkt.
- Browser-/Telemetry-/Diagnostikfehler steuern kein Gameplay.
- Backblaze-Live-Test erfolgt nur nach explizitem Klick.
- Secrets werden weder in Status-JSON noch im Webstatus ausgegeben.
- Wissenswächter bleibt auf `v5/wissensbasis/**` begrenzt.
