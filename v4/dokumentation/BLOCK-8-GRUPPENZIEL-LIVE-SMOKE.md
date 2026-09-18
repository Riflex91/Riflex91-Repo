# Block 8 – kontrollierter Gruppenziel-Live-Smoke

Status: **BESTANDEN – echter Adventure-Land-one-shot Live-Smoke erfolgreich ausgefuehrt und dokumentiert.**

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

Die Smoke-Huelle uebergibt dem Produktionsadapter einen lokalen Audit-Proxy.

Dabei bleibt die Adventure-Land-Kontexttrennung explizit erhalten:

- read-only Spielzustand wie `character`, `entities`, Serverdaten und Cooldowns wird aus dem `parent`-/Spielfenster gelesen,
- Aktionsfunktionen wie `attack` werden aus dem lokalen Adventure-Land-Codekontext bezogen.

Diese Trennung entspricht der echten Adventure-Land-Codeausfuehrung. Der Audit-Proxy kopiert oder monkeypatcht keine globale Aktionsfunktion.

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

Nach dem im echten Smoke entdeckten Millisekunden-Zeitordnungsfehler und der danach sichtbar gewordenen Adventure-Land-Code-/Parent-Kontexttrennung wurden beide Produktionspfade korrigiert. Die kontrollierte Veroeffentlichung ist fuer den aktuellen korrigierten immutable Main-Release `6e63d2f8b12fd27bba3b9db50d91c4100bedc9ec` bestanden. Runtime und SHA-256 wurden aus R2 und ueber den oeffentlichen HTTPS-Worker bytegenau verifiziert. Der veroeffentlichte SHA-256 ist `d0c2893784891b971caf2cbaca495b62643ffa098009c49bd508781c2e014aa6`.

Der echte Smoke mit genau dieser URL/Hash-Kombination wurde am 2026-09-18 erfolgreich ausgefuehrt. Der detaillierte Nachweis steht in `BLOCK-8-LIVE-SMOKE-NACHWEIS.md`.


## Einheitliche Live-Test-GUI

Die weitere manuelle Block-8-Abnahme verwendet ab jetzt die wiederverwendbare `V4TestGui` statt ausschliesslich das interne Adventure-Land-Log.

Fuer den aktuellen Test existiert das source-locked Komplettpaket:

`werkzeuge/block8-live-test-paket.js`

Es ist auf beiden Rangern identisch und stellt einen gefuehrten Ablauf bereit:

1. Runtime laden,
2. Empfang starten,
3. Heartbeat senden,
4. auf dem Testleiter eine passive, ressourcenfreie Ziel-Vorpruefung,
5. nach separatem exaktem Bestaetigungstext den atomaren one-shot,
6. Stop/Aufraeumen.

Jeder Schritt schreibt ein strukturiertes Ergebnis in ein kopierbares Textfeld. **Ergebnis kopieren** kopiert den letzten strukturierten Zustand; **Gesamtbericht kopieren** kopiert Ergebnis und komplettes Testprotokoll.

Der one-shot-Button wird erst nach einer bestandenen passiven Vorpruefung aktiv. Diese Vorpruefung erzeugt keine zentrale Anfrage, keine Ressourcenbelegung und keine Smoke-Fassade. Der finale bestaetigte Klick erzeugt die 1.500-ms-Gruppenanfrage und fuehrt Vorbereitung, Smoke-Installation, finale Produktionsvorschau und one-shot ohne menschliche Zwischenpause aus. Bei einem Fehler nach Verbrauch der Vorbereitung wird fail-safe zentral gestoppt. Die GUI besitzt keinen direkten Adventure-Land-Aktionsaufruf.


## Im echten Live-Smoke gefundene Kontexttrennung

Der echte one-shot vom 2026-09-18 erreichte alle Safety-, Ziel-, Ressourcen- und Produktionsvorschau-Gates, brach aber unmittelbar vor der Spielaktion mit `Adventure-Land-Funktion attack ist nicht verfuegbar.` ab.

Die Ursache war kein fehlendes Adventure-Land-API, sondern eine falsche Testannahme: Offline lag `attack` bisher im simulierten Spielfenster, waehrend Adventure Land die Aktionsfunktion im lokalen Codekontext bereitstellt und den read-only Spielzustand im `parent`-Fenster.

Der Regressionstest bildet diese reale Trennung nun ausdruecklich ab: `spielFenster.attack === undefined`, `zielKontext.attack === function`. Der Produktions-Smoke muss damit exakt einen auditierten Angriff ueber den lokalen Codekontext ausfuehren.


## Erfolgreicher echter Live-Smoke

Am 2026-09-18 bestand der reale one-shot mit `My_Ranger1` und `My_Ranger2` auf `EU I`, Karte/Instanz `main/main`, gegen das gebundene Ziel `2002152` vom Typ `tortoise`.

Der Produktionsbericht bestaetigte exakt einen `attack`, keine sonstige Adventure-Land-Aktion, automatische Wiedersperrung, entfernte Ausfuehrungsbruecke, zentrale Phase `abgeschlossen` und keine verbleibenden Ressourcen.

Siehe: `BLOCK-8-LIVE-SMOKE-NACHWEIS.md`.
