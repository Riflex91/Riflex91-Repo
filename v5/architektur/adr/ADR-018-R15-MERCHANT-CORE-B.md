# ADR-018 – R15 Merchant Core B: Supply, Gear und Production

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R15 baut die V5-native Merchant-Core-B-Schicht fuer Supply, Collection/Rendezvous, Gear und Production. Die Migration markiert CAP-028/029, CAP-033/034, CAP-035/036/037 und CAP-038 als fachlich relevant, aber mit `NEU_BAUEN`; V3/V4-Runtimecode darf nicht kopiert werden.

Die zentralen Risiken sind stale Zielidentitaet, duplicate/partial Delivery, doppelte physische Gear-Kandidaten, Recipe-Cycles, stale Event-/Quest-Evidence, persistierter Bankkatalog als falsche ExecutionAuthority, zu frueher Production-Commit und q/Placeholder als vermeintlich freier Bestand.

## Entscheidung

1. Supply Policy arbeitet mit Low-Watermark, Zielmenge, Mindest-/Maximalbatch und Merchant-Reserve. Kleine Micro-Restock-Schleifen werden nicht geplant.
2. Supply Delivery, Collection und Gear Delivery verwenden einen gemeinsamen bounded Logistikworkflow mit explizitem Source/Recipient, physisch gepinnten Posten, TTL, Roster-/Session-/Serverbindung und Rendezvous-Freshness.
3. Ein Transfer ist erst nach frischer Empfaenger-Inventardifferenz gegen denselben Baseline-Fingerprint `SETTLED`.
4. Nach Restart wird nichtterminaler Logistikzustand `RECOVERY_PENDING`; derselbe Transfer wird nicht blind erneut gesendet.
5. Gear-Allokation reserviert einen physischen Kandidaten hoechstens einmal und einen Recipient-Slot hoechstens einmal gleichzeitig. Farmer-Ziele werden vor Merchant-Self-Zielen priorisiert, ohne einen historischen 80/20-Wert als neue V5-Invariante zu uebernehmen.
6. Upgrade, Compound und Exchange verwenden einen Werttransaktions-Ledger. q, Placeholder oder attributable Consumable-Deltas bedeuten `AKZEPTIERT_IN_FLIGHT`.
7. `NICHT_AUSGEFUEHRT` ist nur mit positiver frischer Evidence fuer unveraenderte Inputs, Consumables und Conditions sowie ohne q/Placeholder erlaubt.
8. Nach Restart werden nichtterminale Werttransaktionen `ABGLEICH_ERFORDERLICH`; Same-Intent-Blind-Retry bleibt verboten.
9. Der persistente Bankkatalog ist ausschliesslich frische `planningEvidence` und besitzt `executionAuthority:false`. Mount-/Lease-Epochen und TTL werden gepinnt.
10. Der Production Graph ist bounded und azyklisch. Jeder Schritt muss zum Root beitragen; verwaiste Schritte sind unzulaessig.
11. Irreversible Production-Schritte benoetigen eindeutige Operation-Schluessel. Mutation-Schritte CRAFT/EXCHANGE/UPGRADE/COMPOUND benoetigen einen Workspace-Nachweis.
12. EVENT- und QUEST-Schritte benoetigen frische Gate-Evidence. Bekannte inaktive Events werden deferred; stale oder unbekannte Gate-Evidence blockiert fail-closed.
13. `CRAFT_COMMITTED != PRODUCTION_COMMITTED`. Ein fertiger Merchant-Output fuehrt nur zu `OUTPUT_BEREIT`.
14. Production darf erst nach final verifiziertem Recipient Settlement `COMMITTED` werden. Settlement ist an Recipient-Session, Server, Roster-Epoche, Baseline und positive Mengen-Differenz gebunden.
15. Restart setzt nichtterminale Production auf `RECOVERY_PENDING`; kein blinder Resume/Retry.
16. R15 selbst besitzt keine neue Gameplay- oder Raw-Write-Authority.

## Alternativen

- Legacy Merchant-/Production-Code kopieren: verworfen; Migration verlangt V5-native Neuimplementierung.
- Craft-Commit als Production-Commit behandeln: verworfen; verletzt V5-ALT-030.
- q/Placeholder als freien oder unentschiedenen Bestand behandeln: verworfen; P0-05/P0-06 belegen accepted in-flight.
- Persistent Bank Catalog als Ausfuehrungsautoritaet verwenden: verworfen; stale Planning Evidence darf keine Mutation freigeben.
- Production-DAG mit Zyklen oder verwaisten Tasks tolerieren: verworfen; oeffnet Endlosplanung und orphan work.
- Transfer nur anhand Senderverlust bestaetigen: verworfen; Settlement braucht positive Recipient-Evidence.
- Historische Farmer-80/20-Heuristik als harte V5-Regel uebernehmen: verworfen; nur Farmer-first und eindeutige physische Reservierung werden als sichere Semantik uebernommen.

## Konsequenzen

R15 besitzt einen bounded, restart-sicheren Merchant-/Production-Planungskern. Supply, Collection/Rendezvous, Gear und Production teilen explizite Freshness-/Settlement-Grenzen. Production kann event-/quest-gated geplant werden, ohne stale Eventzustand zur Authority zu machen. Breite Gameplay-Ausfuehrung bleibt gesperrt.

## Invarianten

- V5-ALT-030 – Production endet erst nach verifiziertem Recipient Settlement.
- V5-ALT-006 – jede Mutation besitzt expliziten Outcome-Verifier.
- V5-ALT-007 – Promise-/Transport-Erfolg ist kein fachlicher Commit.
- V5-ALT-008/V5-ALT-009 – Restart setzt langlebige Arbeit auf Reconciliation statt Blind-Resume.
- V5-ALT-026 – Character-Ziele bleiben an aktuelle Identitaet/Roster-Epoche gebunden.
- V5-INV-026 – Safety-Code besitzt Negativ-/Fault-Tests.

## Migration

CAP-028/029, CAP-033/034, CAP-035/036/037 und CAP-038 werden als Semantik- und Testwissen neu implementiert. V3/V4-Runtimeklassen werden nicht importiert. R13 liefert Disposition, Workspace, Budget und Bank-Lease; R14 liefert CM, Roster, Liveness und Coordinator/Agent-Fencing. R15 setzt ausschliesslich auf diese V5-Vertraege auf.

Produktive Adapter fuer Transfer, Upgrade, Compound, Exchange, Craft oder Bewegung werden nicht in diese Planungsschicht verschoben.

## Rollback

Ein Rollback von R15 entfernt die neuen planning/reconciliation Primitive und Metadaten, ohne Adventure-Land-Zustand direkt zu mutieren. Persistierte nichtterminale R15-Snapshots duerfen nach Schema-/Versionswechsel nicht blind fortgesetzt werden und muessen fail-closed neu reconciliert werden.

## Nachweise

- `v5/grundlage/quelle/merchant/supply-policy.ts`
- `v5/grundlage/quelle/merchant/logistik-workflow.ts`
- `v5/grundlage/quelle/merchant/gear-allokation.ts`
- `v5/grundlage/quelle/merchant/werttransaktion.ts`
- `v5/grundlage/quelle/produktion/bank-katalog.ts`
- `v5/grundlage/quelle/produktion/production-graph.ts`
- `v5/grundlage/quelle/produktion/production-intent.ts`
- `v5/grundlage/quelle/produktion/recipient-settlement.ts`
- `v5/grundlage/tests/r15-logistik-gear.test.mjs`
- `v5/grundlage/tests/r15-production-graph.test.mjs`
- `v5/grundlage/tests/r15-production-settlement.test.mjs`
- `v5/grundlage/tests/r15-werttransaktion.test.mjs`
