# ADR-017 – R14 Multi-Character Coordination: CM, Roster, Liveness und Authority-Grenzen

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R14 fuehrt die erste accountweite Multi-Character-Koordination in V5 ein. Adventure-Land-CODE-Messages sind Transport, aber keine durable Transaction-, Roster- oder Gameplay-Authority. Nachrichten koennen doppelt, verspaetet, umsortiert oder gar nicht eintreffen. Character-Sessions, Serverzuordnung und Roster koennen zwischen Planung und Verarbeitung wechseln. P1A revalidiert CM-Delivery/Retry, server-lokale Constraints, Character-Liveness/Freshness sowie Restart-/Reload-Verhalten.

## Entscheidung

1. CM-Transport verleiht keine Gameplay- oder ExecutionAuthority.
2. Jeder koordinationsrelevante Umschlag traegt Protokollversion, Nachrichten-ID, Dedupe-Schluessel, Sender, Empfaenger, Serverbindung, TTL, Workflow-ID/-Revision, Roster-Epoche, Typ und optional `antwortAuf`.
3. Duplicate-Verarbeitung wird innerhalb der TTL ueber Nachrichten-ID/Dedupe verhindert.
4. Out-of-order niedrigere Workflow-Revisionen werden verworfen; eine neuere selbstenthaltene Revision darf trotz verlorener Vorgeschichte verarbeitet werden.
5. Bounded Retry verwendet dieselbe Nachrichten-ID. Ein Retry erzeugt keine neue semantische Nachricht.
6. Transport-Evidence `receivers` oder `locals` beendet den Transport-Retry fuer den Empfaenger; Transporterfolg ist trotzdem kein fachliches Settlement.
7. ACK und SETTLEMENT sind mit dem urspruenglichen Auftrag korreliert. SETTLEMENT ist terminal; ein spaeteres ACK darf nicht zurueckstufen.
8. CM, Roster-Ziel und Koordinationsfreigabe sind an Serverregion und Serveridentifier gebunden.
9. Character-Ziele sind an aktuelle Roster-Epoche und Session-ID gebunden.
10. Liveness besitzt eine Sitzungs-Epoche. Stale Liveness oder eine neue Session entzieht alte Koordinationsfreigaben.
11. Nach Restart ist persistiertes Roster keine frische Authority; es liefert nur einen Epochen-Floor. Persistierte Liveness startet als `RECOVERY_PENDING`.
12. Dedupe- und ACK/Settlement-Evidence darf bounded bis TTL durch Restart erhalten bleiben.
13. Account Coordinator besitzt accountweite Koordination und gemeinsame Ressourcen, aber keine Raw Game Writes.
14. Character Agent besitzt lokale Identitaet/Beobachtung und kann gueltige Koordinationsfreigaben annehmen; R14 verleiht keine neue Raw-Write-Authority.
15. Ein produktiver `send_cm`-Adapter ist nicht Bestandteil des R14-Kerns. Raw Game Writes bleiben durch Guards verboten.

## Alternativen

- CM-Payload direkt als Authority verwenden: verworfen.
- Retry mit neuer Nachrichten-ID: verworfen.
- Nur Transportreihenfolge statt Workflow-Revision pruefen: verworfen.
- Persistiertes Roster/Liveness nach Restart direkt weiterverwenden: verworfen.
- Coordinator und Agent zusammenlegen: verworfen.
- R14 bereits mit produktiven CM-/Gameplay-Writes ausstatten: verworfen.

## Konsequenzen

Duplicate, Out-of-order, Loss und Delay sind deterministisch fault-injected. Serverwechsel, Rosterwechsel und Character-Restart invalidieren alte Authority fail-closed. ACK/Settlement bleibt auch bei Reordering und Restart korreliert. R15 kann Supply-/Delivery-/Production-Workflows auf dieser gefenceten Grundlage aufbauen. Die breite Gameplay-Runtime bleibt `GESPERRT`.

## Invarianten

- V5-INV-008 – kritische Zustandsmaschinen fail-closed;
- V5-ALT-026 – Party-/Character-Ziele an aktuelle Identitaet/Roster-Epoche gebunden;
- V5-INV-006 – langlebige Leases/Epochen mit Fencing;
- V5-INV-026 – Safety-Code mit Negativ-/Fault-Tests;
- V5-ALT-001 – klare Owner-/Layer-Grenzen.

## Nachweise

- `v5/dokumentation/P1A-CM-MULTI-CHARACTER.md`
- `v5/grundlage/quelle/koordination/cm-protokoll.ts`
- `v5/grundlage/quelle/koordination/cm-settlement.ts`
- `v5/grundlage/quelle/koordination/roster-wahrheit.ts`
- `v5/grundlage/quelle/koordination/character-liveness.ts`
- `v5/grundlage/quelle/koordination/account-koordinator.ts`
- `v5/grundlage/quelle/koordination/character-agent.ts`
- `v5/grundlage/tests/r14-cm-fault-injektion.test.mjs`
- `v5/grundlage/tests/r14-cm-settlement.test.mjs`

## Migration

V3/V4-Party-/CM-Runtimecode wird nicht importiert. R14 uebernimmt nur ratifizierte Semantik und baut die Koordinationsgrenze V5-nativ neu. Die bereits in R13 accountweit positionierte Bank-Lease bleibt unter `koordination/` und kann in R15 auf die neue Roster-/Liveness-/CM-Grundlage aufsetzen.

Produktive Adventure-Land-Transportadapter werden erst in der jeweils zustaendigen Runtime-/Execution-Grenze eingefuehrt. R14 selbst bleibt transport- und planning-only ohne `send_cm`-Raw-Write.

## Rollback

Ein Rollback von R14 entfernt nur die no-write Koordinationsprimitive, Tests und Metadaten. Da R14 keinen produktiven CM- oder Gameplay-Send freigibt, entsteht kein externer Adventure-Land-Zustand, der automatisch zurueckgerollt werden muesste.

Persistierte spaetere Roster-, Liveness-, Dedupe- oder Settlement-Snapshots duerfen bei einem Rueckbau nicht blind weiterverwendet werden; unbekannte oder inkompatible Versionen muessen fail-closed neu reconciliert werden.
