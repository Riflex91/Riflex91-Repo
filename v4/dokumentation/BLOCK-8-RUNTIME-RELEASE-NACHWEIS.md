# Block 8 – Nachweis der immutable V4-Runtime-Veroeffentlichung

Status: **Aktueller Release mit korrigierter Safety-Zeitordnung und realer Adventure-Land-Code-/Parent-Kontexttrennung erfolgreich veroeffentlicht und ueber den oeffentlichen HTTPS-Endpunkt verifiziert. Dieser konkrete Release wurde noch nicht erneut im Adventure-Land-Live-Smoke ausgefuehrt.**

Stand: 2026-09-18

## Exakter Release

Git-Commit:

`6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec`

Cloudflare-Deployment-Workflow:

- Run-ID: `35368554374`
- Job-ID: `105676781988`
- Ergebnis: **success**

Gebautes Runtime-Artefakt:

- Module: **27**
- Groesse: **197116 Bytes**
- SHA-256: `d0c2893784891b971caf2cbaca495b62643ffa098009c49bd508781c2e014aa6`

## Immutable URLs

Runtime:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec/aio-v4-runtime.js`

SHA-256:

`https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec/aio-v4-runtime.sha256`

R2-Objekte:

- `releases/v4/6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec/aio-v4-runtime.js`
- `releases/v4/6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec/aio-v4-runtime.sha256`

Es gibt fuer diesen V4-Pfad keinen beweglichen `latest`-Alias.

## Erfolgreich nachgewiesene Deployment-Gates

Der Main-Deployment-Lauf hat nacheinander erfolgreich bestanden:

1. V3-Build unveraendert,
2. Installation der V4-Build-Abhaengigkeiten,
3. strikten V4-Produktionsruntime-Build,
4. lokalen Vergleich des rohen 64-stelligen Hash-Artefakts mit dem berechneten SHA-256 der Runtime,
5. komplette Cloudflare-Worker- und Release-Tests,
6. vorhandene Cloudflare-Credentials,
7. D1-Konfiguration,
8. vorhandenen R2-Bucket,
9. R2-Lifecycle-Guard,
10. Worker-Deploy,
11. Cloudflare-Deployment-Record,
12. bestehende V3-Release-Veroeffentlichung und Rueckverifikation,
13. Upload der V4-Runtime und ihrer Hashdatei unter dem exakten Git-SHA,
14. Byte-fuer-Byte-Rueckvergleich beider V4-Artefakte aus R2,
15. erneute SHA-256-Pruefung der aus R2 geladenen Runtime,
16. Download beider V4-Artefakte ueber den oeffentlichen HTTPS-Worker,
17. Byte-fuer-Byte-Vergleich der oeffentlichen Antworten mit dem lokalen Build,
18. Pruefung von CORS `*`, `no-store`, Content-Type und `x-aio-v4-release-sha`,
19. erneute SHA-256-Pruefung der oeffentlich heruntergeladenen Runtime.

Damit ist die **Veroeffentlichungsschicht** fuer diesen exakten Release bestanden.

## Noch nicht ausgefuehrt

Nicht Bestandteil dieses Nachweises waren:

- Laden der Runtime im echten Adventure-Land-Codekontext,
- Aktivierung des Produktions-Bootstraps,
- Senden eines Produktions-Lebensnachweises,
- Vorbereitung einer echten Gruppenzielanfrage,
- Installation der Live-Smoke-Fassade im Spiel,
- echter `attack(...)`-Aufruf.

Es wurde durch diesen Release-Nachweis keine Adventure-Land-Spielaktion ausgeloest.

## Naechster sicherer Schritt: read-only Laden

Vor jeder aktiven Freigabe muss genau dieser Release zuerst passiv geladen werden.

Vorgesehene Konfiguration:

```js
globalThis.AIO_V4_RUNTIME_CONFIG = Object.freeze({
  aktivFreigegeben: false
});

globalThis.AIO_V4_BOOTSTRAP_CONFIG = Object.freeze({
  runtimeUrl: 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec/aio-v4-runtime.js',
  runtimeSha256: 'd0c2893784891b971caf2cbaca495b62643ffa098009c49bd508781c2e014aa6'
});
```

Danach wird der vorhandene `werkzeuge/adventure-land-v4-bootstrap.js` im Adventure-Land-Codekontext geladen und ausschliesslich:

```js
await V4Bootstrap.lade();
V4Bootstrap.status();
V4ProduktionsLaufzeit.status();
```

geprueft.

Der read-only PASS verlangt mindestens:

- `V4Bootstrap.status().bereit === true`,
- `V4ProduktionsLaufzeit.status().aktivFreigegeben === false`,
- `V4ProduktionsLaufzeit.status().empfangInstalliert === false`,
- `V4ProduktionsLaufzeit.status().liveSmokeInstalliert === false`,
- keine laufende Gruppenanfrage,
- keine Ressourcensperre,
- keine Adventure-Land-Spielaktion.

Erst nach diesem read-only PASS darf die getrennte kontrollierte Live-Smoke-Abfolge fortgesetzt werden.
