# V3→V4-Funktionsmatrix

Status: semantische Capability-Matrix v1. Der vollständige Roh-Symbolindex für **238/238 Source-Dateien** liegt separat in `V3-ZU-V4-FUNKTIONSMATRIX-ROH.json`. Dieser Rohindex erfasst 2418 erkannte Symbole und 2342 Methoden; seine heuristische Source-Level-Einstufung ist ausdrücklich noch keine finale per-Symbol-Migrationsentscheidung.

| ID | Domäne | V3 Capability | Einstufung | V4 Ziel | Phase | Kernrisiko |
|---|---|---|---|---|---|---|
| CAP-001 | Core | GameAdapter / Game-Write-Grenze | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/ausfuehrung` | 8.7 | direkte Raw Writes; API-Drift |
| CAP-002 | Core | Action Outcome Verification | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/ausfuehrung/verifikation` | 8.7 | Return/Promise wird mit Commit verwechselt |
| CAP-003 | Core | Scheduler / Tasks | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/workflows` | 8.7 | Starvation; nur numerische Priority |
| CAP-004 | Core | Patch Registry | NUR_TEST_UND_WISSENSQUELLE | `v4/guards` | 8.7 | Patch-Reihenfolge und Ownership |
| CAP-005 | Composition | Runtime Composition | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/composition` | 8.7 | implizite Alpha-Abhängigkeiten |
| CAP-006 | Composition | Alpha-Runtime-Vererbung | NICHT_UEBERNEHMEN | `-` | 8.7 | Hotfix-Kaskaden; mehrere Ownership-Schichten |
| CAP-007 | Recovery | Global Supervisor | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/recovery/supervisor` | 8.7 | Recovery darf Safety nicht lockern |
| CAP-008 | Recovery | Runtime Watchdog | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/recovery/watchdog` | 8.7 | False No-Progress bei legitimer Wartezeit |
| CAP-009 | Persistence | World/Resilient Persistence | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/persistenz` | 8.7 | Quota, corrupt state, retry storm |
| CAP-010 | World | Content Drift / Knowledge Aging | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/world/content-safety` | 8.7 | Unknown→Allowed |
| CAP-011 | Farmer | Farmer FSM | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/farmer/workflow` | 9+ | BLOCKED loops; alte Scheduler-Kopplung |
| CAP-012 | Combat | Target Safety / Combat Risk / Emergency | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/combat/safety` | 9+ | Liveness vor Safety |
| CAP-013 | Combat | Kiting / Movement in Combat | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/combat/kiting` | 9+ | Movement-/Combat-Owner konkurrieren |
| CAP-014 | Combat | Skills / Capability Truth / Failure Intelligence | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/combat/skills` | 9+ | stale capability; retry spam |
| CAP-015 | Combat | Adaptive Pull / Smart AoE | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/combat/aoe` | später | Learning überschreibt Hard Caps |
| CAP-016 | Combat | Encounter Lifecycle / Learning Dedupe | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/combat/encounters` | später | doppelte Outcomes nach Restart |
| CAP-017 | Party | Registry / Dynamic Roster / Variable Topology | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/party/group-truth` | 9+ | stale Party-Identität |
| CAP-018 | Party | Control Lease / Lifecycle | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/party/lifecycle` | 9+ | Lease-Ablauf mitten in Transition |
| CAP-019 | Party | Cohesion / Focus Fire | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/party/combat-coordination` | 9+ | raw target; formation deadlock |
| CAP-020 | Party | Account Communication / CM | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/party/communication` | 9+ | handler displacement; duplicate messages |
| CAP-021 | Party | Controlled Party Logistics | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/party/logistics` | 9+ | pending offer deadlock; partial transfer |
| CAP-022 | Party | Production Material Handoff | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/production/material-handoff` | 9+ | Farmer farmt nach READY weiter |
| CAP-023 | Travel | Safe / Controlled Travel | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/travel` | 9+ | smart_move return != arrival |
| CAP-024 | Merchant | Inventory Ledger | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/inventory-ledger` | 9 | mehrere Module definieren Item-Bedeutung |
| CAP-025 | Merchant | Transaction Engine | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/transaction-journal` | 9 | blind retry; uncertain side effect |
| CAP-026 | Merchant | Controlled Merchant Executor | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/ausfuehrung/merchant` | 9 | destructive writes bei stale ledger |
| CAP-027 | Merchant | Merchant Task Coordinator | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/scheduler` | 8.7 | non-preemptive starvation |
| CAP-028 | Merchant | Merchant Service Planner/Executor | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/supply` | 9 | stale target; duplicate/partial delivery |
| CAP-029 | Merchant | Potion / Supply Policy | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/policies/supply` | 9 | micro-restock loop; dual owner |
| CAP-030 | Merchant | Bank Capacity / Expansion | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/bank-capacity` | 9 | kein Workspace; Budgetdrift |
| CAP-031 | Merchant | Bank Consolidation / Space Recovery | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/space-recovery` | 9 | partial mutation; unsafe emergency sell |
| CAP-032 | Merchant | Sell Safety / Economic Evaluation | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/policies/item-disposition` | 9 | Progression-/High-Value-Verlust |
| CAP-033 | Merchant | Gear Progression / Self Gear | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/gear` | 9+ | Duplicate Candidate; Lease pinning |
| CAP-034 | Merchant | Upgrade / Compound | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/item-mutation` | 9+ | Itemverlust; falsche Mutation; partial outcome |
| CAP-035 | Production | Production Planner | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/production/planner` | 9+ | Recipe cycle; stale Event source |
| CAP-036 | Production | Production Controller / Persistent Intent | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/production/workflow` | 9+ | Craft wird zu früh als Completion gewertet |
| CAP-037 | Production | Persistent Bank Catalog | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/knowledge/bank-catalog` | 9+ | stale Knowledge wird Execution Authority |
| CAP-038 | Merchant | Collection / Delivery / Rendezvous | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/delivery` | 9+ | stale target; source mismatch |
| CAP-039 | Merchant | MLuck Service | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/merchant/workflows/mluck` | 9+ | Service verdrängt kritischere Arbeit |
| CAP-040 | Economy | Market History / Economy Planning | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/economy/market` | später | stale Price Evidence |
| CAP-041 | Learning | Strategic Brain / Shadow Learning | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/learning` | später | learned authority creep |
| CAP-042 | Host | Headless / Narrow Bridge / Watchdog / Alerts / Certification | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/host` | host | generic remote control; restart loop; secret leakage |
| CAP-043 | Ops | Safe Auto Updater | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/ops/update-workflow` | später | Reload während Gefahr; false handshake |
| CAP-044 | Control | Cloud Control / Free-tier Budget | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/control/cloud` | später | remote config bypass; quota storm |
| CAP-045 | Certification | Production Graph Certification | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/production/certification` | 9+ | synthetic evidence mit Live-Beweis verwechselt |
| CAP-046 | Guards | Dependency / Runtime / Legacy Guards | KONZEPT_UEBERNEHMEN_NEU_BAUEN | `v4/guards` | 8.7 | Cycles; Cross-Owner-Imports; Altpfade |
| CAP-047 | Build | Dist Bundles | NICHT_UEBERNEHMEN | `v4/build` | build | generated Code als Wissensquelle missverstanden |

## Klassifikation

- **DIREKT_UEBERNEHMEN:** nur kleine, architektonisch neutrale Implementierungen ohne Alt-Layer-Kopplung.
- **KONZEPT_UEBERNEHMEN_NEU_BAUEN:** V3-Semantik und Regressionen behalten, V4-Implementierung neu auf Ports/Workflows bauen.
- **NUR_TEST_UND_WISSENSQUELLE:** Implementierung nicht portieren, Tests/Fehlerwissen bewahren.
- **NICHT_UEBERNEHMEN:** Struktur/Code bewusst verwerfen.

## Vollständigkeit

Die Datei-Audit- und Symbolinventur ist vollständig. Die semantische Capability-Matrix ist die erste konsolidierte Fassung und wird bei jeder konkreten V4-Modulimplementierung bis auf Symbol-/Test-Ebene rückverfolgt. Eine heuristische Zuordnung im Rohindex darf nicht allein als Freigabe zum Portieren verwendet werden.
