# AIO Bot Windows Bridge

Native Windows desktop app for the Adventure Land v3 observability and local configuration path:

```text
Adventure Land v3 (Brave/Edge/Chrome)
        ↑ fixed same-origin CDP configuration handoff
AIO Bot Windows Bridge
        ├─ authenticated HTTPS → Supabase → ChatGPT signal/watch path
        ├─ local bounded problem diagnostics → Supabase problem mirror
        ├─ fixed Cloudflare Webinterface profile sync
        └─ DPAPI-protected Backblaze credentials → verified bot runtime context
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
- finds the real AIO-v3 CDP execution context before handing Backblaze credentials to the bot;
- verifies the handoff by reading the non-secret `AIO_V3.objectStorage.status()` surface in that exact context;
- offers an explicit, confirmation-gated Backblaze live test through the bot runtime;
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

The Bridge does **not** upload application data to Backblaze itself. Instead it uses CDP to enumerate same-origin Adventure Land execution contexts and only injects the fixed configuration into contexts that prove they contain the real AIO-v3 runtime: `AIO_V3.__runtime`, `AIO_V3.operations` and `AIO_V3.objectStorage` must all be present with the expected fixed methods. This avoids treating the visible page `top` context as the bot just because it shares the same origin.

The runtime configuration is exposed inside the verified bot context as:

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

After injection the Bridge immediately calls the fixed, non-secret `AIO_V3.objectStorage.status()` API in the same execution context and requires the provider, endpoint host, region, bucket and prefix to match. The UI only reports **BEREIT** after that read-back succeeds. If the runtime has not created its bot execution context yet, the UI reports that it is waiting for the bot context instead of claiming the handoff succeeded.

The config is placed in browser runtime memory only. It is **not stored in browser LocalStorage** by this feature. Deleting the credentials in the Windows app removes the DPAPI file, disables handoff, and clears the runtime global from reachable same-origin execution contexts.

### Explicit live test

After **Jetzt an Bot senden** successfully verifies the bot-context handoff, the Bridge asks whether it should run a live Backblaze test. The live test is not automatic and only runs after explicit confirmation.

The fixed flow is:

```text
verified AIO-v3 bot execution context
  → AIO_V3.objectStorage.selfTest()
  → PUT v4/_health/<timestamp>-<random>.json
  → HEAD the same object
  → verify size + x-amz-meta-aio-sha256
  → report verified=true back to the Windows app
```

The returned result is reduced to non-secret fields only: provider, bucket, object key, byte count and optional version ID. Neither `keyID` nor `applicationKey` is returned to the Windows UI. The test deliberately does **not** request cleanup, so it does not require `deleteFiles` and does not delete the uploaded health object.

Use only a Backblaze Application Key restricted to the intended bucket and required capabilities. Do not use a master key. For the non-destructive live test, `writeFiles` and `readFiles` are sufficient.

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

Config version 5 removed the old FTPS/bplaced settings from `settings.json`. Config version 6 adds the Wissenswaechter settings with a fixed 60-minute interval and the V5 Wissensbasis scope. Config version 7 adds the read-only local live-knowledge import path on drive D:. Loading an older Bridge config migrates it to the current version; obsolete FTPS fields are not written back. The old FTP library and FTPS credential store are no longer part of the Windows Bridge project.

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
- Backblaze secrets are injected only after a fixed probe identifies the real AIO-v3 bot runtime context;
- Backblaze handoff is considered ready only after a non-secret read-back from `AIO_V3.objectStorage.status()` in the same context;
- the Backblaze live test is fixed to `AIO_V3.objectStorage.selfTest()` and requires explicit operator confirmation;
- the live test returns no credential fields and performs no delete;
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


## GitHub-Anmeldung und Wissenswaechter

Die Bridge kann sich ueber den mit Git for Windows ausgelieferten Git Credential Manager bei GitHub anmelden. Der Login verwendet den Browser-OAuth-Flow; die Bridge speichert selbst weder GitHub-Passwort noch GitHub-Token in `settings.json`.

Der Wissenswaechter ist standardmaessig aktiviert und laeuft einmal pro Stunde. Ein zusaetzlicher manueller Lauf kann jederzeit ueber die Oberflaeche gestartet werden.

### Harte Repo-Grenze

Der Waechter darf ausschliesslich in folgendem Bereich lesen und schreiben:

```text
v5/wissensbasis/**
```

Technische Verriegelungen:

- der lokale Clone wird mit `--filter=blob:none --sparse --no-checkout` angelegt;
- Sparse Checkout wird auf genau `v5/wissensbasis` gesetzt;
- alle Dateipfade werden vor lokalem Zugriff gegen diese Wurzel validiert;
- vor dem Commit werden alle gestageten Pfade verifiziert;
- nach einem Rebase wird der erzeugte Commit nochmals verifiziert;
- Pfade ausserhalb von `v5/wissensbasis/**` fuehren zum Abbruch;
- es gibt keinen Force-Push.

Automatisch erzeugte Laufdaten liegen standardmaessig unter:

```text
v5/wissensbasis/datenbank/**
```

Der gesamte erlaubte Lese- und Schreibbereich bleibt jedoch `v5/wissensbasis/**`.

### Quellenverarbeitung

Pro Lauf werden die registrierten Quellen aus `v5/wissensbasis/quellen/quellen.json` geprueft. Inhalte werden per SHA-256 verglichen. Zusaetzlich sucht die Bridge nach neuen Quellen zu **Adventure Land - The Code MMORPG**.

Webfunde werden fail-closed gefiltert:

- der Text der Suchanfrage selbst zaehlt niemals als Relevanznachweis;
- bekannte offizielle Adventure-Land-Adressen werden direkt zugelassen;
- alle anderen Treffer muessen zuerst einen Adventure-Land-spezifischen Vorfilter bestehen;
- danach wird die gefundene Seite tatsaechlich abgerufen und ihr Inhalt auf eindeutige Spielmerkmale wie `adventure.land`, Steam-App-ID `777150`, das offizielle Repository oder den kanonischen MMORPG-Namen geprueft;
- nicht erreichbare, nicht textuelle oder nicht eindeutig zuordenbare Treffer werden verworfen;
- private/Loopback-IP-Ziele werden bereits als Webfund blockiert;
- gespeicherte Kandidaten enthalten einen expliziten `ADVENTURE_LAND_...`-Relevanznachweis;
- Alt-Kandidaten ohne diesen Nachweis werden beim naechsten Lauf automatisch entfernt.

Neue oder nicht offizielle, aber verifizierte Quellen bleiben Kandidaten und werden nicht automatisch zu bestaetigten Fakten erhoben.


## Lokale live verifizierte Wissensdatenbank

Die Bridge unterstuetzt zusaetzlich die spaetere V5-Bot-Wissensdatenbank auf der SSD.

Standard:

```text
D:\AdventureLand-V5\wissensdatenbank
```

Der Pfad ist in der Oberflaeche unter **GitHub & Wissenswächter** direkt editierbar. Er muss ein Unterpfad von `D:\` sein; die Laufwerkswurzel selbst ist verboten.

Der Bot ist spaeter alleiniger fachlicher Writer. Die Bridge liest nur:

```text
manifest.json
status.json
aktuell/**/*.json
```

und spiegelt nach erfolgreicher Validierung nach:

```text
v5/wissensbasis/live/snapshot/**
```

Nicht hochgeladen werden `temporaer/**`, `quarantaene/**` oder andere Dateien auf D:.

Der Import ist fail-closed:

- nur `Adventure Land - The Code MMORPG`;
- nur `LIVE_VERIFIZIERT`;
- nur `quelle.art=LIVE_SPIEL`;
- Status vor/nach dem Lesen muss bytegleich `BEREIT` und dieselbe Generation sein;
- Reparse Points/Junctions/Symlinks werden vor Traversierung verweigert;
- Pfad-Traversal und unerwartete Dateitypen werden verweigert;
- Einzeldatei-, Dateianzahl- und Gesamtgroessenlimits sind hart;
- secret-/token-/password-/credential-/cookie-/session-artige JSON-Felder werden rekursiv verweigert;
- der lokale D:-Pfad wird nicht nach GitHub geschrieben.

Fehlerhaftes lokales Live-Wissen ersetzt niemals den letzten gueltigen GitHub-Snapshot.

Die Bridge erzeugt keine Gameplay-Fakten und besitzt weiterhin keine Gameplay-Autoritaet.
