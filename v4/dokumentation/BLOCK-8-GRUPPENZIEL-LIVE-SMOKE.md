# Block 8 – kontrollierter Gruppenziel-Live-Smoke

Status: **Produktions-Smoke-Huelle und Browser-Runner implementiert und offline getestet; echter Adventure-Land-Smoke noch nicht ausgefuehrt.**

## Ziel

Der erste aktive Gruppenpfad darf genau eine echte Adventure-Land-Aktion ausloesen:

`GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN -> attack(exakt gebundenes gemeinsames Ziel)`

Die Abnahme ist nur gueltig, wenn Vorschau, Freigabe und Ausfuehrung auf derselben realen zentralen `AktionsSteuerung` beruhen.

## Produktions-Smoke

`laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-smoke.ts` bindet den Test an:

- exakten Charaktername,
- exakte Serverregion,
- exakte Serverkennung,
- exakte Karte,
- exakte Instanz,
- exakte Zielkennung,
- exakte Monsterart,
- genau eine laufende reale `GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN`-Anfrage,
- Besitz von `gruppe` und `kampfziel`,
- frische Produktions-Safety mit `sicher`,
- explizit bereiten normalen Angriff.

Eine abweichende oder unbekannte Voraussetzung blockiert.

## Aktionsaudit

Die Smoke-Huelle uebergibt dem Produktionsadapter einen lokalen Proxy des Adventure-Land-Fensters.

Nur `attack` darf diese Grenze passieren. Der Aufruf wird gezaehlt.

Versucht derselbe Produktionspfad eine andere Adventure-Land-Aktionsfunktion zu verwenden, wird sie vor der echten Spielaktion blockiert und als unerwartete Aktion gezaehlt.

Die globale Adventure-Land-Funktion wird dabei nicht monkeygepatcht.

## One-shot

Freigabetext der Produktions-Smoke-Huelle:

`BLOCK8-GRUPPENZIEL-LIVE-SMOKE-EINMAL`

Die Freigabe gilt nur nach einer frischen Produktionsvorschau und wird vor dem einzigen Versuch verbraucht.

Die darunterliegende `V4Block8GruppenZielAusfuehrungsBruecke` wird vor der eigentlichen Delegation wieder aus dem Browserkontext entfernt.

## Browser-Runner

`werkzeuge/block8-gruppenziel-live-smoke.js` stellt bereit:

`V4Block8GruppenZielLiveSmokeRunner`

Der Runner besitzt selbst keine Adventure-Land-Aktionsfunktion.

Vorgesehene Abfolge:

1. Produktions-Smoke-Fassade `V4Block8GruppenZielLiveSmoke` muss durch die V4-Produktionsruntime installiert sein.
2. `V4Block8GruppenZielLiveSmokeRunner.vorschau()` ausfuehren.
3. Vorschau auf Charakter, Server, Karte, Instanz, Ziel und zentrale Anfrage pruefen.
4. Innerhalb von 5 Sekunden bewusst starten:
   `await V4Block8GruppenZielLiveSmokeRunner.starte("BLOCK8-GRUPPENZIEL-LIVE-SMOKE-STARTEN")`
5. Abschlussbericht auswerten.

## PASS

Der Smoke ist nur bestanden, wenn gleichzeitig gilt:

- `status === "bestanden"`,
- `echteSpielaktionen.attack === 1`,
- `echteSpielaktionen.sonstige === 0`,
- `ausfuehrungsBrueckeEntfernt === true`,
- `zentralePhase === "abgeschlossen"`,
- `verbleibendeRessourcen.length === 0`,
- `automatischWiederGesperrt === true`.

Jede Abweichung ist FAIL.

## Produktions-Runtime-Anbindung

Der allgemeine V4-Produktions-Bootstrap ist inzwischen implementiert. Er besitzt eine zentrale `AktionsSteuerung`, berechnet Produktions-Safety aus realem Spielzustand, verwendet den vorhandenen Lebensnachweis-Austausch und startet Gruppenarbeit ausschliesslich ueber die produktive Block-8-Planungskette. Fuer den aktiven Gruppenziel-Smoke verlangt er mindestens zwei aktive, frische Teilnehmer; Solo- oder stale-Peer-Zustaende blockieren.

`V4ProduktionsLaufzeit.installiereGruppenZielLiveSmoke(...)` installiert die Smoke-Fassade auf genau dieser zentralen Steuerung.

Die kontrollierte Veroeffentlichung ist als immutable Cloudflare-Release-Pfad vorbereitet: `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/<release-sha>/aio-v4-runtime.js` plus die danebenliegende `.sha256`-Datei. Der Deploy-Workflow prueft R2 und den oeffentlichen HTTPS-Endpunkt bytegenau sowie auf CORS, `no-store` und den exakten Release-SHA. Der echte Smoke bleibt offen, bis ein finaler Main-Commit diese Deployment-Pruefung bestanden hat und genau dessen URL/Hash in Adventure Land geladen wurden.
