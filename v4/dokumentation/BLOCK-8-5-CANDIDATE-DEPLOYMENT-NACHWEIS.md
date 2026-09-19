# Block 8.5 – Runtime 1.1.5 Candidate-Deploymentnachweis

Status: **Deployment/HTTPS fuer den exakten Candidate bestaetigt; Adventure-Land-Schatten und kontrolliert live inzwischen real bestanden; Soak weiterhin offen.**

## Exakter Candidate

Release-SHA:

`88185523c81687dc16f9647ca5e7568c5e2c228c`

Freigabe-Bindung:

- `laufzeitPfadKennung: block8.5-basisbedienung-runtime`
- `aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c`

Runtime:

- Version: **1.1.5**
- Module: **31**
- Groesse: **228607 Bytes**
- SHA-256: `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

## GitHub-Actions-Nachweis

Historischer Workflow:

`deploy-cloudflare`

Run-ID:

`35402650432`

Job-ID:

`105785689083`

Ergebnis:

**success**

Der Workflow lief exakt auf:

`head_sha = 88185523c81687dc16f9647ca5e7568c5e2c228c`

## Erfolgreiche V4-Schritte

Im exakten Candidate-Run waren erfolgreich:

1. `Build and verify V4 production runtime artifacts`
2. `Publish immutable V4 runtime release to R2`
3. `Verify immutable V4 runtime release in R2`
4. `Verify immutable V4 runtime release over public HTTPS`

Damit wurde fuer genau denselben Candidate nachgewiesen:

- lokaler Runtime-Build erfolgreich,
- SHA-Datei und Runtime-Hash konsistent,
- immutable R2-Veroeffentlichung unter dem exakten Git-SHA,
- R2-Rueckdownload bytegleich,
- oeffentlicher HTTPS-Rueckdownload bytegleich,
- oeffentlicher SHA-256 erneut passend,
- Release-Header-/CORS-/Cache-/Content-Type-Pruefungen im Workflow bestanden.

## Oeffentliche immutable URLs

Runtime:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js`

SHA-256:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.sha256`

Der oeffentliche SHA-Endpunkt liefert aktuell:

`95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

und stimmt exakt mit dem reproduzierbaren Candidate-Build ueberein.

## Einordnung des historischen Workflows

Der Nachweis stammt noch aus dem damals gekoppelten historischen `deploy-cloudflare.yml`.

Dieser Workflow fuehrte neben den V4-Schritten auch V3-/Worker-/D1-/Lifecycle-Schritte aus. Diese zusaetzlichen Seiteneffekte sind **nicht** Teil des V4-Freigabenachweises und waren der Grund fuer die anschliessende Trennung.

Fuer die Frage, ob der exakte Candidate bereits immutable veroeffentlicht und oeffentlich verifiziert wurde, ist der Run dennoch eindeutig:

- exakter Candidate-SHA,
- exakter Runtime-Build,
- exakte R2-Objekte,
- bytegleicher Rueckvergleich,
- oeffentlicher HTTPS-Rueckvergleich,
- passender SHA-256.

Der neue isolierte `release-v4-runtime.yml` ist fuer zukuenftige V4-Releases der vorgesehene Pfad.

Ein erneuter Release desselben Candidate ist fuer den Deployment-/HTTPS-Nachweis nicht erforderlich.

## Manifeststatus

Damit sind fuer den Candidate jetzt korrekt:

- `deploymentPerformed: true`
- `publicHttpsVerified: true`

Der reale Schatten- und kontrollierte Live-Nachweis wurden danach separat erbracht. Deshalb gilt inzwischen:

- `adventureLandShadowVerified: true`
- `adventureLandControlledLiveVerified: true`
- `adventureLandSoakVerified: false`
- `block9Freigegeben: false`

Die zugehoerigen realen Nachweise stehen in `BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json` und `BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json`.

## Naechster Schritt

Der Release-/HTTPS-Preflight ist damit erfuellt.

Als letzte noch offene 8.5.9-Stufe folgt der 10-Minuten-Soak gegen genau diese immutable Runtime 1.1.5 und die beiden gebundenen Vorstufennachweise.

Block 9 bleibt bis zum bestandenen Soak gesperrt.
