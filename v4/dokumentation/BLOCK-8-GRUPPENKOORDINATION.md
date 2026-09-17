# Block 8 – Gruppenkoordination

Status: **in Arbeit**.

Live-Stand vom 2026-09-17: Ranger-zu-Ranger-Lebensnachweis, read-only Gruppenkoordination mit Aktiv/Stale/Reconnect-Aufgabenentzug und Wiederzuordnung sowie die automatische Block-7-Sicherheitskopplung inklusive fehlender-Quellen-Fail-safe sind erfolgreich live bestaetigt.

## Ziel

Mehrere eigene Charaktere sollen als Gruppe zusammenarbeiten, ohne hart verdrahtete Klassenrollen und ohne dass ein einzelner Charakter eigenmaechtig Gruppenentscheidungen erfindet.

Der aktuelle Block-8-Unterbau bleibt read-only und deterministisch. Er plant bzw. bewertet Gruppenarbeit, fuehrt aber noch keine koordinierte Adventure-Land-Spielaktion aus.

## Teilnehmer-Lebensnachweis

Jeder eigene Charakter liefert einen `GruppenTeilnehmerMeldung`-Datensatz mit:

- eindeutiger Charakterkennung und Name,
- Klasse nur fuer Diagnose,
- Serverregion und Serverkennung,
- Karte und Instanz,
- explizitem Lebenszustand,
- Lebens- und Manaanteil,
- aktuellem Ziel,
- aktueller Block-7-Kampf-Gefahrenstufe,
- Faehigkeitsprofil,
- Zeitstempel und laufender Nummer.

Die produktive Kopplung verlangt eine `KampfSicherheitsEntscheidung` desselben `Spielzustand`-Zeitpunkts. Im Adventure-Land-Livepfad kommt die Gefahrenstufe aus `V4Block7KampfsicherheitsQuelle`; eine manuelle `gefahrenStufe` ist seit Lebensnachweis-Version `1.1.0` verboten.

Standardmaessig gilt ein Gruppen-Lebensnachweis nach 5 Sekunden als veraltet. Die Live-Sicherheitsbewertung selbst muss deutlich frischer sein; der Live-Lebensnachweis verwendet dafuer standardmaessig maximal 1500 ms.

## Faehigkeiten statt Klassenrollen

Die Gruppenfaehigkeiten sind:

- `heilen`
- `schaden`
- `aggro`
- `schutz`
- `unterstuetzung`

Jeder Teilnehmer meldet fuer jede Faehigkeit einen numerischen Wert. Die Aufgabenverteilung waehlt den aktuell aktiven Teilnehmer mit dem hoechsten Wert. Bei Gleichstand entscheidet die Charakterkennung lexikographisch, damit das Ergebnis unabhaengig von Eingabereihenfolge reproduzierbar bleibt.

Die Klasse darf die Auswahl nicht beeinflussen.

## Teilnehmerstatus

Ein Teilnehmer wird als `aktiv` behandelt, wenn:

- sein Lebensnachweis aktuell ist,
- `lebendig` explizit `true` ist,
- Serverregion und Serverkennung mit dem eigenen Charakter uebereinstimmen,
- Karte und Instanz uebereinstimmen.

Andernfalls wird er als `veraltet`, `ausgefallen`, `falsche_welt` oder `falsche_instanz` markiert. Nicht aktive Teilnehmer erhalten keine Gruppenaufgaben. Ein spaeterer frischer Lebensnachweis kann denselben Charakter wieder aktivieren und Aufgaben neu zuordnen.

## Gemeinsame Sicherheitslage

Die Gruppenkoordination bewertet die hoechste relevante Gefahrenstufe aller aktiven Teilnehmer:

- `sicher` oder `angespannt` -> normaler Gruppenbetrieb moeglich,
- `gefaehrlich` oder `kritisch` -> Gruppenbetrieb `sicherheit`,
- `unbekannt` -> fail-safe `blockiert`.

Bei `sicherheit` oder `blockiert` wird kein normales gemeinsames Kampfziel ausgegeben. Block 8 darf die Block-7-Sicherheitslage weder abschwaechen noch ueberschreiben.

## Gemeinsames Ziel

Im normalen Gruppenbetrieb wird das von den aktiven Teilnehmern am haeufigsten gemeldete nicht-leere Ziel als gemeinsames Ziel ausgegeben. Bei Gleichstand gewinnt die lexikographisch kleinere Zielkennung, damit gleiche Eingaben reproduzierbar bleiben.

## Fail-safe Verhalten

Die Gruppenkoordination bzw. der Live-Lebensnachweis blockiert, wenn unter anderem:

- der eigene Lebensnachweis fehlt oder veraltet ist,
- der eigene Lebenszustand nicht explizit lebendig ist,
- die gemeinsame Sicherheitslage unbekannt ist,
- die Block-7-Live-Sicherheitsquelle fehlt,
- deren Bewertung stale oder formal ungueltig ist,
- eine manuelle Live-`gefahrenStufe` versucht wird.

Fehlende Daten werden nicht durch Klassenannahmen oder geratenen Zustand ersetzt.

Der fehlende-Quellen-Fall wurde am 2026-09-17 live bestaetigt: Nach Entfernen der Block-7-Quelle brach `sendeEinmal()` vor `send_cm` ab und der Sendecounter blieb unveraendert bei `216`.

## Architekturgrenze

`spiellogik/gruppen-koordination.ts` darf keine Adventure-Land-Spielaktion direkt ausfuehren. Spaetere aktive Gruppenaktionen muessen ueber `AktionsSteuerung` und die Ressource `gruppe` beziehungsweise die benoetigten Kampf- und Bewegungsressourcen laufen.

Die Block-7-Live-Sicherheitsquelle ist ebenfalls read-only und darf keinerlei Adventure-Land-Spielaktion oder Kommunikation ausfuehren. Nur der bestehende Lebensnachweis-Austausch darf adressiertes `send_cm` verwenden.

## Nachweise

Automatisiert vorhanden sind unter anderem:

- Faehigkeitsverteilung statt Klassenrollen,
- Stale-/Ausfall-Ausschluss und Neuverteilung,
- Reconnect-Wiederaufnahme,
- Server-/Instanzabgleich,
- Sicherheitsvorrang,
- deterministische Zielwahl,
- Produktionskopplung Block 7 -> Block 8,
- Zeitstempelbindung derselben Sicherheitsentscheidung,
- Browser-/Produktionsparitaet der Live-Sicherheitsquelle,
- Blockierung bei fehlender oder stale Live-Sicherheit vor `send_cm`.

Live bestaetigt sind inzwischen:

- Ranger-zu-Ranger-Lebensnachweis,
- `aktiv -> veraltet -> Aufgabe entzogen -> Reconnect -> aktiv -> Aufgabe wieder zugeordnet`,
- automatische Uebernahme einer echten Block-7-`sicher`-Bewertung in beide Ranger-Lebensnachweise,
- fehlende Block-7-Live-Sicherheitsquelle blockiert vor `send_cm`.

## Naechste Block-8-Schritte

Bereits erreicht:

1. Teilnehmermeldungen aus echten `Spielzustand`-Daten.
2. read-only Lebensnachweis-Austausch zwischen eigenen Charakteren.
3. echter read-only Koordinationsschatten mit Aktiv/Stale/Reconnect-Aufgabenwechsel.
4. Produktionskopplung der Gefahrenstufe an Block 7.
5. automatische, source-locked Live-Sicherheitsquelle und Lebensnachweis v1.1.0.
6. echte Zwei-Ranger-Live-Abnahme der automatischen Block-7-Gefahrenquelle.
7. Live-Fail-safe bei fehlender Block-7-Quelle ohne `send_cm`.

Als naechstes folgen getrennt und testbar:

1. konkrete Gruppenaktionsplanung fuer Heilen, Aggro, Schutz, Unterstuetzung und gemeinsames Ziel.
2. Wiederverbindungs- und Gruppenwiederaufbau-Planung ueber die zentrale Aktionssteuerung.
3. Mehrcharakter-Wiederholungen und gezielte Ausfalltests fuer die konkreten Gruppenplaene.
4. erst danach begrenzte aktive Gruppen-Smoke-Tests und der spaetere 72-Stunden-Gruppentest.