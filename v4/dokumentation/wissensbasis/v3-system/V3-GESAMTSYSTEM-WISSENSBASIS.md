# V3-Gesamtsystem-Wissensbasis

Status: semantische Konsolidierung v1  
V3-Quellsnapshot: `main@94e3a9962c1cba757e4d39b8e53f9ba4d8f4a376`  
V3-Quellbaum: `395f0f51921c0d583eb9c3b8ff45e41ed75f7d28`  
Vollständiger Datei-/Roh-Audit: `v4/dokumentation/wissensbasis/v3-datei-audit/`

## Zweck

Dieses Dokument beschreibt die aus V3 zu bewahrende **Semantik**, nicht die historische Alpha-/Hotfix-Struktur. V3 bleibt Wissens-, Fehler-, Test- und Produktionsbeobachtungsquelle; V3 ist nicht die V4-Zielarchitektur.

Der vollständige Roh-Audit umfasst 535/535 Dateien. Diese semantische Konsolidierung basiert auf dem vollständigen Datei-Audit, den 205 Tests als Verhaltensspezifikation sowie vertieften Reads der zentralen Owner-, Guard-, Host-, Merchant-, Economy-, Party-, Farmer-, Persistence- und Recovery-Dateien. Einzelne Symbol-/Funktionszuordnungen werden in der Funktionsmatrix weiter verfeinert; deshalb ist "Roh-Audit vollständig" von "semantische Migration vollständig" zu unterscheiden.

## Gesamtablauf

```
Start
  -> Runtime Composition
  -> Observation / Snapshot / World Model
  -> Planning
  -> Authority Admission / Ownership / Lease / Budgets
  -> GameAdapter / technische Game-Write-Grenze
  -> serverseitige bzw. lokale Reaktion
  -> Outcome Verification
  -> Commit | Failed-Safe | Reconcile
  -> Telemetry / Evidence
  -> Host Observation / Process Supervision
```

### 1. Runtime Composition

**Verantwortung:** Produktionsruntime zusammensetzen, ohne Fachautorität aus historischen Alpha-Vererbungen abzuleiten.

**V3-Erkenntnis:** Der Runtime-Composition-Guard verlangt, dass die Produktionskomposition nur vom stabilen Runtime-Basistyp erbt und nicht direkt von Alpha-Runtimes. Frühere Alpha-Schichten bleiben historische Implementierungsquellen, aber nicht das gewünschte Kompositionsmodell.

**V4-Konsequenz:** Komponenten werden über explizite Module, Ports und Capability-Registrierung zusammengesetzt. Keine Runtime-Vererbungskette als Feature-Integrationsmechanismus.

### 2. Observation / Game State

**Verantwortung:** Charakter, Entities, G-Daten, Party, Inventory, Bank, Cooldowns und weitere beobachtbare Weltzustände normalisieren.

**V3-Erkenntnis:** `GameAdapter.snapshot()`, World Model, Party-/Registry-Evidenz und Persistenz bilden die Basis für Entscheidungen. Fehlende oder stale Evidenz wird in kritischen Pfaden nicht als Erfolg oder Freigabe interpretiert.

**V4-Konsequenz:** Jede Entscheidung trägt Zeit, Provenienz, Freshness und – wo sinnvoll – Confidence. "Nicht beobachtet" ist nicht gleich "nicht vorhanden".

### 3. Planning

**Verantwortung:** Fachentscheidungen ohne rohe Game-Write-Autorität treffen.

Wichtige V3-Planer:
- Farmer-/Target-/Combat-Planung
- Merchant Service Planner
- Merchant Production Planner
- Gear Progression
- Inventory Ledger
- Bank-/Capacity-Planung
- Party-/Logistikplanung
- Content-/Progression-/Acquisition-Planung

**Zentrale Semantik:** Planer dürfen bei fehlender Evidenz HOLD/BLOCKED/UNDECIDED liefern. Sie müssen keine Aktion erfinden, nur um Liveness zu erzeugen.

### 4. Authority Admission / Ownership

V3 besitzt mehrere Mechanismen:
- Scheduler-Tasks
- Merchant Task Coordinator
- Control Leases
- explizite ACK-Gates
- Action-/Retry-Budgets
- Circuits
- Subsystem-/Operator-Freigaben

**V3-Stärke:** konkurrierende Ausführung wird häufig fail-closed verhindert.

**V3-Grenze:** Der Merchant Task Coordinator ist im Kern exklusiv und nicht-preemptiv. Neuere Tests mussten deshalb explizit sicherstellen, dass NO-PROGRESS/HOLD/abgelehnte Arbeit Leases freigibt, damit andere Merchant-Arbeit nicht verhungert.

**V4-Konsequenz:** Exklusivität bleibt, wird aber durch einen echten resumierbaren Workflow-Scheduler mit Prioritätsklassen, Safe-Preemption-Punkten, Aging und Reconciliation ersetzt.

### 5. Game Write

`GameAdapter` ist die technische V3-Schreibgrenze. Der Command-Katalog kennzeichnet mutierende Aktionen und deren erwartete Outcome-Art. Der statische Game-Command-Boundary-Guard verbietet direkte Adventure-Land-Mutationen außerhalb der vorgesehenen Grenze.

**V4-Konsequenz:** Nur `ausfuehrung/` besitzt reale Adventure-Land-Schreibautorität. Fachmodule kennen ausschließlich Ports und strukturierte Anfragen/Workflows.

### 6. Outcome Verification

Eine der wichtigsten V3-Erkenntnisse:

> Ein zurückgekehrter API-Aufruf oder ein Promise ist nicht automatisch der Beweis für den fachlichen Erfolg.

V3 verifiziert unter anderem:
- Inventory-Deltas nach Transfers, Kauf, Verkauf, Bank, Craft
- Equipment-Zustand nach Equip/Unequip
- Movement/Arrival anhand beobachteter Position bzw. SafeTravel-Zustand
- Stand-Zustand nach Open/Close
- Recipient Settlement nach Production
- Party-/Lifecycle-Zustand nach Transitionen

**V4-Lifecycle für mutierende Aktionen:**

```
REQUESTED
-> ADMITTED
-> RESERVED
-> SENT
-> ACKNOWLEDGED?       (optional/technisch)
-> OBSERVING
-> COMMITTED           (nur nach fachlicher Evidenz)
| FAILED
| TIMED_OUT
| UNCERTAIN_RECONCILE_REQUIRED
```

Ein serverseitiges ACK darf fachliche Beobachtung ergänzen, aber nicht ungeprüft ersetzen.

### 7. Transactions / Economy

`EconomyTransactionEngine` modelliert Reservierung, Lease, Circuit, Reconcile, Commit und Failed-Safe. Inventory Ledger liefert semantische Dispositionen statt rohe Item-Listen.

Wichtige Dispositionen:
- KEEP
- RESERVE_GROUP
- RESERVE_PROGRESSION
- RESERVE_COMPOUND
- RESERVE_UPGRADE
- SELL
- BANK
- EXCHANGE
- UNDECIDED

**Invariante:** Sell, Bank, Compound, Upgrade und Gear dürfen nicht unabhängig voneinander neu definieren, was ein physisches Item bedeutet.

### 8. Merchant

Merchant ist der komplexeste V3-Fachbereich und die wichtigste V4-Migrationsquelle.

Bereiche:
- Service / Potions
- Inventory Pressure
- Collection
- Bank
- Bank Capacity / Expansion
- Space Recovery / Consolidation
- Sell
- Transfers / Delivery
- Gear Progression / Self Gear
- Upgrade / Compound
- Production / Craft / Exchange
- Material Acquisition / Handoff
- MLuck
- Market History / Economy Planning
- Travel
- Recovery / Reconciliation

**Wichtige V3-Regeln:**
- genau ein Owner darf eine konkrete Merchant-Operation kontrollieren;
- physische Items werden reserviert, nicht nur Itemnamen;
- persist-before-action bei mehrstufigen/irreversiblen Operationen;
- Restart macht nicht-terminales Work zu Reconciliation, nicht zu Blind-Retry;
- Inventory Workspace wird vor Bank/Compound/Upgrade geprüft;
- Transaktionsresultat wird über Deltas/Evidenz verifiziert;
- Action-/Failure-Budgets sind begrenzt;
- Service-Ziele brauchen Freshness, Trust, Visibility und Range;
- identitätsbezogene Backoffs sollen andere Identitäten nicht global blockieren;
- Production ist erst nach Recipient Settlement fachlich abgeschlossen.

### 9. Production

Production Planner baut rekursive Beschaffungs-/Craft-Pfade und schützt Reservierungen sowie Goldreserve. Quellen können lokal, Bank, Vendor, Recipe Graph, Mutation, Quest/Event oder Farming sein.

**Besonders wichtig:** Ein Craft-Commit beendet Production nicht. Der persistierte Production Intent hält das Ziel bis zum verifizierten Empfänger-Settlement stabil. Erst danach werden Task, Material Objective, Mutation-/Exchange-Demand freigegeben.

Weitere Regeln:
- Farmers teilen sich nicht auf konkurrierende Production-Ziele auf;
- MATERIAL_READY_FOR_HANDOFF beendet weiteres Farmen für dieses Material;
- Production-Farm verwendet konservative P90-Zeitentscheidungen;
- Event-gebundene Quellen müssen zur Ausführungszeit noch aktiv belegt sein;
- ein persistierter Observer Cursor verhindert doppelte irreversible Evidence nach Restart.

### 10. Farmer / Combat

Farmer FSM modelliert WAIT/RECOVER/TRAVEL/ENGAGE/REASSESS/BLOCKED-artige Zustände über einen Scheduler-Task.

Bewahrenswerte Regeln:
- Safety vor Liveness;
- unbekannter/quarantinierter Content bleibt blockiert;
- aktive Selbstverteidigung/Combat besitzt Vorrang vor normaler Repositionierung;
- Target-/Planwechsel brauchen Anti-Thrashing;
- Terrain-/Movement-Recovery ist begrenzt;
- fehlende oder lange erwartbare Wartephasen dürfen nicht als künstlicher No-Progress-Spam eskalieren;
- Skill-/AoE-Erweiterung darf harte Risikogrenzen nicht überschreiten;
- gelerntes Wissen muss altern und revalidiert werden.

### 11. Party / Multi-Character

V3 besitzt:
- Party Registry / dynamische Roster-Erkennung
- variable Topologien
- Control Lease
- Heartbeats / Liveness
- Party Bootstrap / Lifecycle
- Team Combat Cohesion / Focus Fire
- Moving-Target-Freshness
- Account Character Transport
- Party Logistics
- Production Material Acquisition/Handoff
- deduplizierte CM-/ACK-/NACK-Pfade

**V4-Konsequenz:** Diese Mechanismen werden nicht als einzelne Hotfixes portiert, sondern in eine einheitliche Gruppen-Wahrheit, Lease-/Freshness-Semantik und Workflow-Orchestrierung überführt.

### 12. Travel / Navigation

V3 unterscheidet lokale Bewegung, `smart_move`, Cross-Map-Farmer-Travel, Merchant-Travel, Terrain-Recovery und Arrival-Verifikation.

**Kernregel:** Rückkehr von `smart_move` ist nicht automatisch Arrival. V3 enthält explizite Regressionen, die auf beobachtete Ankunft warten.

V4 benötigt für Travel:
- eindeutigen Owner;
- Route/Objective-Identität;
- bounded retry;
- Movement Circuit;
- Arrival Evidence;
- Abort/Replan bei Drift;
- keine Konkurrenz zu Combat Emergency.

### 13. Persistence

Persistenz ist versionierte Evidenz, keine Ausführungsautorität.

V3 besitzt:
- schema-/zustandsorientierte Speicherungen;
- Load/Save-Failure-Streaks;
- exponentiellen Backoff;
- Save Circuit;
- Quota-Preflight;
- fail-closed Verhalten bei korruptem/fehlendem sicherheitskritischem Zustand.

**V4-Regel:** Jeder persistierte nicht-terminale Workflow wird nach Restart zunächst auf `RECONCILE_REQUIRED` gesetzt.

### 14. Supervisor / Recovery

Der Global Supervisor bewertet Health und darf – sofern explizit freigegeben – nur sicherheitsreduzierende Fallbacks ausführen. Recovery besitzt Budgets.

Der Runtime Watchdog ist recommendation-only und unterscheidet:
- Freshness-Probleme;
- erwarteten Gameplay-Fortschritt;
- Clock-Anomalien;
- Watch/Degraded.

**Keine Selbstrettung durch Autoritätsausweitung.**

### 15. Runtime vs Host

Verbindliche V3-Erkenntnis:
- Runtime = Gameplay-Autorität.
- Host = Browser-/Prozess-Lifecycle, Alert-Transport, read-only Observability.
- Dashboard = Client, niemals Gameplay-Owner.

Der Host darf den Prozess nur unter expliziten, begrenzten Regeln neu starten. Ein Prozessrestart ist **kein Gameplay-Recovery-Nachweis**. Danach muss Runtime Live-Zustand neu beobachten und eigene Operationen reconciliieren.

### 16. Headless / Telemetry / Alerts

Gameplay läuft ohne Dashboard weiter. Telemetrie ist bounded und darf Gameplay nicht blockieren.

Alerts folgen hostseitig persist-before-claim:
1. pending lesen,
2. dauerhaft spoolen,
3. exakte IDs claimen,
4. extern zustellen,
5. Fehlschläge bounded retry/backoff.

Secrets bleiben außerhalb des Gameplay-Bundles.

### 17. Content Safety / Learning

Content Drift und Unknown Content sind fail-closed. Neue oder geänderte Inhalte werden nicht automatisch autorisiert.

Lernende Komponenten dürfen Empfehlung/Scoring verbessern, aber keine deterministischen Safety-Grenzen überschreiben. Evidenz wird dedupliziert, gealtert und bei Drift revalidiert.

### 18. 24/7-Zertifizierung

Unattended-Readiness ist kein einzelner Laufzeitwert. V3 verwendet gestufte Gates mit echter Evidenz:

```
canary -> 1h -> 24h -> 72h -> 7d
```

Später ist 30d sinnvoll.

Nachzuweisen sind unter anderem:
- keine Crashes/Deadlocks;
- keine unresolved Transactions;
- bounded Speicher-/State-Wachstum;
- Recovery-Erfolg;
- keine Sample-Gaps, die Downtime verbergen;
- Hash-/Evidence-Integrität;
- reale Restart→Fresh-Run→Reconcile-Zyklen.

## V3-Anti-Patterns, die nicht migriert werden

- Alpha-Runtime-Vererbung als Integrationsmodell
- Monkey-/Prototype-Patching
- Hotfix auf Hotfix
- mehrere konkurrierende Owner
- fachfremde direkte Runtime-Imports
- direkte Game Writes aus Fachmodulen
- generische globale Priority ohne Klasse/Safe-Point
- persistierter Zustand als Blind-Resume-Autorität
- Dashboard/Host als Gameplay-Entscheider
- unbounded retries
- Liveness-Fixes, die Safety lockern

## V4-Leitsatz

Nicht die Patch-Reihenfolge von V3 übernehmen. Für jede V3-Lösung wird die **finale korrigierte Semantik** identifiziert und im ursprünglichen fachlichen Owner der V4-Zielarchitektur neu gebaut.
