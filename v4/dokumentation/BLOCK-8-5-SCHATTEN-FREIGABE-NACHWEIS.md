# Block 8.5 – Schatten-Freigabenachweis

Status: **Stufe 2 Schatten fuer den exakten Runtime-1.1.5-Candidate real bestanden. Kontrolliert live ist die naechste offene Stufe.**

## Kanonischer Nachweis

Maschinenlesbar:

`BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json`

Der reale Adventure-Land-Lauf wurde am **2026-09-18T23:47:47.498Z** unter:

`block8-5-schatten-1789775266269`

durchgefuehrt.

Der kopierte Gesamtbericht wurde als externe Evidenz gebunden durch:

- Dateiname: `Eingefügter Text(20260918-234800).txt`
- Groesse: **10123 Bytes**
- SHA-256: `78af6a837af689e786c5166d49624f194ad72d888f76f7712012073c1675d8c1`
- Berichtstatus: **PASS**

## Candidate-Bindung

Der Lauf bestaetigt exakt:

- Laufzeitpfad: `block8.5-basisbedienung-runtime`
- Aenderungskennung: `git:88185523c81687dc16f9647ca5e7568c5e2c228c`
- Runtime-Version: **1.1.5**
- Runtime-SHA-256: `95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f`
- immutable Runtime-URL unter Release `88185523c81687dc16f9647ca5e7568c5e2c228c`

## Strikte Nicht-Sende-Bedingung

Vor und nach `diagnose_aktualisieren` waren gleichzeitig bestaetigt:

- `aktivFreigegeben: false`
- `empfangInstalliert: false`
- `lebensnachweisAutomatikAktiv: false`
- `lebensnachweisAutomatikPausiert: false`
- `lebensnachweisSendeVersuche: 0`
- `lebensnachweisSendeErfolge: 0`
- `lebensnachweisSendeFehler: 0`
- Generation **0 -> 0**
- `performanceTrickAufgerufen: false`
- `automatischeFortsetzung: false`

Der Freigabe-Nachweis setzt deshalb korrekt:

`spielAktionAusgefuehrt: false`

## Vollstaendige Schattenuebergabe

Die GUI-Darstellung des Gesamtberichts zeigt beim eingebetteten `schattenUebergabe.nachweis` den Text `[Zirkulaere Referenz]`, weil Ergebnis und Uebergabe intern dasselbe unveraenderliche Nachweisobjekt referenzieren.

Das ist kein Fehler des Schattenlaufs. Fuer den nachfolgenden Live-Lauf wird deshalb **nicht** dieser Darstellungsstring uebernommen.

Die kanonische JSON-Datei rekonstruiert die `schattenUebergabe` aus dem top-level `nachweis` und enthaelt darin wieder das vollstaendige Nachweisobjekt. Genau diese kanonische Uebergabe wird source-locked in das separate Live-Paket eingebaut.

## Formale Freigabeauswertung

Zusammen mit dem bereits bestandenen Offline-Nachweis ergibt die reale Auswertung:

- `offline -> bestanden`
- `schatten -> bestanden`
- `kontrolliert_live -> offen`
- `soak -> blockiert`
- `naechsteStufe: kontrolliert_live`
- `freigabeVollstaendig: false`
- `block9Freigegeben: false`

Block 9 bleibt gesperrt.
