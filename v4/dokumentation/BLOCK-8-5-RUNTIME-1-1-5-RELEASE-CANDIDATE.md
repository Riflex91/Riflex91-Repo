# Block 8.5 – Runtime 1.1.5 Release-Candidate

Status: **Release-Candidate reproduzierbar gebunden; Deployment und oeffentliche HTTPS-Verifikation bestaetigt; reale Adventure-Land-Freigaben noch offen.**

## Zweck

Die operativen Freigabestufen aus Schritt 8.5.9 duerfen nicht gegen den historischen Block-8-Release Runtime 1.1.4 ausgefuehrt werden.

Fuer die neuen Block-8.5-Bedien- und Recovery-Pfade wird deshalb ein exakter Runtime-1.1.5-Release-Candidate gebunden.

## Exakter Candidate-Commit

Git-Commit:

`88185523c81687dc16f9647ca5e7568c5e2c228c`

Dieser Commit enthaelt den final vorbereiteten 8.5.9-Live-Nachweisrunner und die Runtime-1.1.5-Quellen.

Der Candidate wird bewusst an einen exakten Git-SHA gebunden und nicht an `main`, `latest` oder einen beweglichen Branch.

Die Freigabe-Nachweise muessen exakt folgende Bindung verwenden:

- `laufzeitPfadKennung: block8.5-basisbedienung-runtime`
- `aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c`

Damit verweisen Runtime-Release, Schatten-, Live- und Soak-Nachweis auf denselben unveraenderlichen Aenderungsstand.

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
3. prueft den isolierten V4-only Runtime-Release-Workflow auf expliziten `release_sha`, manuelle Bestaetigung und fehlende V3-/Worker-Autoritaet,
4. baut die Produktionsruntime erneut aus den TypeScript-Quellen,
5. vergleicht Module, Bytegroesse und SHA-256 exakt mit dem Manifest,
6. verlangt den bestaetigten Deployment-/HTTPS-Nachweis und verweigert weiterhin jede vorzeitige Adventure-Land-Freigabe.

Damit wird ein Quellcode-Drift nach dem Candidate sichtbar, bevor der Candidate als derselbe Runtime-Build verwendet werden kann.

## Isolierter V4-only Release-Pfad

Fuer diesen Candidate ist jetzt ausschliesslich vorgesehen:

`.github/workflows/release-v4-runtime.yml`

Der Workflow besitzt:

- nur manuellen `workflow_dispatch`,
- expliziten `release_sha`,
- exakte Bestaetigung `PUBLISH-V4-IMMUTABLE:<release_sha>`,
- getrennten Kontroll- und Candidate-Checkout,
- lokalen Runtime-Build und SHA-/Bytevergleich,
- deaktivierte automatische Cloudflare-Ressourcenprovisionierung,
- immutable R2-Pfade unter `releases/v4/<release-sha>/...`,
- Schutz vor Ueberschreiben eines abweichenden vorhandenen Objekts,
- Byte-/SHA-Rueckverifikation aus R2,
- oeffentliche HTTPS-Rueckverifikation ueber den bereits vorhandenen Worker,
- CORS-/Cache-/Content-Type-Pruefung,
- Header `x-aio-v4-release-sha`.

Der Workflow baut oder veroeffentlicht **kein V3**, fuehrt **kein `wrangler deploy`** aus und veraendert weder D1 noch R2-Lifecycle-Regeln.

Der breite historische `.github/workflows/deploy-cloudflare.yml` ist fuer diesen Block-8.5-Runtime-Nachweis nicht mehr der vorgesehene Release-Pfad und wird auf V3/Dashboard-only getrennt: kein `v4/**`-Push-Trigger und keine V4-Build-/Publish-/HTTPS-Schritte mehr.

Der Candidate selbst loest den V4-only Workflow **nicht** aus.

Ein bereits existierender Nebenrelease unter `14d503fc8a121d8c6422f68b0f1d74ac26a34df3` stammt aus dem alten automatisch gekoppelten Workflow und wird fuer 8.5.9 ausdruecklich **nicht** anerkannt. Der gueltige Candidate bleibt `88185523c81687dc16f9647ca5e7568c5e2c228c` mit `aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c`.

## Deployment und oeffentliche HTTPS-Verifikation

Der exakte Candidate wurde bereits im historischen Run

`35402650432`

mit Job

`105785689083`

erfolgreich gebaut, immutable nach R2 veroeffentlicht, aus R2 bytegleich rueckverifiziert und ueber den oeffentlichen HTTPS-Endpunkt erneut verifiziert.

Der oeffentliche SHA-Endpunkt liefert:

`95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`

Damit sind im Manifest korrekt:

- `deploymentPerformed: true`
- `publicHttpsVerified: true`

Der detaillierte Nachweis steht in:

`BLOCK-8-5-CANDIDATE-DEPLOYMENT-NACHWEIS.md`

## Noch ausdrücklich offen

Weiterhin **false** bleiben:

- `adventureLandShadowVerified: false`
- `adventureLandControlledLiveVerified: false`
- `adventureLandSoakVerified: false`
- `block9Freigegeben: false`

Diese Felder sind keine Schalter fuer die Runtime.

Sie dokumentieren die noch fehlenden realen Adventure-Land-Nachweise.

Der 8.5.9-Adventure-Land-Nachweisrunner darf jetzt gegen genau diese immutable URL und genau den verifizierten SHA-256 ausgefuehrt werden.

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
