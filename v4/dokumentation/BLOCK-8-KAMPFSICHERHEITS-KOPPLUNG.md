# Block 8 – Kampfsicherheits-Kopplung

Status: **Produktionskopplung umgesetzt; Live-Schattenanbindung folgt als naechster Nachweis.**

## Ziel

Die Gefahrenstufe eines Gruppen-Lebensnachweises darf im autonomen V4-Pfad nicht von Block 8 erfunden oder manuell gesetzt werden. Massgeblich ist ausschliesslich die bereits etablierte Block-7-Kampfsicherheitsentscheidung desselben Spielzustands.

## Produktionsschnittstelle

`erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(...)` erhaelt:

- den aktuellen `Spielzustand`,
- eine vollstaendige `KampfSicherheitsEntscheidung` aus Block 7,
- das explizite Gruppen-Faehigkeitsprofil.

Die Funktion kopiert ausschliesslich `sicherheitsEntscheidung.gefahrenBewertung.stufe` in `GruppenTeilnehmerMeldung.gefahrenStufe`.

Block 8 berechnet keine eigene Kampfgefahr und darf die Block-7-Stufe weder abschwaechen noch ueberschreiben.

## Zeitliche Bindung

Die Kampfsicherheitsentscheidung muss exakt zu `spielzustand.aufgenommenAm` gehoeren. Stimmt `sicherheitsEntscheidung.zeitpunkt` nicht mit diesem Zeitpunkt ueberein, wird kein Lebensnachweis erzeugt und das Ergebnis ist `blockiert`.

Damit kann weder eine alte Sicherheitsentscheidung noch eine Entscheidung aus einem anderen Snapshot in eine neue Gruppenmeldung geraten.

## Fail-safe Verhalten

- `sicher` bleibt `sicher`.
- `angespannt` bleibt `angespannt`.
- `gefaehrlich` bleibt `gefaehrlich`.
- `kritisch` bleibt `kritisch`.
- `unbekannt` bleibt `unbekannt` und blockiert spaeter gemaess Gruppenkoordination den normalen Gruppenbetrieb.
- ungueltige Faehigkeitsprofile bleiben blockiert.
- fehlende oder ungueltige Sicherheitsentscheidungen bleiben blockiert.

Die vorhandene Low-Level-Funktion `erstelleGruppenTeilnehmerMeldungAusSpielzustand(...)` bleibt fuer deterministische Tests, Replay und explizite Adapter erhalten. Der autonome Gruppenpfad soll die neue Kampfsicherheits-Kopplung verwenden.

## Automatisierte Nachweise

`block8-kampfsicherheits-kopplung.test.mjs` prueft die Kopplung mit echten Aufrufen von `planeKampfSicherheitsSchritt(...)`:

1. sichere Block-7-Bewertung wird unveraendert uebernommen,
2. kritische Bewertung kann von Block 8 nicht abgeschwaecht werden,
3. unbekannte Sicherheitslage bleibt unbekannt und damit fail-safe,
4. eine Sicherheitsentscheidung eines anderen Spielzustandszeitpunkts wird blockiert,
5. ungueltige Gruppenfaehigkeiten bleiben blockiert.

## Naechster Live-Schritt

Der Adventure-Land-Schattenpfad wird als naechstes so erweitert, dass der Lebensnachweis seine Gefahrenstufe aus der laufenden Block-7-Sicherheitsbewertung bezieht. Erst wenn dieser echte Zwei-Charakter-Nachweis bestanden ist, wird der bisherige manuelle Testwert fuer `gefahrenStufe` aus dem Live-Ablauf entfernt.
