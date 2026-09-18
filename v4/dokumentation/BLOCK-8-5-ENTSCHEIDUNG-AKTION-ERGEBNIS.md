# Block 8.5 – Entscheidung -> AktionsAnfrage -> Ergebnis

Status: **8.5.2 implementiert; Korrelation ist read-only und die zentrale AktionsSteuerung bleibt Autoritaet**.

## Ziel

Schritt 8.5.1 erzeugt einen erklaerbaren `EntscheidungsDatensatz`. Schritt 8.5.2 verbindet diesen Datensatz eindeutig mit den daraus entstandenen `AktionsAnfragen` und dem spaeter beobachteten Ergebnis.

Die Kette lautet:

`EntscheidungsDatensatz -> AktionsAnfrage -> AktionsLaufZustand/AktionsErgebnis`

Die Korrelation beobachtet diese Kette. Sie erzeugt keine fachliche Entscheidung und fuehrt keine Aktion aus.

## Verknuepfung mit AktionsAnfragen

`verknuepfeGruppenEntscheidungMitAktionsAnfragen(...)` akzeptiert nur Gruppen-AktionsAnfragen, die:

- aus `gruppen-aktionsplanung` stammen,
- exakt zum `planZeitpunkt` der Entscheidung gehoeren,
- einen im EntscheidungsDatensatz bekannten ausfuehrenden Teilnehmer referenzieren,
- eine eindeutige AktionsAnfrage-Kennung besitzen.

Eine bereits mit einer anderen Anfragemenge verknuepfte Entscheidung wird fail-safe abgewiesen.

Die fachlichen Fingerabdruecke werden durch Laufzeit-Aktionskennungen nicht veraendert.

## Zentrale AktionsSteuerung bleibt Autoritaet

Die Korrelationskomponente:

- ruft `reicheAnfrageEin(...)` nicht auf,
- ruft `verarbeiteNaechsteAktion(...)` nicht auf,
- schliesst keine Aktion ab,
- bricht keine Aktion ab,
- besitzt keinen Adventure-Land-Aktionsaufruf.

Nur die vorhandene `AktionsSteuerung` darf AktionsAnfragen annehmen und Phasen veraendern.

## Beobachtung von AktionsLaufZustaenden

`werteGruppenEntscheidungMitAktionsZustaendenAus(...)` liest eine bereits vorhandene Liste von `AktionsLaufZustand`-Werten.

Die Zuordnung lautet:

- `abgeschlossen` -> erfolgreich,
- `abgebrochen` oder `abgelaufen` -> fehlgeschlagen,
- `wartend`, `blockiert` oder `laeuft` -> offen,
- fehlender Zustand -> offen und explizit `phase: "fehlt"`.

Ein fehlender Zustand wird nicht als Erfolg erfunden.

## Beobachtung von AktionsErgebnissen

`werteGruppenEntscheidungMitAktionsErgebnissenAus(...)` kann stattdessen echte `AktionsErgebnis`-Werte desselben Ablaufs auswerten.

Ein Ergebnis mit anderer `ablaufKennung` wird nicht der Entscheidung zugerechnet. Fehlt danach ein Ergebnis fuer eine verknuepfte Anfrage, bleibt der Ausgang `offen`.

## Ergebnisstatus

Der EntscheidungsDatensatz erhaelt ein versioniertes `tatsaechlichesErgebnis` mit:

- `ausgewertetAm`,
- Gesamtstatus,
- Rueckmeldungen pro verknuepfter AktionsAnfrage.

Moegliche Gesamtzustaende:

- `keine_aktion`
- `offen`
- `erfolgreich`
- `fehlgeschlagen`
- `gemischt`

Solange mindestens eine verknuepfte Aktion noch offen oder unbelegt ist, bleibt der Gesamtstatus `offen`.

## Idempotenz und Wiederholung

Die Verknuepfung derselben bereits bekannten Anfragemenge ist idempotent.

Eine nachtraeglich andere Anfragemenge wird abgewiesen. Dadurch kann eine Entscheidung nicht stillschweigend auf andere Laufzeitarbeit umgebogen werden.

Die Eingabe- und fachlichen Entscheidungs-Fingerabdruecke aus 8.5.1 bleiben bei der Korrelation unveraendert.

## Sicherheitsgrenze

8.5.2 ist reine Instrumentierung.

Insbesondere gibt es:

- keinen direkten Adventure-Land-Aufruf,
- keine neue Freigabe,
- keine neue Gruppenaktion,
- keine automatische Verarbeitung einer AktionsAnfrage,
- keine Umgehung von Safety, RessourcenVergabe oder AktionsSteuerung.

## Tests

`block8-5-entscheidungs-aktions-korrelation.test.mjs` prueft:

- Verknuepfung mit einer echten Gruppen-AktionsAnfrage,
- keine Einreichung durch die Korrelationskomponente,
- zentrale Verarbeitung ausschliesslich durch `AktionsSteuerung`,
- Beobachtung von offen -> abgeschlossen,
- Korrelation eines `AktionsErgebnis`,
- Ablehnung fremder Ablaufergebnisse,
- Ablehnung falscher Planzeitpunkte und fremder Anfrageherkunft,
- explizites `keine_aktion` bei einer Entscheidung ohne AktionsAnfrage.

## Naechster Schritt

**8.5.3 – RuntimeGesundheit und RecoveryZustand.**

Dort werden Runtime-Freshness, fachlicher Fortschritt, Gruppen-Liveness, Safety und Recovery-Stufe in einen gemeinsamen read-only Zustand ueberfuehrt.
