# V5 – Lokales SSD-Datenfundament

**Status:** VERBINDLICHER ZIELVERTRAG FUER V5
**Stand:** 2026-09-19
**Datentraeger:** dedizierte 1-TB-SSD fuer Adventure Land
**Standardwurzel:** `D:\\AdventureLand-V5`

## 1. Ziel

Die dedizierte SSD ist das lokale persistente Datenfundament fuer V5. Sie ersetzt weder RAM noch CPU und darf den zeitkritischen Gameplay-Hot-Path nicht zu einem dateibasierten Ablauf machen.

Grundsatz:

```text
RAM = Arbeitsgedaechtnis und aktueller Hot State
CPU = Planung, Scheduling und Entscheidung
SSD = langlebige Persistenz, Evidence, Replay, Historie und grosse Datenmengen
Adventure-Land-Live-State = aktuelle Wahrheit fuer Execution-Admission
```

Speicherort oder Persistenz verleihen niemals Gameplay-Autoritaet.

## 2. Speicherklassen

### HOT – RAM

Im RAM bleiben mindestens:
- Reconciled World Truth;
- aktueller Character-/Entity-/Inventory-State;
- aktive Workflows;
- Scheduler-Queues;
- Locks, Leases und Fencing-Zustaende;
- aktive Transaktionen;
- aktuell benoetigte Action Contracts;
- kleine, gezielt vorgewarmte Working Sets.

Regel: Normale Combat-, Movement-, Scheduling- und Execution-Entscheidungen duerfen nicht auf einen SSD-Roundtrip warten.

### WARM – SSD

Auf der SSD liegen unter anderem:
- Transaction Journal;
- Workflow Checkpoints;
- Inbox/Outbox;
- Live-Wissen;
- Observation Evidence;
- Postcondition-/Reconciliation-Evidence;
- aktuelle und mittelfristige Markt-/Monster-/Event-Historien;
- Replay-Aufzeichnungen;
- aggregierte Telemetrie;
- Lern-Evidence und vorbereitete Datensaetze.

### COLD – SSD, verdichtet/komprimiert

Cold Storage umfasst:
- alte Replays;
- alte Test-/Fault-Runs;
- Zertifizierungsevidence;
- Langzeitstatistiken;
- historische, verdichtete Telemetrie;
- nicht mehr im aktiven Working Set benoetigte Lern- und Analyseartefakte.

## 3. Zielstruktur

Die bestehende Live-Wissensdatenbank behaelt aus Kompatibilitaetsgruenden ihren bisherigen Standardpfad.

```text
D:\AdventureLand-V5\
  wissensdatenbank\
    manifest.json
    status.json
    aktuell\
    temporaer\
    quarantaene\

  runtime\
    journal\
    checkpoints\
    transaktionen\
    inbox\
    outbox\
    recovery\

  evidence\
    beobachtungen\
    postconditions\
    reconciliation\
    zertifizierung\

  replay\
    aufzeichnungen\
    fixtures\
    golden\

  telemetrie\
    aktuell\
    verdichtet\
    archiv\

  testlabor\
    fault-runs\
    simulator\
    ergebnisse\

  lernen\
    datensaetze\
    features\
    modelle\
    evaluation\

  snapshots\
  export\
  temporaer\
  quarantaene\
```

Die Windows Bridge darf weiterhin ausschliesslich den konfigurierten Live-Wissenspfad lesen und validierte Live-Wissenssnapshots nach GitHub spiegeln. Andere SSD-Bereiche sind fuer die Bridge standardmaessig unsichtbar.

## 4. I/O-Regeln

### Nichtkritische Daten

Nichtkritische Aufzeichnungen laufen ueber bounded asynchrone Schreibwarteschlangen.

```text
Spiel-/Runtime-Ereignis
  -> RAM
  -> Runtime arbeitet weiter
  -> bounded Schreibwarteschlange
  -> separater Writer
  -> Batch/Kompression
  -> SSD
```

Pflicht:
- Batching statt tausender Kleinstdateien;
- Backpressure;
- definierte Queue-Grenzen;
- Prioritaetsklassen fuer Schreibdaten;
- Messung von Queue-Tiefe, Latenz, Durchsatz und Drops;
- bei Ueberlast zuerst nichtkritische Daten reduzieren.

### Kritische Daten

Kritische Persistenz darf absichtlich synchron auf durable Speicherung warten.

Insbesondere vor irreversiblen oder wertveraendernden Mutationen gilt:

```text
INTENT
  -> Journal durable persistieren
  -> Persistenz bestaetigt
  -> erst dann Game Action
```

Performance darf Persist-before-action niemals umgehen.

## 5. Keine SSD im Hot Path

Verboten:
- pro Tick Knowledge-Dateien neu oeffnen;
- Scheduler-Entscheidungen direkt aus Dateien lesen;
- aktive Locks/Leases aus einer SSD-Datenbank nachladen;
- Combat-/Movement-Entscheidungen an Dateizugriffe koppeln;
- aktuelle Execution-Admission allein aus persistiertem State ableiten.

Erlaubt:
- SSD-Daten im Hintergrund lesen;
- benoetigte Working Sets vorladen;
- grosse Historien lokal aggregieren;
- kompakte Ergebnisse in RAM publizieren;
- bei Restart kontrolliert aus Checkpoints/Journals rekonstruieren.

## 6. Working-Set-Prinzip

Grosse historische Datenmengen bleiben auf SSD. Hintergrundprozesse berechnen daraus kompakte, versionierte Working Sets.

Beispiel Markt:

```text
SSD:
historische Marktbeobachtungen

Hintergrund-Aggregator:
Median / Trend / Volatilitaet / Stichprobenqualitaet

RAM:
aktuelle Listings + relevante Aggregate
```

Die Runtime arbeitet mit dem RAM-Working-Set und nicht mit Vollscans grosser Historien.

## 7. Speicherbudgets und Reserve

Die SSD darf fuer 24/7-Betrieb nicht bis zum physisch verfuegbaren Ende beschrieben werden.

Standard:
- mindestens 15 Prozent der SSD bleiben als Sicherheitsreserve ungenutzt;
- jede Datenklasse besitzt ein konfigurierbares Budget;
- kritische Persistenz besitzt Vorrang vor Telemetrie, Replay, Test- und Cache-Daten.

Bei Speicherdruck:
1. Cache verwerfen;
2. nichtkritische Rohtelemetrie reduzieren;
3. Telemetrie verdichten/rotieren;
4. alte Replays/Test-Runs nach Retention entfernen;
5. Cold Data komprimieren;
6. neue nichtkritische Aufzeichnung stoppen;
7. falls kritische Persistenz nicht mehr sicher garantiert werden kann: neue wertveraendernde Mutationen fail-closed sperren.

Kritische Journale oder ungeklärte Transaktions-Evidence duerfen niemals still geloescht werden.

## 8. Retention und Schreibvolumen

Jeder Recorder braucht:
- maximales Datenbudget;
- maximale Dateianzahl;
- Retention;
- Rotation;
- Kompression;
- Deduplizierung, wo fachlich zulaessig;
- Verhalten bei Disk Full;
- Verhalten bei Access Denied;
- Verhalten bei I/O-Timeout;
- Verhalten bei Dateisystemfehlern.

Unbounded Rohtelemetrie ist verboten.

## 9. Datentraegeridentitaet

`D:\` bleibt der Standardpfad, ist aber allein keine hinreichende Identitaet.

Vor produktiver Nutzung soll die Installation eine persistente Datentraeger-/Volume-Identitaet speichern und bei Start pruefen:
- erwarteter Datentraeger vorhanden;
- erwartete Volume-Identitaet;
- beschreibbar;
- ausreichender freier Speicher;
- erwartetes Dateisystem/Grundverzeichnis;
- keine unerwartete Umleitung auf einen anderen Datentraeger.

Ein Laufwerksbuchstabenwechsel oder falsches `D:` darf nicht still akzeptiert werden.

## 10. Ports

Die Runtime soll keine allgemeine fachliche Datei-API erhalten.

Geplante typisierte Grenzen:
- `PersistenzPort`;
- `TransaktionsJournalPort`;
- `CheckpointSpeicherPort`;
- `LiveWissensSpeicherPort`;
- `ReplaySpeicherPort`;
- `TelemetrieSpeicherPort`;
- `ZertifizierungsEvidencePort`;
- `SpeicherGesundheitsPort`.

Fachmodule duerfen nicht beliebige Pfade beschreiben.

## 11. Evidence und Learning

Observation-Evidence darf frueh lokal aufgezeichnet werden, sofern sie bounded und klar klassifiziert ist.

Sie kann spaeter fuer:
- Debugging;
- Recovery;
- Replay;
- Regression;
- Langzeitanalyse;
- Marktstatistik;
- Route-/Farming-Analyse;
- Learning-Datensaetze;
- 24/7-Zertifizierung

verwendet werden.

Learning bleibt bis zu seiner eigenen Freigabe ohne Gameplay-Autoritaet.

## 12. GitHub-Abgrenzung

GitHub ist kein Massenspeicher fuer SSD-Daten.

Nach GitHub gelangen nur ausdruecklich freigegebene, bounded und validierte Artefakte, insbesondere der bestehende Live-Wissenssnapshot.

Nicht automatisch nach GitHub:
- Rohtelemetrie;
- vollstaendige Replays;
- Runtime-Journale;
- Checkpoints;
- grosse Learning-Datensaetze;
- lokale Test-/Fault-Runs;
- lokale Recovery-Daten.

## 13. Fehlerverhalten

SSD-Fehler reduzieren Autoritaet statt Safety zu lockern.

Beispiele:
- Telemetrie-Writer faellt aus -> Telemetrie degradieren, Gameplay nur weiter wenn unabhaengig sicher.
- Replay-Speicher voll -> Replay reduzieren/stoppen.
- Journal kann nicht durable geschrieben werden -> wertveraendernde Mutation blockieren.
- Checkpoint korrupt -> fail-closed laden und Recovery/Reconciliation.
- SSD fehlt oder falsches Volume -> keine stillschweigende Ersatzpersistenz auf Systemlaufwerk.

## 14. Performance-Leitsatz

**Hot Path aus RAM. Nichtkritische Persistenz asynchron und bounded. Kritische Intents durable vor der Mutation. Grosse Historie auf SSD, kompakte Working Sets in RAM.**
