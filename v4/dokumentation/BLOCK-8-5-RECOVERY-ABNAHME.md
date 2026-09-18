# Block 8.5 – Recovery-Abnahme

Status: **8.5.8 implementiert – die vorhandenen Recovery-Grenzen sind fuer die definierten Stoerfaelle explizit abgenommen.**

## Ziel

Schritt 8.5.8 fuehrt keine neue Recovery-Engine und keine neue Spielautoritaet ein.

Die Abnahme prueft, dass die bereits vorhandenen V4-Bausteine bei Stoerungen gemeinsam fail-safe bleiben:

- `RuntimeGesundheit`
- `RecoveryCheckpointSpeicher`
- `LaufzeitSteuerung`
- `AktionsSteuerung`
- `SichereBasisBedienung`
- gemeinsame read-only `StatusSchnittstelle`
- read-only `V4IngameHud`
- Produktionsruntime und historisch bereits getesteter Reconnect-Pfad

Die verbindlichen Sicherheitsregeln bleiben:

- keine automatische Host-Neustartautoritaet,
- keine alte Arbeit automatisch wiederbeleben,
- kein direkter Spielaktionspfad aus Recovery, GUI oder Telemetrie,
- unbekannte, ungueltige oder stale Zustaende fail-safe blockieren.

## Abnahmesuite

Neue Regression:

`v4/laufzeit/tests/block8-5-recovery-abnahme.test.mjs`

Sie wird ueber den vorhandenen Volltestlauf

`node --test laufzeit/tests/*.test.mjs`

automatisch mit ausgefuehrt.

## 1. Reconnect

Der Reconnect-Nachweis verwendet weiterhin die bereits vorhandenen Block-8-Regressionen des 10-Minuten-Gruppentests.

Abgenommen bleibt:

- transienter ungeplanter Stale fuehrt zu sicherem Aufgabenentzug und Neuverteilung,
- erfolgreicher Auto-Recovery/Reconnect wird erkannt,
- ohne Recovery wird nach dem vorgesehenen Zeitfenster fail-safe abgebrochen,
- der Reconnect-Test erzeugt dabei 0 zentrale neue Spielaktionen.

Der historische Block-8-Abschluss bleibt unveraendert. Insbesondere werden Runtime/Bootstrap 1.1.4 und der immutable Block-8-Nachweis nicht auf die aktuelle Entwicklungsruntime umgeschrieben.

## 2. Stale Daten

`RuntimeGesundheit` eskaliert alte Freshness-Daten weiterhin stufenweise.

Die 8.5.8-Abnahme beweist:

- relevante Stale-Daten koennen `sicher_pausiert` ausloesen,
- lange Freshness-Luecken koennen `neustart_empfohlen` ausloesen,
- `hostNeustartEmpfohlen` bleibt nur eine Empfehlung,
- `automatischerNeustart` bleibt immer `false`.

Damit entsteht aus Telemetrie keine Host-Autoritaet.

## 3. Browser-Hintergrundbetrieb

Die Produktionsruntime bleibt im Browser an Adventure Lands `performance_trick()` gebunden.

Abgenommen bleiben die vorhandenen Produktionsregressionen:

- autonomer 2-Sekunden-Heartbeat,
- aktive Browserruntime ohne `performance_trick()` startet fail-safe nicht,
- allgemeine Bot-Pause stoppt den Produktionsheartbeat nicht.

Damit wird der bereits in Block 8 nachgewiesene Hintergrundbetrieb nicht durch 8.5-Recovery oder Basisbedienung umgangen.

## 4. Runtime-Neustart

Ein Runtime-Neustart wird durch eine neue `RecoveryCheckpointSpeicher`-Instanz auf demselben persistenten Speicher simuliert.

Ein geladener Checkpoint besitzt auch danach zwingend:

- `wiederaufnahmeErlaubt: false`
- `abgleichErforderlich: true`
- `aktionsAutoritaet: false`

Offene alte Aktionskennungen sind nur Information fuer den Abgleich.

Sie werden nicht erneut eingereicht und nicht automatisch fortgesetzt.

## 5. HUD-Schliessen oder HUD-Fehler

Das read-only `V4IngameHud` bleibt eine austauschbare Oberflaeche.

`schliessen()`:

- blendet nur die HUD-Wurzel aus,
- stoppt nur den lokalen HUD-Aktualisierungstimer,
- pausiert keine Runtime,
- veraendert keine AktionsSteuerung,
- veraendert keinen Produktionsheartbeat,
- startet oder stoppt keinen Host.

Anzeige-/Statusfehler werden lokal als HUD-Fehler behandelt.

Die Bot-Laufzeit erhaelt dadurch keine neue Fehler- oder Aktionsautoritaet.

## 6. Unterbrochene Aktion

Die Abnahme startet eine normale Aktion und pausiert die Laufzeit ueber `SichereBasisBedienung`.

Dabei gilt:

- die laufende normale Aktion wird zentral als `abgebrochen` beendet,
- anschliessendes ausdruecklich bestaetigtes Fortsetzen gibt nur neue Arbeit wieder frei,
- die alte AktionsAnfrage bleibt `abgebrochen`,
- es gibt keine automatische Wiederbelebung.

## 7. Offener Checkpoint

Ein Checkpoint mit offenen AktionsAnfragen speichert nur deren Kennungen.

Die Abnahme beweist:

- Kennungen werden dedupliziert und deterministisch sortiert,
- keine Aktionsnutzlast wird als Wiederaufnahmeautoritaet gespeichert,
- `wiederaufnahmeErlaubt` bleibt `false`,
- `abgleichErforderlich` bleibt `true`,
- `aktionsAutoritaet` bleibt `false`.

## 8. Doppelte Bedienanfrage

Eine bereits behandelte `vorgangsKennung` darf keine zweite Zustandsaenderung erzeugen.

Die zweite Ausfuehrung liefert:

`status: wiederholt`

Die Laufzeit-Generation bleibt unveraendert.

Damit bleibt der Idempotenzschutz auch Teil der Recovery-Abnahme.

## 9. Ungueltiger oder veralteter Status

Die Abnahme prueft beide Ebenen:

- eine alte BedienAnfrage mit veralteter Laufzeit-Generation wird durch `laufzeit-generation-aktuell` blockiert,
- ungueltige Metadaten der gemeinsamen StatusSchnittstelle bleiben durch deren bestehende Regression fail-safe abgewiesen.

Eine veraltete Oberflaeche darf damit keinen neueren Zustand ueberschreiben.

## 10. Telemetrie-/Speicherfehler

Bei einem simulierten Fehler beim Umschalten des Checkpoint-Zeigers:

- meldet der Speicher `speicher_fehler`,
- der letzte bestaetigte Checkpoint bleibt aktiv,
- ein unbestaetigter neuer Zustand wird nicht als gueltig behandelt.

Ein kritischer Laufzeitfehler fuehrt parallel in `RuntimeGesundheit` zu:

`recoveryStufe: blockiert`

Auch dabei bleibt:

`automatischerNeustart: false`

## Keine neue Autoritaet

Schritt 8.5.8 fuegt absichtlich keine neue Produktionsmethode fuer:

- Spielaktionen,
- `AktionsSteuerung`-Direktzugriff,
- Browser-/Host-Neustart,
- automatische Checkpoint-Wiederaufnahme,
- automatische Wiederbelebung alter Arbeit

hinzu.

Die Recovery-Abnahme ist eine Test- und Dokumentationsgrenze ueber bereits vorhandene kontrollierte Komponenten.

## Ergebnis

Die zehn im Block-8.5-Plan geforderten Stoerfaelle besitzen damit explizite Abnahmekriterien und Regressionen.

Schritt **8.5.8 ist implementiert**.

Der naechste Schritt ist **8.5.9 – Freigabestufen**.
