# AL Bot V6 Windows Bridge

Native Windows host for the **AL Bot V6** observability and cloud transport path.

```text
Adventure Land + AL Bot V6
        ↑ same-origin CDP, generation-locked ALBot.bridge
Windows Bridge
        ├─ authenticated HTTPS → Supabase V6 ingest
        ├─ direct host-side HTTPS → Cloudflare /api/v6/runtime
        ├─ local bounded problem diagnostics → Supabase V6 mirror
        ├─ host-side archive → existing Backblaze B2 bucket / v6/
        └─ local DPAPI credential stores (never exposed to Adventure Land)
```

The active transport accepts only:

```text
product         = AL Bot
generation      = 6
bridgeProtocol  = albot-v6-bridge-v1
```

V3/V4/V5 transport contracts are not fallbacks. If only an older runtime is present, the bridge fails closed with `ALBOT_V6_BRIDGE_UNAVAILABLE`. The bridge has no generic JavaScript, shell, movement, combat, Merchant, FTP, or gameplay-command endpoint.

## V6 transport contract

The browser side exposes the bounded, transport-only `ALBot.bridge` API. The Windows Bridge reads only that API through `CdpAlBotV6Client`:

- `identity()`
- `snapshot()`
- `events(afterSeq, limit)`
- `peekTelemetry(limit)`
- `acknowledgeTelemetry(maxSeq)`

The identity explicitly reports `gameplayActionAuthority=false`, `transportOnly=true`, and `acceptsLegacyGenerations=false`. Cloud credentials stay in the Windows host.

## Character supervisor: 1 Merchant + 3 Farmer

The Windows Bridge now has a separate, tightly bounded lifecycle supervisor. It is **not** part of `ALBot.bridge` and does not grant the telemetry transport gameplay authority.

Its contract is:

1. The dedicated Adventure Land browser profile is opened as before.
2. If no local character is running and the saved browser profile has an authenticated Adventure Land account, the supervisor finds the account's **single Merchant** and navigates that browser page to the Merchant with the configured `managedCodeSlot` (default: `AL Final Bot`). The `?code=` launch path makes Adventure Land run that saved code slot on connect.
3. The bot remains authoritative for selecting the three farmer characters. The Bridge does not guess or hard-code farmer names on first start.
4. As soon as V6 runtime snapshots prove one running Merchant plus three running combat-class farmers, the exact four names are persisted in `bridge-state.json`.
5. On later polls the supervisor may restart a missing member of exactly that persisted four-character set through Adventure Land's official `start_character_runner` / `start_character` lifecycle API.
6. Runtime health is independent from account presence: a character counts as healthy only when its V6 snapshot reports `status.running=true`. The Bridge exposes `ALBOT_V6_GROUP_INCOMPLETE:runtime=...:merchant=...:farmers=...` when the four running runtimes are incomplete.

Chromium may move Adventure Land character runners into out-of-process iframes (OOPIFs). V6 discovery therefore uses flattened CDP child sessions and same-session ordering barriers. It never cancels a receive on a WebSocket that will subsequently be used for snapshot/event/ACK evaluation.

The supervisor does **not** know Adventure Land credentials and cannot log an account in. If the dedicated browser profile is not already authenticated it reports `WAITING_FOR_ACCOUNT_SESSION` instead of attempting credential automation.

Configuration:

```json
"characterSupervisorEnabled": true,
"managedCodeSlot": "AL Final Bot"
```

## Supabase

Default V6 endpoints:

```text
/functions/v1/albot-v6-debug-ingest
/functions/v1/albot-v6-signal-control
```

Default host identity and secret variable:

```text
botId:                         albot-v6-main
ALBOT_V6_TELEMETRY_TOKEN
```

Every V6 request carries the V6 bot ID, generation and bridge protocol headers. The Edge Functions validate the same identity again before accepting data. The old `bot-debug-ingest` and `bot-chatgpt-signal-control` POST paths are retired in source with HTTP 410. Historical Supabase rows remain readable; rollout must use a new V6 token/client and deactivate the legacy client.

Supabase acceptance remains the commit point for sequence acknowledgement: browser telemetry is acknowledged only after the V6 ingest accepts it.

## Cloudflare Webinterface

The Windows Bridge sends runtime data **directly from the Windows host** to:

```text
POST /api/v6/runtime
```

The write key is stored with Windows DPAPI or imported from:

```text
ALBOT_V6_WEB_DASHBOARD_WRITE_KEY
```

It is never written into Adventure Land globals or LocalStorage. Existing V3 browser profile entries are cleared as one-way migration cleanup. The active bridge never applies a V3 Cloudflare profile.

The dashboard reads V6 telemetry from:

```text
GET /api/v6/overview
GET /api/v6/events
```

Legacy bot write/sync routes such as `/api/v3/runtime`, `/api/v3/sync`, V3 persistence, teacher and feedback writes are rejected before the old worker executes. Historical/operator read paths remain available.

## Problem diagnostics

Important ERROR/CRITICAL and selected WARN events are captured as sanitized, bounded local bundles and mirrored through the V6 Supabase ingest. Secret-like keys are redacted before serialization.

Logical archive namespace:

```text
diagnostics/v6/<bot-id>/<day>/...
```

The diagnostics channel uses V6 payload types and the same generation/protocol headers as normal telemetry.

## Backblaze / object storage

V6 reuses the existing Backblaze B2 bucket `al-aio-bot` as a host-side long-term archive. The historical `AIO_V3_BACKBLAZE_CONFIG` browser handoff remains disabled and is not part of the active V6 transport.

The Windows Bridge owns the complete storage operation:

```text
ALBot.bridge bounded telemetry
  → Windows Bridge
  → Supabase V6 commit
  → BackblazeV6ArchiveSink
  → S3 Signature V4 PUT
  → HEAD verification (size + x-amz-meta-aio-sha256)
  → al-aio-bot/v6/...
```

Credentials stay in the Windows host and are never injected into Adventure Land. Defaults:

```text
backblazeEnabled = true
endpoint         = https://s3.eu-central-003.backblazeb2.com
region           = eu-central-003
bucket           = al-aio-bot
prefix           = v6
ALBOT_V6_BACKBLAZE_KEY_ID
ALBOT_V6_BACKBLAZE_APPLICATION_KEY
```

The `v6` prefix is mandatory, so V6 cannot accidentally write into the historical `v4/` namespace. Event-bearing telemetry batches are archived after successful Supabase ingest; empty runtime snapshots are sampled at most once every five minutes. Archive failures are observational only: Supabase remains the telemetry commit/ACK authority and Backblaze outages never block gameplay or browser ACKs.

Archive payloads are GZIP-compressed JSON and written under:

```text
v6/telemetry/YYYY/MM/DD/<bot-id>/...
```

The UI also provides a host-side V6 connection test. It writes and verifies a small object under `v6/_health/...`; it does not expose credentials to the browser and does not delete existing objects.

When `backblaze-credentials-v6.dpapi` does not yet exist, the Bridge may import the historical per-user `backblaze-credentials.dpapi` once into the V6 DPAPI store. The legacy encrypted file is retained as rollback evidence until V6 end-to-end acceptance. If the historical Backblaze Application Key was restricted specifically to `v4/`, Backblaze will reject V6 writes; in that case create or update a bucket-scoped key that permits `v6/`.

## Legacy source code

Some V3/V5 helper classes remain in the repository for historical regression evidence and old test artifacts. They are not referenced by `TelemetryBridgeService` or the current connection UI. The active bridge service uses `CdpAlBotV6Client` exclusively.

## Local files

```text
%APPDATA%\AioBotWindowsBridge\settings.json
%APPDATA%\AioBotWindowsBridge\telemetry-token-v6.dpapi
%APPDATA%\AioBotWindowsBridge\web-dashboard-write-key-v6.dpapi
%APPDATA%\AioBotWindowsBridge\backblaze-credentials-v6.dpapi
%APPDATA%\AioBotWindowsBridge\bridge-state.json
%APPDATA%\AioBotWindowsBridge\bridge-status.json
```

The dedicated browser profile is under:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\BrowserProfile
```

## Config migration

Config version 12 keeps the V6 Supabase/Cloudflare isolation and host-side Backblaze archive from version 11, and enables the bounded character supervisor with the `AL Final Bot` fallback code slot. The four managed character names are learned only from a proven healthy V6 runtime composition and are stored in `bridge-state.json`, not guessed from account order. The old browser cloud handoff stays disabled. A historical DPAPI Backblaze credential file may be copied once into the V6 credential store; other V3/V4/V5 cloud credentials are not adopted as V6 credentials.

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

## Automatische Bridge-Updates

Die installierte Bridge prüft **alle 60 Sekunden** den festen GitHub-Release-Kanal `windows-bridge-latest`. Nur ein erfolgreich durch den Workflow `.github/workflows/windows-bridge.yml` gebauter und durch die Smoke-Tests gelaufener `main`-Build wird dort veröffentlicht.

Der Update-Ablauf ist fail-safe:

1. Die Bridge lädt ein kleines Versionsmanifest ausschließlich vom festen Release-Pfad dieses Repositories.
2. Das Manifest enthält die monotone GitHub-Actions-Buildnummer, den Commit-SHA, die erwartete Dateigröße und SHA-256 der EXE.
3. Es wird nur aktualisiert, wenn die veröffentlichte Buildnummer **größer** als die laufende ist. Dadurch kann ein veralteter CDN-/Cache-Treffer keine neuere Bridge downgraden.
4. Die neue `AioBotWindowsBridge.exe` wird zunächst in `%LOCALAPPDATA%\AioBotWindowsBridge\SelfUpdate\...` geladen und vollständig gegen Größe und SHA-256 geprüft.
5. Erst danach startet diese geprüfte EXE im separaten `--apply-update`-Modus. Die laufende Bridge fährt herunter.
6. Der Updater wartet auf das Prozessende, legt eine Rollback-Kopie an, ersetzt die EXE und startet anschließend die neue Version.
7. Scheitern Prüfung, Download oder Vorbereitung, bleibt die laufende Version aktiv und versucht es nach 60 Sekunden erneut. Scheitert das Ersetzen, versucht der Updater die vorherige EXE wiederherzustellen und neu zu starten.

Der Updater akzeptiert weder frei konfigurierbare Repositorys noch frei konfigurierbare Asset-URLs. Der Release-Download ist fest auf `Riflex91/Riflex91-Repo` und `AioBotWindowsBridge.exe` begrenzt.

Für End-to-End-Regressionstests kann ein dokumentations-only Main-Build als harmloses Update-Ziel verwendet werden; die Update-Entscheidung bleibt ausschließlich an der monoton steigenden Workflow-Buildnummer gebunden.

Der Apply-/Restart-Regressionspfad wird dabei separat gegen Windows-Dateisperren nach Parent-Prozessende geprüft.

Der Pre-WPF-Bootstrap wird zusätzlich mit einem dokumentations-only Folgebuild als vollständiger Self-Update-Handoff getestet.

Ein abschließender Kontrolllauf bestätigt den wiederholbaren automatischen Versionssprung nach erfolgreichem Pre-WPF-Handoff.

Der Update-Check startet direkt beim Fensterstart und wartet nicht auf Browser-, Supabase- oder Wissenswächter-Initialisierung. Der letzte Check-/Apply-Status wird ohne Geheimnisse unter folgendem Pfad abgelegt:

```text
%LOCALAPPDATA%\AioBotWindowsBridge\self-update-status.json
```

Dort sind unter anderem die Zustände `CHECKING`, `UP_TO_DATE`, `UPDATE_FOUND`, `READY_TO_INSTALL`, `INSTALLER_STARTED`, `CHECK_FAILED`, `APPLIED` und `APPLY_FAILED` nachvollziehbar.

## Automatisches V5-Test-Deployment

Wenn Telemetrie aktiv ist, prüft die Bridge alle **15 Sekunden** zunächst nur das feste V5-Testmanifest auf GitHub. Ist der gewünschte Test bereits aktiv, wird das Testpaket nicht erneut heruntergeladen. Ist ein anderer V5-Test noch nicht terminal, wird fail-closed nichts ersetzt.

Nur wenn ein neuer Test eingesetzt werden darf:

1. Das Manifest muss exakt `Riflex91/Riflex91-Repo`, Branch `main`, Coordinator `merchant` und `PACKAGE_OWNED_COMMAND_CHARACTER` deklarieren.
2. Der Paketpfad muss unter `v5/werkzeuge/` liegen und eine JavaScript-Datei sein.
3. Der Quell-Commit muss exakt 40 kleine Hex-Zeichen und der SHA-256 exakt 64 kleine Hex-Zeichen besitzen.
4. Die Bridge konstruiert die Raw-GitHub-Adresse selbst; eine URL aus dem Manifest wird nicht akzeptiert.
5. Größe und SHA-256 werden vor der Ausführung geprüft.
6. Das Paket wird nur in einen `merchant`-Kontext eingesetzt.
7. Das Paket verteilt seinen eng begrenzten Worker danach selbst per `command_character` an Ranger, Priest und Mage. Andere Klassen verweigern den Worker sofort.
8. Download-, Hash-, Kontext- oder Handshake-Fehler bleiben fail-closed und stoppen die beobachtende Telemetrie nicht.

Damit ist nach einem Merge kein manuelles Kopieren des Test-JavaScripts auf Merchant oder Farmer erforderlich. Der Mechanismus erteilt keine breite normale V5-Runtime-Freigabe; diese bleibt bis zum Abschluss aller Roadmap-Gates gesperrt.

## V5 Readiness-Test

Im Bereich **GitHub & Wissenswächter** gibt es den Button **V5 Readiness-Test**. Er ist der lokale, fail-closed Nachweis für den aktuellen Windows-Bridge-Deploy und die V5-relevante Git-/Knowledge-Konfiguration.

Der Test prüft automatisch unter anderem:

- aktuelle Bridge-Konfiguration und Config-Version 7;
- aktivierten Wissenswächter mit festem 60-Minuten-Intervall;
- exakt `Riflex91/Riflex91-Repo`, `main`, den dedizierten Knowledge-Branch `v5/wissenswaechter-automatisch` und den Scope `v5/wissensbasis/**`;
- den konfigurierten Live-Wissenspfad auf `D:\`;
- Git Credential Manager und die aktive GitHub-Anmeldung;
- den fest verdrahteten **Fine-grained-PAT-Modus** statt Browser-OAuth;
- die Knowledge-Sync-Strategie **ohne lokalen Merge/Rebase von main**;
- reale Erreichbarkeit des Repositories in einer **isolierten temporären Arbeitskopie** mit Sparse Checkout;
- vollständiges Entfernen dieser temporären Arbeitskopie nach dem Test;
- dass der Readiness-Test selbst **keinen Gameplay-Write und keinen Knowledge-Push** ausführt.

Bei vollständig bestandenen automatischen Prüfungen lautet der Status:

`AUTOMATISCHE_PRUEFUNGEN_BESTANDEN_MANUELLER_AUTORISIERUNGSNACHWEIS_OFFEN`

Der vollständige Bericht wird in die Zwischenablage kopiert und soll komplett in ChatGPT eingefügt werden. Der Test liest oder protokolliert absichtlich **kein GitHub-Token**.

Der automatische Test kann den tatsächlichen Token-Rechtescope absichtlich nicht auslesen. Für `V5-ANF-WISSEN-012` war deshalb zusätzlich ein manueller Nachweis erforderlich. Dieser wurde am 2026-09-20 für den real verwendeten Zugang erbracht und ist unter `v5/roadmap/v5-wissen-012-autorisierungsnachweis.json` dokumentiert: Fine-grained PAT, Resource Owner `Riflex91`, Repository access ausschließlich `Riflex91-Repo`, **Contents: Read and write**, **Metadata: Read** automatisch und keine zusätzlichen Schreibrechte für Actions, Administration, Secrets, Environments, Deployments oder Workflows. Der Tokenwert selbst wurde nicht erfasst.

Ein vollständig grüner Readiness-Bericht und der geschlossene WISSEN-012-Nachweis geben die breite Gameplay-Runtime **nicht automatisch** frei. Die separate Gesamtfreigabe bleibt erforderlich.

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
- no generic evaluate/invoke or remote-shell surface is exposed;
- character lifecycle authority is limited to same-origin, locally authenticated Adventure Land pages, exactly one account Merchant, and the last proven 1+3 managed roster;
- the lifecycle supervisor may start characters/code but has no movement, combat, item, bank, market, party-planning, or economy command surface.


## GitHub-Anmeldung und Wissenswaechter

Die Bridge meldet den Wissenswaechter ueber den mit Git for Windows ausgelieferten Git Credential Manager an. **Browser-OAuth ist fuer diesen Pfad gesperrt.** Die Bridge erzwingt den GCM-PAT-Modus und erwartet einen repository-begrenzten Fine-grained Personal Access Token.

Die Oberflaeche bietet **Least-Privilege Token erstellen**. Der Link oeffnet GitHubs Fine-grained-PAT-Erstellung mit dem vorgesehenen Resource Owner und `Contents: write` vorbefuellt. Im GitHub-Dialog muss der Benutzer zusaetzlich **Only select repositories** und ausschließlich `Riflex91-Repo` waehlen. Danach wird der Token ausschließlich im von Git Credential Manager geoeffneten Anmeldedialog eingegeben. Die Bridge uebergibt den Token nicht als Prozessargument, liest seinen Wert nicht und schreibt ihn weder nach `settings.json` noch in Logs, Telemetrie oder Readiness-Berichte.

Der lokale Token benoetigt keine Pull-Request- oder Workflow-Schreibrechte. Er darf den dedizierten Knowledge-Branch per `Contents: Read and write` aktualisieren. Der serverseitige GitHub-Actions-Workflow erstellt bzw. aktualisiert den Pull Request mit seiner separat begrenzten Workflow-Autorisierung.

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
- `main` wird lokal weder in den Knowledge-Branch gemerged noch darauf rebased;
- vor dem Push wird der aktuelle `main` nur gefetcht und der **eigene Branch-Anteil ab Merge-Base** per Drei-Punkt-Diff auf `v5/wissensbasis/**` begrenzt;
- der letzte eigene Commit wird nochmals auf erlaubte Pfade verifiziert;
- Pfade ausserhalb von `v5/wissensbasis/**` fuehren zum Abbruch;
- es gibt keinen Force-Push; konkurrierende Remote-Aenderungen lassen den normalen Push fail-closed scheitern.

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

Die Bridge erzeugt keine Gameplay-Fakten und besitzt keine Kampf-, Bewegungs-, Item-, Bank-, Markt- oder Economy-Autoritaet. Die einzige aktive Spiel-Lifecycle-Berechtigung ist der oben beschriebene, begrenzte Start/Wiederanlauf des Merchants bzw. des zuletzt live bewiesenen 1+3-Rosters.

## System-Tray

Die Windows Bridge startet standardmäßig ohne sichtbares Hauptfenster und läuft als Tray-Icon weiter. Die Hintergrundinitialisierung, Telemetrie, der Wissenswächter und der Self-Updater starten trotzdem sofort.

- Doppelklick auf das Tray-Icon oder **Öffnen** zeigt das Hauptfenster.
- Das **X** am Hauptfenster versteckt die Bridge wieder in den Tray, statt den Prozess zu beenden.
- **Beenden** im Tray-Menü beendet die Bridge vollständig.
- Ein Self-Update verwendet einen separaten echten Shutdown-Pfad, damit die Bridge trotz Close-to-Tray sauber ersetzt und neu gestartet werden kann.

