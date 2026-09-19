# ADR-002 – Deterministischer Core und Replay-Vertrag

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

Ab R4 muessen fachlich relevante Entscheidungen reproduzierbar sein. Direkte Systemzeit, unkontrollierte Zufallsquellen, ad-hoc Kennungen oder implizite Sequenzen wuerden Planung, Events, Recovery und spaetere Transaktionen nicht replay-faehig machen. Gleichzeitig bleibt das Gameplay-Runtime-Gate geschlossen; R4 darf nur no-write Core-Vertraege und Testlabor-Grundlagen liefern.

## Entscheidung

1. Fachlich relevante Zeit wird ausschliesslich ueber einen `UhrPort` injiziert.
2. Fachlich relevante Zufallsentscheidungen werden ausschliesslich ueber einen `ZufallsPort` injiziert.
3. Kennungen und Sequenzen besitzen eigene injizierbare Ports.
4. R4 liefert deterministische Referenzimplementierungen fuer simulierte Uhr, XorShift32-Zufall, Kennungen und monotone Sequenzen.
5. Fachresultate unterscheiden `ERFOLG`, `FEHLER` und `UNBEKANNT` explizit.
6. Domaenenereignisse tragen Ereignis-, Korrelations- und optionale Kausalitaetskennung, Sequenz und injizierte Zeit.
7. Domaenenereignisse und deren Payloads sind unveraenderlich.
8. Kritische Collections sind hart begrenzt und lehnen Ueberlauf explizit ab.
9. Kanonische Serialisierung sortiert Objektschluessel deterministisch und verwirft nicht-reproduzierbare Werte wie `undefined`, `NaN` oder benutzerdefinierte Objektprototypen.
10. Replay-Aufzeichnungen tragen Build-SHA, WissensSnapshot-SHA256 und Konfigurations-SHA256.
11. Replay-Eintraege besitzen lueckenlose Sequenzen, monotone Zeit und eindeutige IDs.
12. Die 13 ratifizierten Zustandsautomaten muessen vollstaendig erreichbar, fail-closed und frei von unbeabsichtigten Sackgassen sein.
13. `Date.now()`, `new Date()` und `Math.random()` sind im Fachkern statisch verboten; spaetere Systemadapter duerfen sie nur an einer gekapselten Determinismus-Boundary verwenden.
14. Gleiche Inputs + gleiche Clock/Seed/IDs/Sequenzen muessen byte-identische kanonische Event-/Replay-Ausgabe erzeugen.

## Alternativen

- **Systemzeit und Math.random direkt verwenden:** verworfen, weil Replay und reproduzierbare Tests unmoeglich werden.
- **UUIDs aus Betriebssystemzufall:** verworfen fuer fachlich relevante IDs; spaetere externe IDs werden an Boundaries gekapselt.
- **JSON.stringify ohne Kanonisierung:** verworfen, weil Objektschluesselreihenfolge und unzulässige Werte nicht als stabiler Replay-Vertrag ausreichen.
- **Unbounded Arrays/Maps mit spaeterem Cleanup:** verworfen, weil Last-/Failure-Verhalten unbestimmt bleibt.
- **Jeden Zustandsautomaten separat programmieren:** verworfen; ein geschlossener generischer Automatenkern erzwingt dieselben Invarianten fuer alle Modelle.

## Konsequenzen

- Alle spaeteren Scheduler-, Workflow-, Transaction- und Recovery-Module muessen die injizierten Determinismusports verwenden.
- Tests koennen Zeit, Seed, IDs und Sequenzen exakt kontrollieren.
- Replays sind an Build, WissensSnapshot und Konfiguration gebunden; ein Replay ohne passende Provenienz ist nicht autoritativ.
- Systemadapter fuer reale Uhr/Zufall muessen spaeter explizit gekapselt und separat getestet werden.
- Bounded Collections koennen unter Last Arbeit ablehnen; diese Ablehnung ist ein sichtbares fachliches Signal und kein stiller Datenverlust.

## Invarianten

Betroffen sind insbesondere:

- V5-INV-007 – gleiche Inputs/Clock/Seed erzeugen reproduzierbares Verhalten;
- V5-ALT-031 – stabile IDs/Cursor fuer Deduplizierung;
- V5-ALT-040 – Queues, Histories und Recorder sind bounded;
- V5-INV-102 – langlebige Nachrichten besitzen Version/ID/TTL/Dedupe;
- V5-INV-106 – azyklische Layergrenzen;
- V5-ANF-DET-001 bis V5-ANF-DET-004;
- V5-ANF-ARCH-009;
- V5-ANF-PERSIST-008.

## Migration

R3-Replay-Aufzeichnung bleibt kompatible Grundlage. R4 ergaenzt kanonische Serialisierung, Provenienzvalidierung und deterministische Core-Ports. Bestehende R3-no-write-Vertraege behalten ihre Safety-Semantik. Spaetere Phasen duerfen direkte Systemzeit/Zufall im Fachkern nicht wieder einfuehren.

## Rollback

Ein Rollback darf R4-Dateien entfernen oder auf den letzten gruenen R3-Stand zurueckkehren, solange keine spaetere Phase von R4-Vertraegen abhaengt. Er darf nicht durch Wiedereinfuehren direkter Systemzeit, unkontrollierter Zufallsquellen oder unbounded Collections erfolgen.
