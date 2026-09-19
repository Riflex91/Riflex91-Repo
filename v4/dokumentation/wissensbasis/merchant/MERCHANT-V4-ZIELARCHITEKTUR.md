# Merchant V4 – Zielarchitektur

Status: Zielentwurf v1  
Priorität: höchste Fachpriorität in V4.

## 1. Grundsatz

Merchant ist **kein Feature-Bündel**, sondern ein eigener Multi-Workflow-Orchestrator.

Alle Merchant-Funktionen teilen sich:
- denselben physischen Inventory-Zustand;
- Bank;
- Gold;
- Movement;
- Trade-/Delivery-Reichweite;
- Stand;
- Gear;
- zeitkritische Versorgung;
- persistente Transaktionen.

Deshalb darf es niemals mehrere unabhängige Merchant-Entscheider geben, die diese Ressourcen parallel verändern.

## 2. Top-Level-Komponenten

```
MerchantOrchestrator
  ├─ MerchantDemandInbox
  ├─ MerchantWorkflowPlanner
  ├─ MerchantScheduler
  ├─ MerchantResourceManager
  ├─ InventoryLedger
  ├─ TransactionJournal
  ├─ MerchantReconciler
  ├─ Workflow Providers
  │   ├─ Supply
  │   ├─ Inventory
  │   ├─ Bank
  │   ├─ Sell
  │   ├─ Buy
  │   ├─ Gear
  │   ├─ Upgrade
  │   ├─ Compound
  │   ├─ Production
  │   ├─ Collection
  │   ├─ Delivery
  │   ├─ MLuck
  │   ├─ Exchange
  │   ├─ Market
  │   └─ User Orders
  └─ Ports -> V4 execution / observation
```

Nur `MerchantOrchestrator` darf Merchant-Workflows zur Ausführung zulassen. Planner/Services besitzen `actionAuthority:false`.

## 3. Merchant-Demand

Alle Anforderungen werden als Demand normalisiert:

```js
{
  demandId,
  type,
  source,
  subject,
  priorityClass,
  priority,
  createdAt,
  expiresAt,
  evidence,
  constraints,
  desiredOutcome,
  dedupeKey
}
```

Beispiele:
- Farmer hat kritischen Potion-Mangel;
- Inventory unter Mindest-Freeslots;
- Production benötigt Material;
- Bank braucht Capacity Recovery;
- Gear ist für Farmer bereit;
- User fordert bestimmtes Item;
- MLuck-Dienst ist fällig;
- Marktpreis-Beobachtung ist überfällig.

Demand ist noch keine Aktion.

## 4. Priorität

### EMERGENCY
- Merchant unmittelbar gefährdet
- kritische Inventory-/Transaction-Reconciliation, die weitere Writes blockiert

### SAFETY
- ungeklärte aktive Mutation
- stale/inkonsistente Bank-/Inventory-Evidenz
- Resource-Lease-Konflikt

### CRITICAL_SUPPLY
- Farmer/Party kritischer Potion-/Versorgungsmangel

### REQUIRED_SERVICE
- notwendige Delivery/Handoff
- Party- oder Production-Settlement

### PRODUCTION_OR_USER_ORDER
- aktive Production
- expliziter Nutzerauftrag

### NORMAL_WORK
- Bank, Sell, regulärer Einkauf, Collection

### OPTIMIZATION
- Gear-Optimierung, Market, Konsolidierung

### BACKGROUND
- Katalogpflege, historische Daten, nicht dringende Revalidation

## 5. Scheduler

Der Merchant Scheduler entscheidet anhand von:

1. PriorityClass
2. numerischer Priorität
3. Deadline
4. Aging
5. Resource Conflict
6. aktuelle Location/Route
7. Transaktionsphase
8. erwartete Kosten
9. Freshness der Demand-Evidenz

Er darf Work bündeln, wenn Semantik identisch bleibt, z. B. Potion-Bedarfe mehrerer Farmer auf einer Route.

Er darf **nicht** zwei konkurrierende Workflows starten, nur weil beide "bereit" sind.

## 6. Preemption

### Sofort preemptierbar
- Marktbeobachtung
- Background-Katalogpflege
- reine Planung
- Travel vor erster irreversibler Aktion, sofern Route sicher abbrechbar

### Am nächsten Safe Point preemptierbar
- Bank-Workflow zwischen vollständig verifizierten Teiloperationen
- Production zwischen Steps
- Collection zwischen Settlements
- Delivery vor `send_item` oder nach verifiziertem Delta

### Nicht preemptierbar
- raw `send_item` gesendet, Delta noch ungeklärt
- raw Bank Mutation gesendet, Delta ungeklärt
- Upgrade/Compound zwischen Mutation und Outcome
- persisted Commit-Phase
- Reconciliation eines potentiell bereits erfolgten Side Effects

Höhere Priorität wartet in diesen kurzen Fenstern, statt die Transaktion zu zerreißen.

## 7. Inventory Ledger

Der Ledger ist die **einzige semantische Item-Wahrheit**.

Jedes physische Item erhält:

```js
{
  itemHandle,
  character,
  inventoryRevision,
  slot,
  fingerprint,
  name,
  level,
  quantity,
  locked,
  special,

  disposition,
  dispositionReasons,
  reservedByWorkflowId,
  reservationQuantity,

  confidence,
  observedAt
}
```

Dispositionen:

- KEEP
- RESERVE_GROUP
- RESERVE_PROGRESSION
- RESERVE_COMPOUND
- RESERVE_UPGRADE
- RESERVE_PRODUCTION
- RESERVE_DELIVERY
- SELL
- BANK
- EXCHANGE
- UNDECIDED

### Verbot

Sell, Bank, Upgrade, Compound oder Delivery dürfen nicht selbst neue Item-Bedeutung erfinden.

## 8. Inventory Capacity

Inventory Space ist eine Ressource.

Der Planner kennt:
- reale `isize`;
- belegte Slots;
- Stackability;
- reservierte Incoming Slots;
- Workspace Slots;
- Merchant Pickup Reserve;
- mutierende Operationen mit temporärem Slotbedarf.

Kein mehrstufiger Workflow startet ohne Capacity-Preflight.

## 9. Transaction Journal

Jeder irreversible Merchant Side Effect erhält einen Journal-Eintrag:

```js
{
  transactionId,
  workflowId,
  idempotencyKey,
  type,
  phase,
  beforeEvidence,
  request,
  sentAt,
  acknowledgement,
  expectedOutcome,
  observedOutcome,
  committedAt,
  failure,
  reconcileState,
  schemaVersion
}
```

### Persist-before-action

Für riskante Operationen:
1. Preconditions prüfen.
2. Resource Locks halten.
3. Journal `RESERVED` persistent schreiben.
4. erst danach Raw Action.
5. auf Outcome warten.
6. Commit oder Reconcile.

## 10. Reconciliation

Nach Restart werden alle nicht-terminalen Merchant-Workflows eingefroren.

Reconcile-Reihenfolge:
1. Character/Inventory/Bank frisch beobachten.
2. ItemHandle/Fingerprint neu zuordnen.
3. eventuell bereits erfolgten Side Effect erkennen.
4. Transaction Journal gegen Live-Deltas prüfen.
5. Locks/Reservierungen rekonstruieren.
6. genau eines:
   - COMMITTED;
   - ABORTED;
   - REPLAN_ALLOWED;
   - FAILED_SAFE / OPERATOR_REQUIRED.

Kein "letzten Befehl noch einmal senden".

## 11. Supply Workflow

Phasen:

```
DEMAND_VALIDATION
-> TARGET_FRESHNESS
-> STOCK_CHECK
-> RESTOCK_PLAN?
-> TRAVEL?
-> PRE_DELIVERY_SNAPSHOT
-> SEND_RESERVED
-> SEND
-> LOCAL_DELTA_VERIFY
-> RECIPIENT_SETTLEMENT
-> COMMITTED
```

Regeln:
- Trust + Visibility + Same Map/Range vor Send;
- motion-aware Freshness;
- Merchant eigene Reserve nicht unterschreiten;
- gleiche kritische Demands batchbar;
- keine Micro-Restock-Schleifen;
- Legacy-Supply-Owner existiert nicht parallel.

## 12. Collection Workflow

Farmer bietet transferierbare Items/Gold an.

Regeln:
- Farmer behält geschützte Potions/locked/special Items;
- Merchant reserviert Incoming Slot vor Grant;
- identische Item-Transfers serialisieren;
- Recipient Settlement bestätigt physische Aufnahme;
- NACK/Timeout gibt Reservation frei;
- Gold und Items sind getrennte Settlement-Familien.

## 13. Bank Workflow

Subtypen:
- STORE
- RETRIEVE
- CONSOLIDATE
- CAPACITY_REPAIR
- EXPANSION
- EMERGENCY_SPACE_RECOVERY

Ressourcen:
- merchant:movement
- merchant:inventory
- merchant:bank
- item handles
- ggf. merchant:gold

Jeder Teilstep wird einzeln verifiziert. Cross-floor/Pack-Wechsel ist eigener Travel-/Observation-Step.

## 14. Sell Workflow

SELL ist destruktiv und benötigt:

- zentrale Ledger-Disposition SELL;
- keine aktive Gear-/Production-/Delivery-Reservation;
- Sell Safety Consensus;
- unmittelbare Live-Revalidation;
- Plan-Fingerprint;
- Action Budget;
- Delta-/Gold-Verifikation;
- Circuit bei wiederholtem Fehler.

Emergency Sell ist eine eigene explizite Capability und darf nicht aus normaler Capacity-Logik "durchfallen".

## 15. Buy Workflow

BUY benötigt:
- Demand;
- Item/Quantity;
- Vendor/Market Source;
- Preis-/Gold-Fingerprint;
- Goldreserve;
- Inventory Capacity;
- Delta Verification.

Production BUY und Supply BUY dürfen gemeinsame Route/Order optimieren, aber ihre Budgets und Reservationen bleiben getrennt nachvollziehbar.

## 16. Gear Workflow

Gear besteht aus:
- Goal Generation
- Candidate Allocation
- Reservation
- Mutation falls nötig
- Delivery
- Equip Settlement

Bessere physische Kandidaten dürfen nur einem Ziel gleichzeitig zugeordnet werden.

Farmer-/Party-Ziele sind an aktuelle Roster-Identität gebunden.

## 17. Upgrade Workflow

Phasen:

```
GOAL
-> ITEM_RESERVE
-> SCROLL_RESERVE
-> WORKSPACE_CHECK
-> PRE_MUTATION_SNAPSHOT
-> PERSIST
-> MUTATE
-> VERIFY_RESULT
-> RECLASSIFY_LEDGER
-> COMMIT
```

Upgrade darf nicht als "arbitrary fallback" getarnt werden. Jede Mutation ist an den konkreten Gear-/Economy-Intent gebunden.

## 18. Compound Workflow

Zusätzlich:
- genau drei kompatible physische Items;
- character-local Set;
- fair backlog scheduling;
- keine Kombination über verschiedene Charakterinventare;
- Ergebnis wird neu im Ledger klassifiziert.

## 19. Production Workflow

Production ist ein übergeordneter Workflow mit Child Steps:

- source selection
- bank retrieve
- buy
- farm demand
- handoff
- exchange
- upgrade/compound
- craft
- final delivery
- recipient settlement

### Completion

```
CRAFT_COMMITTED != PRODUCTION_COMMITTED
```

Erst:
```
FINAL_PRODUCTION_RECIPIENT_VERIFIED
```
beendet den Workflow.

## 20. Production Material Handoff

Wenn Farmers genug Material halten:
- Farm Objective wird auf Handoff umgestellt;
- Farmer stoppen weiteres Material-Farmen;
- Cross-Map-Farmtravel wird bereinigt;
- Material bleibt transferierbar;
- Merchant/Party Logistics übernimmt Settlement.

## 21. Event-/Quest-Produktion

Event-/Quest-Quellen tragen:
- source ID;
- Live Event Key;
- observedAt;
- expiry/freshness;
- Destination/NPC Evidence.

Vor dem irreversiblen Exchange/Craft wird Event/Quest-Evidence erneut geprüft. Keine boolesche Event-Flag ohne deterministische Identität als Autorität.

## 22. MLuck

MLuck ist ein normaler Service-Workflow:
- Target Freshness
- Skill Capability
- Range/Travel
- Cooldown
- Outcome/Effect Verification
- Rate Limit

MLuck darf Supply/Recovery nicht verdrängen.

## 23. Market / Economy Optimization

Market Observation ist read-only/background.

Market Action ist separat:
- Price Evidence
- Freshness
- Limits
- Gold/Inventory Budget
- User Policy
- Risk/Expected Value

Stale Marktpreise erzeugen keinen Trade.

## 24. User Orders

Nutzerauftrag wird als Demand mit hoher, aber nicht Safety-brechender Klasse modelliert.

Ein Nutzerauftrag darf:
- Production priorisieren;
- bestimmte Items reservieren;
- Budget setzen;
- Deadline setzen.

Er darf keine Systeminvariante deaktivieren.

## 25. Travel

Merchant Travel ist Child Workflow/Port, nicht eigener Entscheider.

Travel besitzt:
- destination identity;
- reason/workflow ID;
- freshness;
- circuit;
- bounded retries;
- arrival verifier.

Bei Gefahr darf Safety preempten.

## 26. Locks

Mindestens:

- merchant:movement
- merchant:inventory
- merchant:bank
- merchant:trade
- merchant:stand
- merchant:gear
- merchant:production-intent
- item:<handle>

Lock-Reihenfolge wird deterministisch festgelegt, um Deadlocks zu verhindern.

## 27. Starvation

Mechanismen:
- Aging
- Deadline escalation
- max continuous owner slice
- release on NO_PROGRESS
- blocked-until statt busy-loop
- per-identity Backoff
- Fairness Rotation

Critical Supply darf Background dauerhaft verdrängen; normale Production darf aber nicht durch einen permanenten HOLD-Lock verhungern.

## 28. Status / Erklärbarkeit

Merchant Status beantwortet:

- Was ist aktuell der höchste Demand?
- Welcher Workflow läuft?
- Warum?
- Welche Ressourcen hält er?
- Was blockiert ihn?
- Wann ist der nächste Safe Preemption Point?
- Welche Transaktion wartet auf Outcome?
- Welche Circuits sind offen?
- Welche Workflows altern?
- Was wird nach Restart reconciliert?
- Welche Item-Reservationen existieren?

## 29. Tests

Pflichtfamilien:

- Priority/Preemption
- starvation/aging
- lock ordering/deadlock
- persist-before-action
- duplicate prevention
- partial completion
- restart reconciliation
- stale target/freshness
- physical item identity
- inventory workspace
- bank full
- action budget
- circuit isolation
- operator stop
- production recipient settlement
- event expiry
- no dual owner

## 30. Soak

Merchant-Soak misst mindestens:

- Workflow throughput;
- max wait per PriorityClass;
- Starvation count;
- Preemption count;
- unsafe preemption count = 0;
- unresolved transactions;
- duplicate side effects = 0;
- recovery/reconcile success;
- Inventory/Bank invariant violations = 0;
- memory/history growth bounded;
- task thrash / plan churn;
- Delivery settlement latency;
- Production completion latency.

## 31. V3-Migrationsprinzip

Nicht übernehmen:
- Alpha27/28/32/33 als Layer;
- Patch-/Hotfix-Verkettung;
- mehrere Merchant-Busy-Prüfungen als impliziter Scheduler;
- direkte Runtime-Objektkopplung.

Übernehmen:
- zentrale Ledger-Semantik;
- persist-before-action;
- Outcome Verification;
- scoped Circuits/Budgets;
- exact physical reservations;
- Recipient Settlement;
- motion-aware Freshness;
- restart reconciliation;
- dedupe/idempotency;
- single owner;
- bounded evidence.

Das Ziel ist ein Merchant-System, das neue Dienste durch registrierte Workflow Provider erweitert, ohne den Orchestrator oder fremde Module patchen zu müssen.
