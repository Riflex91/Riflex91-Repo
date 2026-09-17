# Block 8 – Kampfsicherheits-Kopplung

Status: **Produktionskopplung, Live-Bridge, Zwei-Ranger-Abnahme und Fail-safe-Ausfalltest bestanden am 2026-09-17.**

## Ziel

Die Gefahrenstufe eines Gruppen-Lebensnachweises darf im autonomen V4-Pfad nicht von Block 8 erfunden oder manuell gesetzt werden. Massgeblich ist ausschliesslich die Block-7-Kampfsicherheitsbewertung des aktuellen Charakterzustands.

## Produktionsschnittstelle

`erstelleGruppenTeilnehmerMeldungAusKampfsicherheit(...)` erhaelt:

- den aktuellen `Spielzustand`,
- eine vollstaendige `KampfSicherheitsEntscheidung` aus Block 7,
- das explizite Gruppen-Faehigkeitsprofil.

Die Funktion kopiert ausschliesslich `sicherheitsEntscheidung.gefahrenBewertung.stufe` in `GruppenTeilnehmerMeldung.gefahrenStufe`.

Block 8 berechnet keine eigene Kampfgefahr und darf die Block-7-Stufe weder abschwaechen noch ueberschreiben.

## Zeitliche Bindung im Produktionskern

Die Kampfsicherheitsentscheidung muss exakt zu `spielzustand.aufgenommenAm` gehoeren. Stimmt `sicherheitsEntscheidung.zeitpunkt` nicht mit diesem Zeitpunkt ueberein, wird kein Lebensnachweis erzeugt und das Ergebnis ist `blockiert`.

Damit kann weder eine alte Sicherheitsentscheidung noch eine Entscheidung aus einem anderen Snapshot in eine neue Gruppenmeldung geraten.

## Live-Bridge fuer Adventure Land

Da Adventure Land die TypeScript-Laufzeit nicht direkt als Node-ESM-Modul laedt, stellt

```text
v4/werkzeuge/block7-kampfsicherheits-quelle.js
```

eine kleine read-only Browserquelle bereit:

```js
V4Block7KampfsicherheitsQuelle.bewerte()
```

Die Quelle:

- liest nur aktuelle Adventure-Land-Zustandsdaten,
- fuehrt keine Spielaktion und keine Kommunikation aus,
- verwendet dieselben Block-7-Standardschwellen,
- liefert `gefahrenBewertung` samt Gruenden und Messwerten,
- traegt den exakten Git-Blob des Produktionskerns `kampfsicherheit.ts`.

Der Block-8-Strukturguard berechnet den aktuellen Produktions-Blob mit `git hash-object`. Weicht er vom Browserkern ab, wird CI rot. Zusaetzlich vergleicht `block8-live-kampfsicherheit.test.mjs` die Browserbewertung fuer `sicher`, `angespannt`, `kritisch` und `unbekannt` gegen echte Aufrufe von `planeKampfSicherheitsSchritt(...)`.

## Lebensnachweis ab Version 1.1.0

`V4Block8Lebensnachweis` akzeptiert `gefahrenStufe` nicht mehr in `konfiguriere(...)`.

Vor jedem `send_cm` gilt stattdessen:

1. `V4Block7KampfsicherheitsQuelle` muss vorhanden sein.
2. `bewerte()` wird unmittelbar aufgerufen.
3. Ergebnisformat und Gefahrenstufe muessen gueltig sein.
4. Die Bewertung darf nicht aus der Zukunft kommen.
5. Sie darf nicht aelter als `sicherheitsMaximalAlterMillisekunden` sein; Standard 1500 ms.
6. Erst danach wird die Meldung gebaut und gesendet.

Fehlt eine dieser Voraussetzungen, wird **vor `send_cm`** blockiert.

## Fail-safe Verhalten

- `sicher` bleibt `sicher`.
- `angespannt` bleibt `angespannt`.
- `gefaehrlich` bleibt `gefaehrlich`.
- `kritisch` bleibt `kritisch`.
- `unbekannt` bleibt `unbekannt` und blockiert spaeter gemaess Gruppenkoordination normalen Gruppenbetrieb.
- fehlende Live-Sicherheitsquelle -> keine Meldung.
- stale Live-Sicherheitsbewertung -> keine Meldung.
- manuell gesetzte `gefahrenStufe` -> Konfiguration wird abgewiesen.
- ungueltige Faehigkeitsprofile bleiben blockiert.

Die Low-Level-Funktion `erstelleGruppenTeilnehmerMeldungAusSpielzustand(...)` bleibt fuer deterministische Tests, Replay und explizite Adapter erhalten. Der autonome Produktions- und Live-Pfad verwendet die Kampfsicherheits-Kopplung.

## Automatisierte Nachweise

`block8-kampfsicherheits-kopplung.test.mjs` prueft die Produktionsschnittstelle mit echten `planeKampfSicherheitsSchritt(...)`-Aufrufen.

`block8-live-kampfsicherheit.test.mjs` prueft zusaetzlich:

1. Paritaet der Browserquelle fuer mehrere Gefahrenlagen,
2. automatische Uebernahme einer kritischen Bewertung in den gesendeten Lebensnachweis,
3. Verbot manueller `gefahrenStufe`,
4. Blockierung bei fehlender Quelle vor `send_cm`,
5. Blockierung einer zu alten Sicherheitsbewertung vor `send_cm`.

## Live-Abnahme vom 2026-09-17

### Zwei-Ranger-Happy-Path

`My_Ranger1` und `My_Ranger2` wurden mit der source-locked Block-7-Sicherheitsquelle und `V4Block8Lebensnachweis` Version `1.1.0` getestet.

Beide Block-7-Bewertungen lieferten in der beobachteten normalen Lage:

- `gefahrenBewertung.stufe: "sicher"`,
- keine Angreifer,
- keine Sicherheitsgruende,
- `echteSpielaktionenAusgefuehrt: false`,
- Produktions-Blob `7052173c43b7b1d6f46ff727ceb3c22d70768764`.

Der Lebensnachweis uebernahm diese Bewertung auf beiden Rangern automatisch. Beobachtet wurden unter anderem:

- `gefahrenQuelle: "V4Block7KampfsicherheitsQuelle"`,
- `sicherheitsQuelleVerfuegbar: true`,
- `sicherheitsQuelleKontext: "lokal"`,
- `letzteSicherheit.alterMillisekunden: 0`,
- `gefahrenStufe: "sicher"`,
- Ranger2: 30 gesendet, 26 empfangen, 0 verworfen,
- Ranger1: 24 gesendet, 23 empfangen, 0 verworfen,
- jeweils der andere Ranger mit `gefahrenStufe: "sicher"` im empfangenen Lebensnachweis,
- weiterhin keine echte Spielaktion.

Ergebnis: **bestanden**.

### Fail-safe-Ausfalltest der Block-7-Quelle

Auf `My_Ranger1` wurde der Lebensnachweis zuerst gestoppt und `V4Block7KampfsicherheitsQuelle` anschliessend temporaer aus lokalem und Parent-Kontext entfernt.

Vor dem absichtlichen Einzelversuch zeigte der Status:

- `aktiv: false`,
- `sicherheitsQuelleVerfuegbar: false`,
- `sicherheitsQuelleKontext: null`,
- `gesendet: 216`.

Der Aufruf

```js
await V4Block8Lebensnachweis.sendeEinmal()
```

brach erwartungsgemaess mit

```text
V4Block7KampfsicherheitsQuelle muss vor dem Lebensnachweis geladen werden.
```

ab.

Der unmittelbar danach gelesene Status zeigte weiterhin:

- `gesendet: 216`,
- `empfangen: 136`,
- `verworfen: 0`,
- `sicherheitsQuelleVerfuegbar: false`,
- `echteSpielaktionenAusgefuehrt: false`.

Damit ist live nachgewiesen, dass eine fehlende Block-7-Sicherheitsquelle **vor `send_cm` blockiert** und der Sendecounter unveraendert bleibt.

Ergebnis: **bestanden**.

## Ergebnis

Die automatische Block-7-zu-Block-8-Sicherheitskette ist damit sowohl im normalen Zwei-Charakter-Betrieb als auch im wichtigsten fehlenden-Quellen-Fehlerfall live bestaetigt. Eine Gefahr wurde fuer diesen Nachweis nicht absichtlich provoziert.