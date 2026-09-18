# Block 8.5 – V4-only Runtime-Release-Workflow

Status: **isolierter manueller Release-Pfad implementiert; noch nicht ausgefuehrt.**

## Ziel

Der bisherige allgemeine Cloudflare-Deployment-Workflow ist fuer den Block-8.5-Runtime-Nachweis zu breit.

Er kann neben der V4-Runtime auch:

- V3-Artefakte bauen und veroeffentlichen,
- den Cloudflare-Worker deployen,
- D1-Konfiguration vorbereiten,
- R2-Lifecycle-Regeln veraendern.

Fuer die immutable Runtime-1.1.5-Veroeffentlichung ist das nicht erforderlich.

Deshalb existiert jetzt der getrennte Workflow:

`.github/workflows/release-v4-runtime.yml`

Er ist ausschliesslich fuer die immutable V4-Runtime gedacht.

Der allgemeine `.github/workflows/deploy-cloudflare.yml` ist ab dieser Trennung wieder ausschliesslich fuer V3 und das Dashboard zustaendig. Er besitzt keinen `v4/**`-Push-Trigger und keine V4-Build-, Publish- oder HTTPS-Verifikationsschritte mehr.

## Nur manueller Start

Der Workflow besitzt nur:

`workflow_dispatch`

Er besitzt keinen:

- `push`-Trigger,
- `pull_request`-Trigger.

Ein Lauf muss von `main` gestartet werden.

Zusaetzlich sind zwei Eingaben Pflicht:

- `release_sha`
- `confirmation`

Die Bestaetigung muss exakt lauten:

`PUBLISH-V4-IMMUTABLE:<release_sha>`

Damit kann ein normaler Merge oder Push keine Runtime-Veroeffentlichung ausloesen.

## Zwei getrennte Checkouts

Der Workflow trennt:

### Kontrollstand

Checkout unter:

`control/`

Dieser Stand liefert:

- das aktuelle Release-Candidate-Manifest,
- die aktuelle Freigabe- und Sicherheitslogik,
- die Cloudflare-Werkzeuge.

### Exakter Runtime-Candidate

Checkout unter:

`release/`

mit:

`ref: <release_sha>`

Nur aus diesem exakten Commit wird die V4-Produktionsruntime gebaut.

Damit wird nicht versehentlich die Runtime des aktuellen beweglichen `main` veroeffentlicht.

## Candidate-Bindung

Vor jedem Build liest der Workflow:

`BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json`

und verlangt:

- Manifest-Schema 1,
- Status `release_candidate`,
- `manifest.releaseSha === release_sha`,
- Runtime-Version 1.1.5,
- `laufzeitPfadKennung: block8.5-basisbedienung-runtime`,
- `aenderungsKennung: git:<release_sha>`,
- gueltige erwartete Bytegroesse,
- gueltigen erwarteten SHA-256,
- `block9Freigegeben: false`.

## Exakter lokaler Build

Im `release/v4`-Checkout wird:

`npm run produktions-runtime:bauen`

ausgefuehrt.

Vor jeder externen Aenderung werden verglichen:

- SHA-Datei des Builds,
- tatsaechlicher SHA-256 der Runtime,
- Bytegroesse der Runtime

gegen das Candidate-Manifest.

Ein abweichender Build stoppt den Workflow vor Cloudflare.

## Keine V3- oder Worker-Aenderung

Der Workflow darf nicht ausfuehren:

- V3-Build,
- V3-Release-Publish,
- `wrangler deploy`,
- D1-Kommandos,
- R2-Lifecycle-Aenderungen.

Damit kann eine V4-Runtime-Veroeffentlichung nicht nebenbei einen V3-Stand zuruecksetzen oder den Dashboard-Worker veraendern.

## Isolierte R2-Konfiguration

Fuer den R2-Zugriff wird eine temporaere minimale Wrangler-Konfiguration erzeugt.

Sie enthaelt keine:

- D1-Bindung,
- Worker-Quelle,
- Assets,
- V3-Release-Logik.

Vor dem Schreiben wird nur geprueft, dass der bestehende Bucket erreichbar ist.

## Immutable ohne blindes Ueberschreiben

Die Zielpfade sind:

- `releases/v4/<release_sha>/aio-v4-runtime.js`
- `releases/v4/<release_sha>/aio-v4-runtime.sha256`

Vor jedem Put fragt der Workflow das Zielobjekt ueber die Cloudflare-R2-API ab.

Bei:

- **HTTP 200**: vorhandene Bytes muessen exakt gleich sein; sonst FAIL,
- **HTTP 404**: das Objekt darf neu geschrieben werden,
- jedem anderen Status: FAIL.

Ein bereits vorhandenes abweichendes Objekt wird damit niemals durch einen neuen Candidate ueberschrieben.

Der Workflow ist dadurch auch fuer einen identischen Wiederholungslauf idempotent.

## R2-Rueckverifikation

Nach dem Publish werden beide Objekte erneut aus R2 geladen.

Danach muessen bestehen:

- Bytevergleich Runtime,
- Bytevergleich SHA-Datei,
- SHA-256 der aus R2 geladenen Runtime gegen Candidate-Manifest.

## Oeffentliche HTTPS-Rueckverifikation

Der bereits vorhandene oeffentliche Worker wird **nicht neu deployed**.

Stattdessen werden die neuen immutable R2-Objekte ueber den vorhandenen V4-Release-Endpunkt geladen.

Geprueft werden:

- Runtime-Bytes,
- SHA-Datei,
- SHA-256,
- CORS `*`,
- `Cache-Control: no-store`,
- JavaScript-/Text-Content-Type,
- `x-aio-v4-release-sha: <release_sha>`.

Nur wenn auch dieser externe Rueckweg exakt passt, kann der Deployment-/HTTPS-Nachweis als technisch bestanden gelten.

## Credentials

Anders als der allgemeine automatische Deployment-Workflow ueberspringt dieser manuelle Release-Pfad fehlende Cloudflare-Credentials nicht still.

Fehlt:

- `CLOUDFLARE_API_TOKEN` oder
- `CLOUDFLARE_ACCOUNT_ID`

bricht der Workflow ab.

## Aktueller Stand

Der Workflow ist nur vorbereitet und strukturell abgesichert.

Er wurde fuer Runtime 1.1.5 noch **nicht ausgefuehrt**.

Beim Merge des vorbereitenden PR #358 wurde der damals noch gekoppelte historische `deploy-cloudflare.yml`-Workflow jedoch automatisch ueber seinen alten `v4/**`-Push-Trigger gestartet. Run `35403715822` veroeffentlichte dadurch unter dem Merge-SHA `14d503fc8a121d8c6422f68b0f1d74ac26a34df3` eine immutable V4-Runtime und verifizierte sie ueber R2 und HTTPS. Dieser Nebenrelease wurde **nicht** ueber den isolierten V4-only Workflow gestartet und ist nicht an die Freigabe-`aenderungsKennung` `git:88185523c81687dc16f9647ca5e7568c5e2c228c` gebunden. Er zaehlt deshalb nicht als 8.5.9-Deploymentnachweis.

Damit bleiben im Candidate-Manifest weiterhin:

- `deploymentPerformed: false`
- `publicHttpsVerified: false`
- `adventureLandShadowVerified: false`
- `adventureLandControlledLiveVerified: false`
- `adventureLandSoakVerified: false`
- `block9Freigegeben: false`

## Danach

Erst nach einem erfolgreichen manuellen Release-Lauf fuer exakt:

`88185523c81687dc16f9647ca5e7568c5e2c228c`

darf die reale Adventure-Land-Abfolge beginnen:

1. Schattennachweis,
2. kontrollierter Live-Nachweis,
3. Soak-Nachweis.

Block 9 bleibt bis zum vollstaendigen sequenziellen 8.5.9-Gate gesperrt.
