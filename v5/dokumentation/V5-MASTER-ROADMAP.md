# V5 Master-Roadmap

**Status:** BASELINE – wird nach Abschluss der P0-Research-Luecken finalisiert.

## R0 – Lebende Wissensbasis

V3-, V4- und externe Adventure-Land-Erkenntnisse dauerhaft, maschinenlesbar, versioniert und revalidierbar im Repository halten.

## R1 – P0 Research schliessen

Vor Merchant-Orchestrator und finalen V5-Kernvertraegen:

1. Action-Contract-Matrix aller wertverandernden Public Functions;
2. Recovery-Semantik je Action;
3. Bank-Concurrency eigener Characters;
4. Trade-Listing-Lifecycle, RID und Partial Sale;
5. Upgrade-/Compound-Formeln und Resultcodes;
6. Exchange-/Craft-Sonderfaelle;
7. Request-/Call-Cost-/Rate-Limit-Modell.

Ergebnisse werden als neue Evidence/Facts in der Wissensbasis gespeichert, nicht nur als Chattext.

## R2 – V5-Verfassung

Verbindliche Invarianten fuer Safety, Runtime-vs-Host, Single Owner, Definition/Observation/Reconciliation, Unknown Outcome, Persist-before-action, Bounded Retry, Live Revalidation, Explainability und austauschbare Module.

## R3 – Kernvertraege

Fact/Evidence, Demand/Goal, Workflow, Transaction, ActionRequest/ActionResult, ResourceClaim/Lease, ExecutionChannel, Postcondition, ReconciliationResult, Capability und Health.

## R4 – Scheduler + Transaction/Reconciliation Kernel

PriorityClass, Aging/Fairness/Deadlines, Safe Preemption, deterministische Locks, accountweite/character-lokale Ressourcen, Action-Channel-Serialisierung, persistentes Journal, UNKNOWN -> Reconcile und scoped Retry/Circuits/Budgets.

## R5 – Observation / World Truth

`G` als Definition Truth; Live Character/Entity/Party/Server/Event/Inventory/Bank Evidence; Freshness/TTL/Version; Re-resolve physischer Item- und Entity-Referenzen.

## R6 – Execution Kernel

Nur Execution Adapter kennen rohe Adventure-Land-Mutationen. Jede mutierende Capability besitzt Admission, Action Contract, Server Result, Postcondition und Reconciliation Contract.

## R7 – Recovery vor Featurebreite

Fault-Injection fuer Disconnect nach Send, Placeholder/q, Partial `equip_batch`, Inventory Index Drift, stale RID, Bankmutation, CM-Teilzustellung, Prozessrestart und corrupt/inkompatible Persistenz.

## R8 – Merchant als erste grosse Domaene

Demand Inbox -> Inventory Ledger -> Supply/Delivery -> Inventory/Bank -> Buy/Sell -> Collection -> Stand/Market -> Gear -> Upgrade/Compound -> Exchange/Craft -> Production.

## R9 – Multi-Character / Party

Group Truth, CM-Protokoll, Party Lifecycle, Liveness/Freshness, accountweite Ressourcen und Capability-basierte Gruppenkomposition.

## R10 – Combat / Farming / World Autonomy

Combat Safety, Target Ownership, Travel/Map Graph, Events, Quests, Rare/Boss Discovery, Serverwechsel und PvP/Hardcore Policies.

## R11 – Learning

Learning darf Vorschlaege/Scoring verbessern, aber keine Safety-, Authority-, Budget- oder Recovery-Invarianten lockern.

## R12 – 24/7-Zertifizierung

Replay, Fault Injection, Shadow, Controlled Live, Canary, 1h, 24h, 72h, 7d und spaeter 30d.
