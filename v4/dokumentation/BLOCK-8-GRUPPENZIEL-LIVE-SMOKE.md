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

Die kontrollierte Veroeffentlichung ist fuer den immutable Main-Release `47288ddfdef03ded63142670cdaca5d7ed251a75` bestanden. Runtime und SHA-256 wurden aus R2 und ueber den oeffentlichen HTTPS-Worker bytegenau verifiziert. Der veroeffentlichte SHA-256 ist `8e50143a671a8ce30d14150cb14971c20c89daa5dbb651064dfb1ea4f13cdcfa`.

Der echte Smoke bleibt offen, bis genau diese URL/Hash-Kombination read-only im echten Adventure-Land-Kontext geladen wurde und die gesperrte Produktionsruntime ohne Gruppenanfrage, Ressourcensperre oder Spielaktion bestaetigt ist.
