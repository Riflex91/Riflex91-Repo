# ADR-014 – R12 einmaliges Controlled-Live-Testgate vor breiter Runtime-Freigabe

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R12 verlangt nach bestandenem Shadow-Test einen echten Controlled-Live-Nachweis. Die breite Gameplay-Runtime darf gemaess V5-Verfassung erst spaeter freigegeben werden, wenn die Gesamt-Readiness `FREIGEGEBEN` meldet. Eine zusaetzliche Forderung, dass R12 Controlled Live bereits diese breite Freigabe benoetigt, erzeugt einen Zirkelschluss.

Gleichzeitig darf R12 keinen allgemeinen Runtime-, Host- oder Bridge-Bypass schaffen. Der Erstnachweis muss daher als eng begrenzter Test-Authority-Pfad modelliert werden.

## Entscheidung

1. Das globale/breite Gameplay-Runtime-Gate bleibt waehrend R12 `GESPERRT`.
2. R12 erhaelt einen separaten, nicht persistenten Controlled-Live-Testgate.
3. Dieses Testgate gilt ausschliesslich in Phase R12 fuer:
   - Action Contract `AL-ACTION-EQUIP`;
   - Recovery Contract `AL-RECOVERY-EQUIP`;
   - Verifier `AL-VERIFIER-EQUIP`;
   - Capability `equipment.equip`;
   - Owner `vertical-slice-controlled-live`.
4. Das Gate kann genau eine Admission freigeben und ist danach verbraucht.
5. Die Admission uebergibt dem Gate den konkreten Transaktions-/Action-/Owner-/Contract-Kontext; ein anderer Kontext wird abgelehnt.
6. Vor dem Gate muessen Shadow, direkte Health, V5-Persistenz, Ressourcen/Fencing, Action Channel, Socket-Budget, Operator-Freigabe und durable Intent nachgewiesen sein.
7. Die Live-Preconditions `inventory_item_identity` und `equipment_slots` werden unmittelbar vor der Mutation direkt im Adventure-Land-Codekontext revalidiert.
8. Parallel laufende V3/V4-Gameplay-Runtime blockiert den Test. V3/V4 wird weder importiert noch als V5-Execution-Pfad benutzt.
9. Der lokale One-Shot-Runner darf CDP ausschliesslich ueber loopback HTTP verwenden und genau eine `equip`-Mutation senden.
10. Der One-Shot journaled auf dem V5-Datenpfad `D:\AdventureLand-V5`; bestehender V3-Browser-LocalStorage-/Checkpoint-Druck ist kein V5-Durability-Nachweis.
11. Nach moeglichem Send gibt es niemals Same-Intent-Retry. UNKNOWN, Partial oder widerspruechliche Evidence gehen in Reconciliation/Operator.
12. Ein erfolgreicher R12-Live-Nachweis verlangt:
    - `gameWrites=1`;
    - `unerwarteteGameWrites=0`;
    - bestaetigte Postcondition;
    - gepinnte Git-/Knowledge-/Config-/Prestate-Fingerprints;
    - `breiteRuntimeFreigabe=false`.
13. Windows Bridge und Host behalten `gameplayAuthority=false`; es wird kein generischer Remote-Command-Endpunkt eingefuehrt.
14. ADR-014 ersetzt ADR-013 Entscheidung 5 sowie den dortigen Migrationssatz, soweit diese eine vorherige breite Runtime-Freigabe verlangten.

## Alternativen

- **Breite Runtime vor R12 freigeben:** verworfen; wuerde den phasenweisen Safety-Nachweis umgehen.
- **Controlled Live erst nach Gesamtfreigabe:** verworfen; erzeugt einen Zirkelschluss mit dem R12-Live-Nachweis.
- **Bridge um Remote-Evaluate oder Gameplay-Commands erweitern:** verworfen; verletzt die Host-/Gameplay-Authority-Grenze.
- **V3/V4 fuer den Test weiterlaufen lassen:** verworfen; konkurrierende Writer und historische Runtime duerfen den V5-Nachweis nicht beeinflussen.
- **Browser-LocalStorage fuer V5-Durable-Intent verwenden:** verworfen; V5-Persistenzmodell verlangt den vorgesehenen lokalen Datenpfad und ausreichende Speicherreserve.

## Konsequenzen

- R12 kann den geforderten echten Controlled-Live-Nachweis erbringen, ohne die breite Runtime zu oeffnen.
- Das Testgate ist technisch kleiner als eine Runtime: genau eine Admission, genau eine Action-Familie, genau eine Mutation.
- Ein fehlerhafter Test kann keine automatische Wiederholung desselben Intents ausloesen.
- Bestehender V3-Persistenz-/Quota-Druck muss nicht durch Datenloeschung repariert werden; V3/V4 muss fuer den Test lediglich als Parallelwriter gestoppt sein.
- Nach erfolgreichem R12-Nachweis bleibt breite Gameplay-Autoritaet weiterhin separat gesperrt, bis spaetere Gates sie explizit oeffnen.

## Invarianten

Insbesondere:

- V5-INV-002 – mehrere unabhaengige Verriegelungen vor Mutation;
- V5-INV-004 – typisierte, kurzlebige Execution-Freigabe;
- V5-INV-005 – Authority wird unmittelbar vor Write erneut validiert;
- V5-ALT-024 – Live-Preconditions unmittelbar vor Mutation;
- V5-INV-030 – erster mutierender Slice ist klein, beobachtbar und begrenzt;
- V5-ALT-006/V5-ALT-007 – Postcondition-/Reconciliation-Evidence, Serverresultat allein ist kein Commit;
- V5-ALT-008/V5-ALT-009 – Restart/Recovery erteilt keine blinde ExecutionAuthority.

## Migration

Der R12-Testpfad liegt unter der bestehenden V5-Execution-/Admission-Grenze. Es wird keine dauerhafte Runtime-Komposition angelegt. Der One-Shot-Runner wird erst nach Merge auf sauberem `main` lokal ausgefuehrt und beendet sich nach dem einzelnen Versuch.

Spaetere Runtime-Phasen duerfen diesen Testgate nicht als allgemeine Gameplay-Freigabe wiederverwenden.

## Rollback

Vor dem ersten erfolgreichen Live-Lauf ist ein Rollback code-only. Nach einem erfolgreichen Lauf ist genau eine Equipment-Aenderung moeglich; deren Zustand ist durch Postcondition-Evidence und das durable R12-Journal dokumentiert. Ein Rollback darf keine zweite Mutation automatisch ausloesen.

## Nachweise

- `v5/grundlage/quelle/ausfuehrung/ports.ts`
- `v5/grundlage/quelle/ausfuehrung/admission.ts`
- `v5/grundlage/quelle/vertical-slice/controlled-live-policy.ts`
- `v5/grundlage/quelle/vertical-slice/controlled-live-gate.ts`
- `v5/grundlage/quelle/vertical-slice/controlled-live-auswahl.ts`
- `v5/werkzeuge/r12-controlled-live-equip-runner.mjs`
- `v5/werkzeuge/r12-live/cdp.mjs`
- `v5/werkzeuge/r12-live/datei-journal.mjs`
- `v5/werkzeuge/r12-live/browser-equip.mjs`
- `v5/grundlage/tests/r12-controlled-live-gate.test.mjs`
- `v5/grundlage/tests/r12-controlled-live-auswahl.test.mjs`
- `v5/grundlage/tests/r12-controlled-live-runner.test.mjs`
