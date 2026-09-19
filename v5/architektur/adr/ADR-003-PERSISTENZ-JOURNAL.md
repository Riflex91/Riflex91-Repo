# ADR-003 – Persistenz, Journal, Claims und Crash-Safety

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R5 muss langlebige Zustandsaenderungen sicher persistieren, ohne Gameplay-Autoritaet zu oeffnen. Ein Timeout, Crash, Disk-Full, Access-Denied, falsches Volume oder korrupter Checkpoint darf niemals zu Blind-Resume oder Blind-Retry fuehren. Gleichzeitig darf nichtkritisches SSD-I/O den spaeteren Gameplay-Hot-Path nicht blockieren.

## Entscheidung

1. Fachmodule erhalten keine allgemeine Datei-API, sondern typisierte Persistenzports.
2. Kritischer Transaction Intent wird durable journalisiert, bevor eine spaetere wertveraendernde Mutation einen Ausfuehrungstoken erhalten darf.
3. Das Transaction Journal ist append-only; korrupte oder sequenzwidrige Journale werden fail-closed abgelehnt.
4. Nichtterminale Checkpoints werden nach Restart ausschliesslich als `ABGLEICH_ERFORDERLICH` geladen; es gibt kein Blind-Resume.
5. Irreversible Evidence verwendet atomare durable Dedupe-Claims.
6. Kritische externe Zustellung verwendet durable Outbox und atomare Inbox-Claims.
7. Schema-Migrationen sind explizite lineare Versionen mit Forward-, optionalem Backward- und Unsupported-Version-Test.
8. Kritische JSON-Persistenz besitzt harte Groessen- und Schema-Grenzen.
9. Live-Wissen schreibt Generationen mit `SCHREIBT -> Fakten/Manifest -> BEREIT`; nur `BEREIT` ist importierbar.
10. Einzeldateien werden in derselben Zielpartition als Temp-Datei geschrieben, vor Rename `fsync`-bestaetigt und dann atomar umbenannt. Rename ist der Commitpunkt.
11. Disk-Full, Access-Denied, Read-Only und I/O-Fehler werden eindeutig klassifiziert und besitzen keinen stillen Fallback.
12. Produktions-Live-Wissen besitzt exakt den Standardpfad `D:\AdventureLand-V5\wissensdatenbank`; alternative Wurzeln sind nur expliziter Testmodus.
13. Kritische Persistenz prueft neben Laufwerk und SSD-Medientyp eine gepinnte Volume-ID und mindestens 15 Prozent Reserve.
14. Bei Speicherdruck werden Cache, Telemetrie, Replay und nichtkritische Evidence vor kritischer Persistenz deaktiviert.
15. Automatische Retention betrifft nur nichtkritische Datenklassen. Kritische Journale und ungeklaerte Transaktions-Evidence werden nicht still geloescht.
16. Direkter SSD-Adapterzugriff aus Combat-, Movement-, Scheduler- oder Execution-Hot-Paths ist statisch verboten.

## Alternativen

- **Direkte Datei-API fuer Fachmodule:** verworfen wegen unkontrollierter Pfade und Hot-Path-I/O.
- **Checkpoint einfach fortsetzen:** verworfen wegen stale Authority und unbekannten Servereffekten.
- **Check-then-mark Dedupe:** verworfen wegen Race Condition; Claim muss atomar sein.
- **Journal nach Action schreiben:** verworfen; Crash zwischen Action und Intent waere nicht sicher rekonstruierbar.
- **Fallback auf C: bei fehlendem D:** verworfen; falscher Datentraeger reduziert Authority fail-closed.
- **Unbounded Telemetrie/Replay:** verworfen; nichtkritische Daten muessen vor kritischem Journal degradieren.
- **BEREIT trotz partieller Generation:** verworfen; der Status ist der Snapshot-Commitvertrag.

## Konsequenzen

- Spaetere Execution muss einen durable Intent-Nachweis konsumieren.
- Persistenzfehler koennen neue wertveraendernde Mutationen blockieren.
- Nichtkritische Recorder duerfen Daten ablehnen/reduzieren, muessen dies aber sichtbar zaehlen.
- Ein `SCHREIBT`-Snapshot kann lokal unvollstaendig sein, wird jedoch niemals von der Bridge als fertige Generation importiert.
- Der Installations-/Hostpfad muss eine erwartete Volume-ID provisionieren, bevor kritische Persistenz freigegeben werden kann.

## Invarianten

Betroffen sind insbesondere:

- V5-ALT-010 – Intent vor irreversibler Action;
- V5-ALT-031 – restartfeste Deduplizierung;
- V5-ALT-039 – persist-before-claim fuer kritische Zustellung;
- V5-ALT-040 – bounded Recorder/Queues;
- V5-ALT-045 – schema-versionierte Persistenz;
- V5-ALT-046 – corrupt/oversized/unreadable reduziert Authority;
- V5-INV-024 – Migration vor Nutzung;
- V5-INV-043 / V5-INV-044 – lokale Live-Wissensdatenbank und SCHREIBT/BEREIT;
- V5-INV-104 / V5-INV-105 – kein nichtkritisches SSD-I/O im Hot Path und persist-before-action;
- V5-ANF-PERSIST-001/-002/-003/-005/-006/-007;
- V5-ANF-WISSEN-022/-023.

## Migration

R3/R4-Grundvertraege bleiben kompatibel. Der bisherige generische `SpeicherPort` bleibt nur Low-Level-Grundlage; neue Facharbeit verwendet die typisierten R5-Ports. Der bestehende Windows-SSD-Healthcheck wird um Volume-ID-Evidence erweitert.

## Rollback

Ein Rollback darf auf den letzten gruenen R4-Stand zurueckkehren, solange keine spaetere Phase R5-Persistenzdaten erzeugt hat. Sobald R5-Records produktiv existieren, darf ein Rollback nur ueber explizit getestete Rueckwaertsmigration erfolgen. Ein Rollback darf nie Blind-Resume, Journal-after-action oder Systemlaufwerk-Fallback einfuehren.
