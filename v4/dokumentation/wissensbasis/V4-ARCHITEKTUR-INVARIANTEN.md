# V4-Architektur-Invarianten

Status: verbindlicher Entwurf für Block 8.7 und folgende Blöcke.

Diese Invarianten sind aus dem vollständigen V3-Audit und den abgesicherten V3-Regressionen abgeleitet. Sie sind keine Stilpräferenzen, sondern Grenzen, die V4 strukturell erzwingen soll.

| ID | Invariante | Mindest-Enforcement |
|---|---|---|
| V4-INV-001 | Eine mutierende Capability hat genau einen aktiven Owner. | Registry + Start-Guard + Test |
| V4-INV-002 | Direkte Adventure-Land-Schreibaufrufe existieren nur in `ausfuehrung/`. | Static Guard |
| V4-INV-003 | Fachmodule kennen Game Writes nur über typisierte Ports/Anfragen. | Dependency Guard |
| V4-INV-004 | Kein Monkey-/Prototype-Patching als Erweiterungsmechanismus. | Static Guard |
| V4-INV-005 | Runtime Composition erbt nicht von historischen Feature-/Alpha-Runtimes. | Composition Guard |
| V4-INV-006 | Jede Mutation besitzt einen expliziten Outcome-Verifier. | Contract + Runtime Guard |
| V4-INV-007 | API-Return/Promise allein darf keinen fachlichen COMMIT erzeugen. | Verifier Contract + Tests |
| V4-INV-008 | Nicht-terminale persistierte Arbeit wird nach Restart niemals blind fortgesetzt. | Persistence Loader |
| V4-INV-009 | Restart setzt langlebige Arbeit auf `RECONCILE_REQUIRED`. | Workflow Runtime |
| V4-INV-010 | Irreversible/mehrittige Arbeit persistiert vor der ersten Raw Action. | Transaction Guard |
| V4-INV-011 | Jeder Workflow besitzt Idempotency Key und stabile Workflow-ID. | Workflow Schema |
| V4-INV-012 | Retries sind bounded: Versuche, Zeit, Backoff und Circuit sind Pflicht. | Retry Policy |
| V4-INV-013 | Circuits sind fachlich/scoped und dürfen unabhängige Capabilities nicht global sperren. | Circuit Registry |
| V4-INV-014 | Jede Ressource besitzt genau einen Lock-Owner zur Zeit. | Resource Lock Manager |
| V4-INV-015 | Preemption ist nur an deklarierten SafePreemptionPoints zulässig. | Scheduler |
| V4-INV-016 | Eine Transaktion wird nicht mitten in einem unteilbaren Commit abgebrochen. | Scheduler + Transaction Phase |
| V4-INV-017 | Stop/Shutdown sperrt zuerst neue Arbeit und reconciliert laufende Arbeit bounded. | Run Control |
| V4-INV-018 | Priorität besteht aus PriorityClass + numerischem Rang; nicht nur aus einer globalen Zahl. | Scheduler Contract |
| V4-INV-019 | Aging/Fairness verhindert Starvation bei dauerhaft niedrigerer Priorität. | Scheduler |
| V4-INV-020 | Safety/Notfall darf normale Arbeit preempten; normale Arbeit darf Safety nie preempten. | Priority Rules |
| V4-INV-021 | Unknown/Quarantined/Changed Content ist fail-closed. | Content Safety |
| V4-INV-022 | Learning darf harte Safety- oder Authority-Grenzen nicht selbst lockern. | Learning Port |
| V4-INV-023 | Persistiertes Wissen ist PlanningEvidence, keine ExecutionAuthority. | Evidence Types |
| V4-INV-024 | Live-Ausführung revalidiert physische/zeitkritische Preconditions unmittelbar vor Admission. | Admission Token |
| V4-INV-025 | Jede zeitabhängige Evidenz trägt Freshness/ObservedAt/Source. | Evidence Schema |
| V4-INV-026 | Party-/Character-Ziele sind an aktuelle Identität/Roster-Epoch gebunden. | Group Truth |
| V4-INV-027 | Physische Item-Reservierung referenziert eine konkrete Item-Identität, nicht nur Name/Level. | Inventory Ledger |
| V4-INV-028 | Sell/Bank/Upgrade/Compound/Delivery lesen dieselbe zentrale Item-Disposition. | Ledger Port |
| V4-INV-029 | Kein destruktiver Item-Workflow ohne Workspace-/Capacity-Preflight. | Resource Preconditions |
| V4-INV-030 | Production endet erst nach verifiziertem Recipient Settlement. | Production Workflow |
| V4-INV-031 | Bereits verarbeitete irreversible Evidence wird nach Restart dedupliziert. | Persistent Cursor |
| V4-INV-032 | Runtime besitzt Gameplay-Autorität; Host besitzt nur Prozess-/Browser-Lifecycle und Transport. | Capability Boundary |
| V4-INV-033 | Host-/Dashboard-Code besitzt keine Gameplay-Policy. | Dependency + API Guard |
| V4-INV-034 | Host-Restart ist kein Gameplay-Recovery-Nachweis. | Host State Machine |
| V4-INV-035 | Nach Restart ist Fresh-Run + Live-Reobservation Pflicht. | Recovery Contract |
| V4-INV-036 | Host-Bridge besitzt kein generisches Remote-`evaluate`/`invoke`. | Allowlist Guard |
| V4-INV-037 | Secrets gelangen nicht in Gameplay-Bundle, Telemetrie oder Alert-Payload. | Build/Schema Guard |
| V4-INV-038 | Alert-Transport blockiert Gameplay niemals. | Async Host Boundary |
| V4-INV-039 | Kritische Alerts werden hostseitig persistiert, bevor sie im Bot geclaimt werden. | Persist-before-claim |
| V4-INV-040 | Queues, Histories und Recorder sind capacity-bounded. | Bounded Collection Contract |
| V4-INV-041 | Telemetrie/Observation besitzt standardmäßig `actionAuthority:false`. | Capability Contract |
| V4-INV-042 | Health/Supervisor darf Recovery-Autorität nur reduzieren oder explizit begrenzt aktivieren; nie Safety umgehen. | Recovery Policy |
| V4-INV-043 | Ein fehlender Status-/Health-Port wird in sicherheitskritischer Reconciliation nicht als CLEAN interpretiert. | Fail-closed Reconcile |
| V4-INV-044 | Cross-Modul-Abhängigkeiten erfolgen nur über Verträge/Ports, nicht über fremde Runtime-Objekte. | Dependency Guard |
| V4-INV-045 | Persistenz ist schema-versioniert und migrationsfähig. | Persistence Schema |
| V4-INV-046 | Corrupt/oversized/unreadable sicherheitskritischer Persistenzzustand fail-closed. | Persistence Guard |
| V4-INV-047 | Jede langlebige Operation meldet Phase, Owner, Ressourcen, Deadline, Checkpoint und Abbruchgrund. | Workflow Schema |
| V4-INV-048 | Kein Plan darf durch kleinen Score-Noise ständig wechseln. | Hysteresis/Replan Policy |
| V4-INV-049 | Movement/Travel-Return ist kein Arrival-Beweis. | Travel Verifier |
| V4-INV-050 | Moving-Target-Work benötigt motion-aware Freshness. | Freshness Policy |
| V4-INV-051 | Raw Game Target ist nicht automatisch fachliche Target-Ownership. | Combat Ownership |
| V4-INV-052 | Operator Deny überschreibt autonome Fallbacks. | Policy Resolution |
| V4-INV-053 | Default-Off/ACK-Gates dürfen nicht durch indirekte Module umgangen werden. | Capability Admission |
| V4-INV-054 | Jede automatische Autorität ist im Status sichtbar und erklärbar. | Health/Telemetry Contract |
| V4-INV-055 | Certification Evidence ist unveränderlich/verifizierbar und darf Downtime nicht durch Sample-Gaps verstecken. | Certification Chain |

## Prioritätsklassen

Von hoch nach niedrig:

1. `EMERGENCY`
2. `SAFETY`
3. `CRITICAL_SUPPLY`
4. `REQUIRED_SERVICE`
5. `PRODUCTION_OR_USER_ORDER`
6. `NORMAL_WORK`
7. `OPTIMIZATION`
8. `BACKGROUND`

Numerische Priorität ist nur der Tie-Break innerhalb einer Klasse. Aging darf Arbeit innerhalb definierter Grenzen anheben, aber keine Safety-Grenze überschreiten.

## Workflow-Mindestvertrag

Jeder langlebige Workflow besitzt mindestens:

- `workflowId`
- `workflowType`
- `ownerModuleId`
- `priorityClass`
- `priority`
- `status`
- `createdAt`
- `deadlineAt`
- `preconditions`
- `resources`
- `phase`
- `safePreemption`
- `checkpoint`
- `reconcileStrategy`
- `idempotencyKey`
- `retryPolicy`
- `abortReason`
- `result`
- `schemaVersion`

## Enforcement-Reihenfolge

1. Compile/static dependency guards
2. Module-/Capability-Registry-Validation
3. Admission/Resource Locks
4. Runtime Preconditions/Freshness
5. Execution Boundary
6. Outcome Verification
7. Persisted Commit/Reconcile
8. Telemetry/Certification

Eine spätere Schicht darf eine frühere Safety-Entscheidung nicht stillschweigend überschreiben.
