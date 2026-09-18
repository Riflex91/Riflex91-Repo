# Block 8.5 – Runtime 1.1.5 Release-Candidate

Status: **Release-Candidate reproduzierbar gebunden; noch nicht deployed und noch nicht real in Adventure Land freigegeben.**

## Zweck

Die operativen Freigabestufen aus Schritt 8.5.9 duerfen nicht gegen den historischen Block-8-Release Runtime 1.1.4 ausgefuehrt werden.

Fuer die neuen Block-8.5-Bedien- und Recovery-Pfade wird deshalb ein exakter Runtime-1.1.5-Release-Candidate gebunden.

## Exakter Candidate-Commit

Git-Commit:

`88185523c81687dc16f9647ca5e7568c5e2c228c`

Dieser Commit enthaelt den final vorbereiteten 8.5.9-Live-Nachweisrunner und die Runtime-1.1.5-Quellen.

Der Candidate wird bewusst an einen exakten Git-SHA gebunden und nicht an `main`, `latest` oder einen beweglichen Branch.

## Reproduzierbarer Runtime-Build

Manifest:

`v4/dokumentation/BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json`

Erwarteter Build:

- Runtime-API-Version: **1.1.5**
- Bundle-Version: **4.0.0-alpha.0**
- Module: **31**
- Groesse: **228607 Bytes**
- SHA-256: `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

Der Hash ist der Inhalt des gebauten Runtime-Bundles, nicht ein Git-Hash.

## Automatische Reproduzierbarkeitspruefung

Werkzeug:

`v4/werkzeuge/block8-5-runtime-1-1-5-release-kandidat-pruefen.mjs`

Die Pruefung:

1. validiert das Candidate-Manifest,
2. verlangt Runtime-Version 1.1.5 in der Produktionsquelle,
3. prueft die vorhandene immutable Deployment-Pipeline auf expliziten `release_sha`,
4. baut die Produktionsruntime erneut aus den TypeScript-Quellen,
5. vergleicht Module, Bytegroesse und SHA-256 exakt mit dem Manifest,
6. verweigert jede vorzeitige Behauptung von Deployment oder realer Adventure-Land-Freigabe.

Damit wird ein Quellcode-Drift nach dem Candidate sichtbar, bevor der Candidate als derselbe Runtime-Build verwendet werden kann.

## Deployment-Pipeline

Die vorhandene `.github/workflows/deploy-cloudflare.yml` besitzt bereits die erforderlichen Sicherheitsgrenzen:

- expliziter `release_sha`,
- Checkout genau dieses Commits,
- lokaler Runtime-Build,
- lokaler SHA-256-Vergleich,
- immutable R2-Pfade unter `releases/v4/<release-sha>/...`,
- Bytevergleich nach R2-Download,
- erneute SHA-256-Pruefung,
- oeffentlicher HTTPS-Download,
- erneuter Byte- und SHA-Vergleich,
- CORS-/Cache-/Content-Type-Pruefung,
- Header `x-aio-v4-release-sha`.

Der Candidate selbst loest diesen Workflow **nicht** aus.

## Noch ausdrücklich offen

Das Manifest setzt weiterhin fest:

- `deploymentPerformed: false`
- `publicHttpsVerified: false`
- `adventureLandShadowVerified: false`
- `adventureLandControlledLiveVerified: false`
- `adventureLandSoakVerified: false`
- `block9Freigegeben: false`

Diese Felder sind keine Schalter fuer die Runtime.

Sie dokumentieren nur, welche externen Nachweise noch fehlen.

## Warum noch kein Deployment in diesem Schritt

Ein Deployment veroeffentlicht reale Artefakte in der externen Cloudflare-/R2-Infrastruktur.

Dieser Commit bereitet nur die reproduzierbare technische Bindung vor.

Erst ein tatsaechlich erfolgreich durchgelaufener Deployment-Workflow fuer exakt

`88185523c81687dc16f9647ca5e7568c5e2c228c`

kann einen Deployment- und HTTPS-Nachweis liefern.

Danach darf der 8.5.9-Adventure-Land-Nachweisrunner gegen genau diese immutable URL und genau den verifizierten SHA-256 ausgefuehrt werden.

## Block-9-Grenze

Auch ein erfolgreiches Runtime-Deployment allein reicht nicht fuer Block 9.

Danach fehlen weiterhin die operativen Stufen:

1. Schatten,
2. kontrolliert live,
3. Soak.

Erst wenn das sequenzielle 8.5.9-Freigabe-Gate fuer denselben Aenderungsstand alle vier Stufen inklusive Offline als bestanden bewertet, darf:

`block9Freigegeben: true`

werden.

Bis dahin bleibt Block 9 gesperrt.
