# V4 Live-Test-GUI

Status: **verbindlicher Standard fuer kommende manuelle Adventure-Land-Live-Abnahmen.**

## Ziel

Live-Tests sollen nicht mehr davon abhaengen, dass Text aus dem internen Adventure-Land-Log oder den Browser-Entwicklertools abgeschrieben wird.

Die Datei:

`v4/werkzeuge/adventure-land-test-gui.js`

stellt deshalb die globale API:

`V4TestGui`

bereit.

Jeder Test kann damit:

- einen sichtbaren PASS/FAIL/WARN/INFO-Status anzeigen,
- klar benannte Testaktionen als Buttons bereitstellen,
- Ergebnisse strukturiert als JSON darstellen,
- ein Protokoll mit Zeitstempeln sammeln,
- das reine Ergebnis mit **Ergebnis kopieren** kopieren,
- Ergebnis + Protokoll mit **Gesamtbericht kopieren** kopieren,
- fuer gefaehrliche Aktionen einen exakten Bestaetigungstext verlangen.

Die GUI selbst enthaelt keine Adventure-Land-Spielaktion.

## Verbindliches Muster fuer weitere Tests

Neue manuelle Live-Tests sollen ab jetzt nicht mehr nur `game_log(...)` verwenden.

Stattdessen:

1. Test-GUI erzeugen,
2. jeden fachlichen Testschritt als benannten Button registrieren,
3. Voraussetzungen vor dem Freischalten des naechsten Buttons pruefen,
4. PASS/FAIL maschinenlesbar im Ergebnisobjekt ablegen,
5. einen kopierbaren Gesamtbericht erzeugen,
6. aktive/irreversible Schritte mit separater expliziter Bestaetigung versehen,
7. Adventure-Land-Aktionen nur ueber die bereits vorhandene Produktions-Ausfuehrungsgrenze ausloesen.

## Block-8-Komplettpaket

Fuer den aktuellen Gruppenziel-Live-Smoke gibt es:

`v4/werkzeuge/block8-live-test-paket.js`

Diese Datei ist **source-locked** und wird aus folgenden kanonischen Werkzeugen erzeugt:

- `adventure-land-v4-bootstrap.js`
- `adventure-land-test-gui.js`
- `block8-gruppenziel-live-smoke.js`
- `block8-produktions-live-test-gui.js`

Builder:

`v4/werkzeuge/block8-live-test-paket-bauen.mjs`

Das Paket setzt fuer die aktuelle Abnahme:

- `My_Ranger1` und `My_Ranger2` als vertraute Teilnehmer,
- `My_Ranger1` als Testleiter,
- das explizite Schadensprofil der beiden Ranger,
- den bereits verifizierten immutable Runtime-Release
  `bd3cfc0bcd9e69a72a2c2913639e651c4930c182`,
- dessen SHA-256
  `9d3161c2a4c89b972300daab9ca55791af902006cb93f60f2ab879c2d5cb8632`.

Dasselbe Paket wird unveraendert auf beiden Rangern verwendet.

## Block-8-GUI-Schritte

Auf beiden Charakteren:

1. **Runtime laden**
2. **Empfang starten**
3. **Heartbeat senden**

Nur auf dem konfigurierten Testleiter:

4. **Passive Vorpruefung**
5. **ONE-SHOT AUSFUEHREN**

Der Schritt `Passive Vorpruefung` bleibt deaktiviert, bis der Leiter:

- den Empfang gestartet hat,
- einen erfolgreichen Heartbeat gesendet hat,
- mindestens zwei bekannte Teilnehmer sieht.

Die passive Vorpruefung sendet einen frischen Lebensnachweis, bestaetigt mindestens zwei bekannte Teilnehmer sowie das aktuell sichtbare/lokale Ziel und erzeugt dabei **keine** zentrale Gruppenanfrage, **keine** Ressourcensperre und **keine** Smoke-Fassade.

Der one-shot bleibt deaktiviert, bis diese passive Vorpruefung bestanden ist.

Vor dem one-shot muss zusaetzlich exakt der vom bestehenden Smoke-Runner gelieferte Starttext in das GUI-Bestaetigungsfeld eingegeben werden.

Erst der bestaetigte finale Klick erzeugt die zentrale Gruppenanfrage. Weil deren Produktions-Gueltigkeit bewusst nur **1.500 ms** betraegt, fuehrt die GUI anschliessend in derselben Aktion ohne menschliche Zwischenpause aus:

1. frischen lokalen Lebensnachweis senden,
2. zentrale Gruppenzielanfrage erzeugen,
3. Smoke-Fassade installieren,
4. finale Produktionsvorschau lesen,
5. Vorschau exakt gegen die zuvor bestaetigte Ziel-/Monster-Erwartung pruefen,
6. one-shot starten.

Wenn zwischen Vorbereitung und Ausfuehrung eine Voraussetzung kippt, ruft die GUI fail-safe `V4ProduktionsLaufzeit.stoppe()` auf und laesst keine zentrale Ressourcensperre absichtlich stehen.

Die GUI startet den Angriff nicht selbst. Sie delegiert ausschliesslich an:

`V4Block8GruppenZielLiveSmokeRunner`

und bewertet danach dessen Produktionsbericht.

## One-shot PASS

Die GUI markiert den one-shot nur als PASS, wenn gleichzeitig gilt:

- `status === "bestanden"`,
- `echteSpielaktionen.attack === 1`,
- `echteSpielaktionen.sonstige === 0`,
- `ausfuehrungsBrueckeEntfernt === true`,
- `zentralePhase === "abgeschlossen"`,
- `verbleibendeRessourcen.length === 0`,
- `automatischWiederGesperrt === true`.

## Stop/Aufraeumen

Der Button **Stoppen / aufraeumen** ruft ausschliesslich die Produktionsruntime `stoppe()` auf.

PASS verlangt danach:

- Runtime gestoppt,
- Lebensnachweis-Empfang entfernt,
- Smoke-Fassade entfernt,
- keine laufende Gruppenanfrage,
- keine Ressourcensperre.

## CI

`npm run block8-live-test-gui:pruefen`

prueft:

- Syntax der GUI- und Controller-Dateien,
- den GUI-Vertrag fuer kopierbare Berichte,
- das Zwei-Teilnehmer-Gate,
- die ressourcenfreie passive Vorpruefung,
- die atomare finale 1,5-s-Abfolge,
- das Fail-safe Cleanup nach finalem Fehler,
- die explizite one-shot-Bestaetigung,
- das Fehlen direkter Adventure-Land-Aktionsaufrufe im GUI-Controller,
- die Offline-Controller-Tests,
- die Source-Lock-Gleichheit des Komplettpakets.
