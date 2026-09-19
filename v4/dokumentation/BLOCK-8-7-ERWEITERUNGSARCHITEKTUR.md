# Block 8.7 – Erweiterungsarchitektur / Modul- und Workflow-Grenzen

Status: Architekturvertrag vor breiter Block-9-Spielautorität.

## 1. Ziel

Block 8.7 macht Erweiterbarkeit zu einer **erzwungenen Systemeigenschaft**. Neue Funktionen sollen hinzugefügt, ersetzt, deaktiviert oder versioniert werden können, ohne Kernmodule zu patchen, fremde Zustände direkt zu manipulieren oder neue Game-Write-Pfade zu eröffnen.

Block 8.7 fügt **keine breite neue Adventure-Land-Spielautorität** hinzu. Er definiert die Struktur, auf der Block 9 und spätere Funktionen sicher aufbauen.

## 2. Nicht-Ziele

- keine neue Merchant-Funktion allein um Feature-Coverage zu erhöhen;
- keine Alpha-/Runtime-Vererbung;
- keine Monkey-/Prototype-Patches;
- keine generische Service-Locator-God-Class;
- kein globales Event-Objekt als heimliche Write-Autorität;
- keine direkte Modul-zu-Modul-State-Mutation;
- keine automatische Freigabe unbekannter Capabilities.

## 3. Schichten

```
Fachmodule
  -> Ports / Contracts
  -> Workflow-/Action Requests
  -> Orchestrator / Scheduler
  -> Admission + Resource Locks
  -> ausfuehrung/
  -> Adventure Land
  -> Observation / Verification
  -> Commit / Reconcile
```

Nur `ausfuehrung/` darf konkrete Adventure-Land-Mutationen besitzen.

## 4. Modulvertrag

Jedes registrierbare Modul besitzt einen unveränderlichen Descriptor:

```js
{
  moduleId,
  moduleVersion,
  schemaVersion,
  capabilitiesProvided: [],
  capabilitiesRequired: [],
  portsProvided: [],
  portsRequired: [],
  resourcesUsed: [],
  lifecycle: {
    start,
    stop,
    health,
    reconcile
  },
  defaultEnabled,
  safetyClass
}
```

### Regeln

1. `moduleId` ist global eindeutig.
2. Eine mutierende Capability darf zur Laufzeit genau einen aktiven Provider besitzen.
3. Mehrere read-only Provider sind nur erlaubt, wenn der Capability-Vertrag das explizit zulässt.
4. Required Capabilities werden vor Start validiert.
5. Aktivierungszustand ist sichtbar und versioniert.
6. Module dürfen keine fremden internen Objekte als implizite API benutzen.
7. Modulstart darf keine Gameplay-Mutation auslösen.

## 5. Capability Registry

Die Registry ist die Wahrheit darüber, **wer was darf**.

Ein Capability-Eintrag enthält mindestens:

- `capabilityId`
- `version`
- `mode: READ_ONLY | PLAN | MUTATE`
- `providerModuleId`
- `status: AVAILABLE | DEGRADED | QUARANTINED | DISABLED | UNKNOWN`
- `dependencies`
- `requiredResources`
- `riskClass`
- `healthEvidence`
- `registeredAt`

### Mutierende Capabilities

Beispiele:
- `combat.attack`
- `combat.skill`
- `movement.local`
- `travel.cross_map`
- `merchant.transfer`
- `merchant.sell`
- `merchant.buy`
- `bank.store`
- `bank.retrieve`
- `item.upgrade`
- `item.compound`
- `production.craft`
- `party.transition`

Für jede dieser Capabilities gilt Single-Owner.

## 6. Ports

Ports sind typisierte, fachlich schmale Grenzen.

Beispiele:

### Observation Ports
- `CharacterObservationPort`
- `EntityObservationPort`
- `InventoryObservationPort`
- `BankObservationPort`
- `PartyObservationPort`
- `ContentObservationPort`

### Planning Ports
- `InventoryDispositionPort`
- `GearGoalPort`
- `ProductionDemandPort`
- `TargetSelectionPort`
- `FreshnessPolicyPort`

### Execution Ports
Nur durch `ausfuehrung/` implementiert:
- `CombatExecutionPort`
- `MovementExecutionPort`
- `MerchantExecutionPort`
- `PartyExecutionPort`
- `CommunicationExecutionPort`

### Infrastruktur
- `PersistencePort`
- `TelemetryPort`
- `ClockPort`
- `RandomnessPort`
- `HostSignalPort`

## 7. AktionsAnfrage vs Workflow

### AktionsAnfrage

Eine `AktionsAnfrage` ist atomar und kurzlebig.

Sie beschreibt genau **einen** potentiellen Side Effect:
- Intent
- Owner
- Capability
- Preconditions
- Resource Claims
- Idempotency Key
- Deadline
- Expected Outcome
- Verifier

Sie darf keine lange Geschäftslogik enthalten.

### Workflow

Ein Workflow ist eine mehrphasige, resumierbare Fachoperation.

Beispiele:
- Farmer mit Potions versorgen
- Bank konsolidieren
- Item upgraden
- Production-Ziel herstellen und ausliefern
- Gear an Farmer liefern
- Party regroupen
- Event-gebundene Beschaffung

Mindestvertrag:

```js
{
  workflowId,
  workflowType,
  ownerModuleId,
  schemaVersion,

  priorityClass,
  priority,
  createdAt,
  deadlineAt,

  status,
  phase,

  preconditions: [],
  resources: [],
  safePreemption,

  checkpoint,
  reconcileStrategy,
  idempotencyKey,
  retryPolicy,

  abortReason,
  result
}
```

## 8. Workflow-Zustandsmodell

```
CREATED
-> PLANNED
-> WAITING_PRECONDITION
-> READY
-> RUNNING
-> WAITING_OBSERVATION
-> SAFE_PREEMPTIBLE
-> PAUSED
-> RECONCILE_REQUIRED
-> COMMITTED
| ABORTED
| FAILED_SAFE
| EXPIRED
```

Nicht jeder Workflow muss jeden Zustand verwenden.

### Verboten

- `RUNNING -> RUNNING` nach Restart ohne Reconcile.
- `PAUSED -> RUNNING` ohne erneute Preconditions.
- `WAITING_OBSERVATION -> COMMITTED` ohne Verifier-Evidenz.
- `FAILED_SAFE -> READY` durch automatisches "retry all".

## 9. Prioritätsmodell

PriorityClass dominiert numerische Priorität:

1. `EMERGENCY`
2. `SAFETY`
3. `CRITICAL_SUPPLY`
4. `REQUIRED_SERVICE`
5. `PRODUCTION_OR_USER_ORDER`
6. `NORMAL_WORK`
7. `OPTIMIZATION`
8. `BACKGROUND`

Innerhalb einer Klasse:
- numerische Priorität;
- Deadline-Druck;
- Aging;
- Fairness;
- Resource locality.

Aging darf niemals aus `BACKGROUND` eine Safety-Umgehung machen.

## 10. Preemption

Preemption ist ein Protokoll, kein `cancel()`.

### Voraussetzungen

Ein laufender Workflow kann preempted werden, wenn:
1. höher priorisierte Arbeit bereit ist;
2. aktueller Workflow `safePreemption.allowed=true` meldet;
3. keine unbestätigte irreversible Mutation offen ist;
4. Checkpoint erfolgreich geschrieben wurde, wenn Persistenz erforderlich ist;
5. gehaltene Ressourcen gemäß Contract freigegeben oder explizit transferiert werden.

### Nicht-preemptierbare Phasen

Beispiele:
- zwischen raw `send_item` und Delta-Verifikation;
- zwischen Bank-Write und fachlicher Delta-Verifikation;
- während eines Upgrade-/Compound-Commit-Fensters;
- während einer Party-Transition, solange Ownership ungeklärt ist.

In diesen Phasen wird die höhere Priorität **pending** und der aktuelle Workflow muss zum nächsten Safe Point fortschreiten oder in `RECONCILE_REQUIRED` enden.

## 11. Resource Lock Manager

Locks sind explizite Ressourcen, z. B.:

- `character:<name>:movement`
- `character:<name>:combat`
- `merchant:inventory`
- `merchant:bank`
- `merchant:trade`
- `merchant:stand`
- `party:lifecycle`
- `party:objective`
- `item:<physical-handle>`
- `production:<intent-id>`

### Regeln

- deterministische Lock-Reihenfolge;
- kein stilles Lock-Stealing;
- Lease + Heartbeat für lange Locks;
- Lease-Ablauf erzeugt Reconcile, nicht automatische Neuvergabe bei unklarem Side Effect;
- Deadlock-Erkennung liefert Diagnose, lockert aber keine Safety-Regel.

## 12. Admission

Vor jeder Raw Action:

1. Capability verfügbar?
2. Owner stimmt?
3. Workflow/Action noch aktiv?
4. Deadline nicht abgelaufen?
5. Preconditions frisch?
6. Resource Locks vorhanden?
7. Circuit geschlossen?
8. Retry-/Action-Budget vorhanden?
9. Operator Policy erlaubt?
10. Content Safety erlaubt?
11. Idempotency Key nicht bereits committed?
12. persist-before-action erfüllt, falls erforderlich?

Erst danach darf `ausfuehrung/` senden.

## 13. Outcome / Verifier

Jede mutierende Capability registriert eine Outcome-Semantik:

- `LOCAL_DELTA`
- `REMOTE_DELTA`
- `SERVER_ACK_PLUS_LOCAL_EVIDENCE`
- `POSITION_ARRIVAL`
- `EQUIPMENT_STATE`
- `PARTY_STATE`
- `TARGET_STATE`
- `DOMAIN_SETTLEMENT`

Der Verifier entscheidet fachlich über Commit.

## 14. Reconciliation

Nach Restart oder unsicherem Timeout:

1. Workflow laden.
2. Zustand auf `RECONCILE_REQUIRED`.
3. Live World neu beobachten.
4. Idempotency/Outcome Evidence prüfen.
5. Ergebnis:
   - `COMMITTED`, wenn Side Effect eindeutig beobachtet;
   - `ABORTED`, wenn eindeutig nicht ausgeführt und gefahrlos beendet;
   - neuer Plan, falls ein weiterer Side Effect mit neuer Admission sicher ist;
   - `FAILED_SAFE`, wenn Outcome nicht sicher bestimmbar.

Kein Replay des letzten Befehls allein aufgrund des Checkpoints.

## 15. Health

Jedes Modul meldet:

- `state: HEALTHY | WATCH | DEGRADED | SAFE_MODE | QUARANTINED | DISABLED`
- `reason`
- `since`
- `lastProgressAt`
- `activeWorkflowIds`
- `heldResources`
- `circuits`
- `actionAuthority`
- `schemaVersion`

Health ist Observation. Health darf keine versteckte Fachaktion auslösen.

## 16. Aktivieren / Deaktivieren / Ersetzen

Neue Modulversion:
1. registrieren;
2. Contracts validieren;
3. Shadow/Observation;
4. Capability Truth prüfen;
5. alte mutierende Capability quiescen;
6. offene Workflows reconciliieren;
7. Owner atomar umschalten;
8. neue Version aktivieren;
9. Regression/Replay/Soak.

Keine parallelen mutierenden Provider für dieselbe Capability während Migration.

## 17. Events

Events sind Fakten/Beobachtungen, keine impliziten Befehle.

Ein Event enthält:
- eventId
- type
- sourceModuleId
- observedAt
- subject
- payloadSchemaVersion
- causationId
- correlationId
- confidence/freshness falls nötig

Ein Listener darf aus einem Event einen Plan/Workflow erzeugen, aber nicht fremden State direkt verändern.

## 18. Static Guards

Block 8.7 soll mindestens folgende Guards besitzen:

1. keine direkten Adventure-Land-Writes außerhalb `ausfuehrung/`;
2. keine `prototype`-/Monkey-Patches;
3. keine Runtime-Alpha-Vererbung;
4. keine Fachmodul-Imports fremder Implementierungen statt Contracts/Ports;
5. keine doppelten mutierenden Capability Provider;
6. keine Host→Gameplay-Implementation-Imports;
7. keine Dashboard→Gameplay-Authority;
8. keine Workflow-Klasse ohne schemaVersion/reconcileStrategy;
9. keine unbounded Retry-Policy;
10. keine Persistenz von Secrets.

## 19. Block-8.7-Abnahmekriterien

Block 8.7 ist erst abgeschlossen, wenn:

- Module Registry vorhanden und getestet;
- Capability Registry vorhanden und Single-Owner erzwungen;
- Port-Verträge definiert;
- Workflow Contract + Validator vorhanden;
- PriorityClass + Aging implementiert;
- Safe-Preemption-Protokoll implementiert;
- Resource Locks integriert;
- Reconcile Contract integriert;
- Static Guards aktiv;
- mindestens ein bestehender V4-Pfad vollständig über die neue Architektur läuft;
- Replay beweist deterministisches Verhalten;
- Shadow zeigt null unerwartete Game Writes;
- keine V3-Datei verändert wurde.

## 20. Übergang zu Block 9

Block 9 darf breite Merchant-/Dienstautorität erst auf dieser Architektur erhalten.

Reihenfolge:

```
8.7 Contracts
-> Registry
-> Scheduler
-> Locks
-> Reconciliation
-> Guards
-> Shadow/Replay
-> 8.7 Abschluss
-> Block 9 Merchant Services
```
