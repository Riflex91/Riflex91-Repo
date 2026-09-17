# Block 8 – Gruppenkoordination

Status: **in Arbeit**.

Live-Stand vom 2026-09-17: echter Ranger-zu-Ranger-Lebensnachweis sowie read-only Gruppenkoordination mit Aktiv/Stale/Reconnect-Aufgabenentzug und Wiederzuordnung sind erfolgreich bestaetigt.

## Ziel

Mehrere eigene Charaktere sollen als Gruppe zusammenarbeiten, ohne hart verdrahtete Klassenrollen und ohne dass ein einzelner Charakter eigenmaechtig Gruppenentscheidungen erfindet.

Der erste Block-8-Unterbau ist absichtlich read-only und deterministisch. Er entscheidet noch keine Adventure-Land-Spielaktion und sendet noch keine Gruppen- oder Charaktermeldungen. Er verarbeitet ausschliesslich explizite Teilnehmermeldungen.

## Teilnehmer-Lebensnachweis

Jeder eigene Charakter liefert einen `GruppenTeilnehmerMeldung`-Datensatz mit:

- eindeutiger Charakterkennung und Name,
- Klasse nur fuer Diagnose,
- Serverregion und Serverkennung,
- Karte und Instanz,
- explizitem Lebenszustand,
- Lebens- und Manaanteil,
- aktuellem Ziel,
- aktueller Kampf-Gefahrenstufe,
- Faehigkeitsprofil,
- Zeitstempel und laufender Nummer.

Die Koordination bekommt `jetzt` ausdruecklich als Eingabe. `Date.now()` ist in der Entscheidungslogik verboten. Damit bleiben Aufzeichnung und Wiederholung deterministisch.

Standardmaessig gilt ein Lebensnachweis nach 5 Sekunden als veraltet. Die Grenze ist konfigurierbar und Teil des expliziten Eingabevertrags.

## Faehigkeiten statt Klassenrollen

Die Gruppenfaehigkeiten sind:

- `heilen`
- `schaden`
- `aggro`
- `schutz`
- `unterstuetzung`

Jeder Teilnehmer meldet fuer jede Faehigkeit einen numerischen Wert. Die Aufgabenverteilung waehlt den aktuell aktiven Teilnehmer mit dem hoechsten Wert. Bei Gleichstand entscheidet die Charakterkennung lexikographisch, damit das Ergebnis unabhaengig von Eingabereihenfolge reproduzierbar bleibt.

Die Klasse darf die Auswahl nicht beeinflussen. Ein als `warrior` gemeldeter Charakter kann deshalb beispielsweise die Heilaufgabe erhalten, wenn sein explizites Faehigkeitsprofil dies so beschreibt.

## Teilnehmerstatus

Ein Teilnehmer wird als `aktiv` behandelt, wenn:

- sein Lebensnachweis aktuell ist,
- `lebendig` explizit `true` ist,
- Serverregion und Serverkennung mit dem eigenen Charakter uebereinstimmen,
- Karte und Instanz uebereinstimmen.

Andernfalls wird er eindeutig als einer der folgenden Zustaende markiert:

- `veraltet`
- `ausgefallen`
- `falsche_welt`
- `falsche_instanz`

Nicht aktive Teilnehmer erhalten keine Gruppenaufgaben. Dadurch werden Aufgaben nach Ausfall oder Verbindungsverlust automatisch aus dem verbleibenden aktiven Faehigkeitsprofil neu verteilt.

Kommt spaeter ein frischer Lebensnachweis desselben Charakters, darf er wieder als aktiv bewertet und erneut fuer Aufgaben ausgewaehlt werden.

## Gemeinsame Sicherheitslage

Die Gruppenkoordination bewertet die hoechste relevante Gefahrenstufe aller aktiven Teilnehmer.

- `sicher` oder `angespannt` -> normaler Gruppenbetrieb moeglich
- `gefaehrlich` oder `kritisch` -> Gruppenbetrieb `sicherheit`
- `unbekannt` -> fail-safe `blockiert`

Bei `sicherheit` oder `blockiert` wird kein normales gemeinsames Kampfziel ausgegeben. Damit hat die bereits in Block 7 etablierte Sicherheitsregel weiterhin Vorrang vor Leistung.

## Gemeinsames Ziel

Im normalen Gruppenbetrieb wird das von den aktiven Teilnehmern am haeufigsten gemeldete nicht-leere Ziel als gemeinsames Ziel ausgegeben.

Bei Gleichstand gewinnt die lexikographisch kleinere Zielkennung. Diese Regel ist technisch, nicht taktisch: Sie dient nur dazu, gleiche Eingaben immer gleich auszuwerten. Spaetere Block-8-Teile duerfen die Zielbewertung auf Basis expliziter Strategiedaten erweitern.

## Fail-safe Verhalten

Die Gruppenkoordination bleibt blockiert, wenn:

- der eigene Lebensnachweis fehlt,
- der eigene Lebensnachweis veraltet oder unplausibel ist,
- der eigene Lebenszustand nicht explizit lebendig ist,
- die gemeinsame Sicherheitslage unbekannt ist.

Fehlende Daten werden nicht durch Klassenannahmen oder geratenen Zustand ersetzt.

## Architekturgrenze

`spiellogik/gruppen-koordination.ts` darf keine Adventure-Land-Spielaktion direkt ausfuehren. Insbesondere sind dort direkte Aufrufe von Angriff, Bewegung, Skills, Loot, Charakterkommunikation und Party-Einladungen verboten.

Spaetere aktive Gruppenaktionen muessen weiterhin ueber die zentrale `AktionsSteuerung` und die Ressource `gruppe` beziehungsweise die jeweils benoetigten Kampf- und Bewegungsressourcen laufen.

## Automatisierte Nachweise dieses Unterbaus

`block8-gruppenkoordination.test.mjs` prueft mindestens:

- Aufgaben aus Faehigkeiten statt Klassen,
- Ausschluss veralteter Lebensnachweise,
- Neuverteilung nach Ausfall,
- Wiederaufnahme nach frischem Lebensnachweis,
- Server- und Instanzabgleich,
- Sicherheitsvorrang vor normalem Ziel,
- fail-safe bei unbekannter Sicherheitslage,
- deterministische gemeinsame Zielwahl,
- deterministische Ergebnisse unabhaengig von Eingabereihenfolge,
- Blockierung bei fehlendem oder veraltetem eigenem Lebensnachweis.

Der zusaetzliche Live-Koordinationsschatten wurde am 2026-09-17 mit `My_Ranger1` und `My_Ranger2` erfolgreich abgenommen. Nachgewiesen wurden aktive Aufgabenverteilung, Stale-Erkennung mit Aufgabenentzug und automatische Wiederaufnahme nach Reconnect, weiterhin ohne echte Spielaktion.

## Naechste Block-8-Schritte

Bereits erreicht:

1. Teilnehmermeldungen aus echten `Spielzustand`-Daten.
2. read-only Lebensnachweis-Austausch zwischen eigenen Charakteren.
3. echter read-only Koordinationsschatten mit Aktiv/Stale/Reconnect-Aufgabenwechsel.

Als naechstes folgen getrennt und testbar:

1. reale Kampfsicherheitsbewertung aus Block 7 statt manuell gesetzter `gefahrenStufe` in die Teilnehmermeldungen einspeisen.
2. konkrete Gruppenaktionsplanung fuer Heilen, Aggro, Schutz, Unterstuetzung und gemeinsames Ziel.
3. Wiederverbindungs- und Gruppenwiederaufbau-Planung ueber die zentrale Aktionssteuerung.
4. Mehrcharakter-Wiederholungen und gezielte Ausfalltests.
5. erst danach begrenzte aktive Gruppen-Smoke-Tests und der spaetere 72-Stunden-Gruppentest.
