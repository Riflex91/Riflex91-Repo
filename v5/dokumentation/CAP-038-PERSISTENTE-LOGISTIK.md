# CAP-038 – Persistente Collection / Delivery / Rendezvous

**Status:** IMPLEMENTIERT / NO-WRITE  
**Stand:** 2026-09-20  
**Basis-main:** `4fee7a2e593b9cf553d46914a728b29fc98ca05c`

## Ziel

CAP-038 verbindet die vorhandene V5-Logistik-Foundation mit einer expliziten Source-Pinning- und Persistenzschicht. Die historischen Risiken `stale target` und `source mismatch` werden fail-closed behandelt, ohne V3/V4-Runtimecode oder neue Gameplay-Authority zu übernehmen.

## Scope

Diese Implementierung deckt die im V5-R15-Modell vorhandene physische Item-Logistik ab:

- `SUPPLY_DELIVERY`;
- `COLLECTION`;
- `GEAR_DELIVERY`;
- Rendezvous;
- physische Item-Transfers;
- Recipient-Settlement;
- Restart/Reconciliation.

Nicht Teil dieser Capability sind:

- direkte Bewegungssteuerung;
- Gold-Transfers;
- ein generisches Party-Transportprotokoll;
- direkte Adventure-Land-Public-Function-Aufrufe.

Diese bleiben in ihren bestehenden V5-Schichten und Action Contracts.

## Source-Pinning

Implementierung:

- `v5/grundlage/quelle/merchant/logistik-planer.ts`

Eine Planung verlangt:

- exakte Source-`CharacterZielBindung`;
- exakte Recipient-`CharacterZielBindung`;
- gleiche Account-/Server-Wahrheit;
- verschiedene Source-/Recipient-Character;
- frische Source-Evidence;
- frische Target-/Rendezvous-Evidence;
- physische Item-Kennung;
- Itemname;
- Itemlevel;
- Mindestmenge;
- Item-Fingerprint;
- Source-Inventory-Fingerprint;
- explizite Evidence-TTL.

Der resultierende `LogistikQuellenPin` ist ausschließlich Planning Evidence:

- `planningEvidence=true`;
- `executionAuthority=false`.

Unmittelbar vor einem Transfer-Intent wird die Source erneut gegen den Pin geprüft. Inventory-Fingerprint, Source-Bindung und jede physische Item-Identität müssen noch passen.

## Persistenter Logistik-Controller

Implementierung:

- `v5/grundlage/quelle/merchant/logistik-controller.ts`
- bestehender `MerchantLogistikLedger` in `logistik-workflow.ts`

Der Controller:

- persistiert jeden Zustandsübergang über `SpeicherPort`;
- akzeptiert nur V5-native no-authority Planungsergebnisse;
- bindet Transfers ausschließlich an:
  - `AL-ACTION-SEND-ITEM`;
  - `AL-RECOVERY-SEND-ITEM`;
  - `AL-VERIFIER-SEND-ITEM`;
- prüft die Source direkt vor dem durable Transfer-Intent erneut;
- persistiert `TRANSFER_AUSSTEHEND` vor Rückgabe der Transfer-Vorbereitung;
- besitzt selbst keine Execution-, Gameplay- oder Raw-Write-Authority.

Ein tatsächlicher `send_item`-Aufruf bleibt Aufgabe der bestehenden Admission-/Execution-Schicht.

## Restart / Recovery

Der Ledger speichert jetzt zusätzlich den Vor-Restart-Zustand.

Dadurch wird `RECOVERY_PENDING` nicht mehr semantisch mehrdeutig:

- Restart aus `GEPLANT`: der sichere Pre-Send-Pfad darf erneut aufgebaut werden;
- Restart aus `RENDEZVOUS_AUSSTEHEND` oder `RENDEZVOUS_BESTAETIGT`: nur frische Pre-Send-Evidence darf den Ablauf fortsetzen;
- Restart aus `TRANSFER_AUSSTEHEND`: kein Weg zurück in einen neuen Transfer-Send;
- nach möglichem Transfer sind nur Recipient-Settlement/Reconciliation oder `FAILED_SAFE` zulässig;
- `sameTransferErneutSenden=false` bleibt hart.

Damit ist ein Blind-Retry nach möglichem Send strukturell blockiert.

## Settlement

Ein Transfer gilt nicht durch Request/Promise als erledigt.

`SETTLED` verlangt weiterhin:

- identische Recipient-Session/Server/Roster-Epoche;
- identischen gepinnten Baseline-Inventory-Fingerprint;
- einen neuen Recipient-Inventory-Fingerprint;
- beobachtete Mengensteigerung für alle geplanten Posten.

## Tests

Neu:

- `v5/grundlage/tests/r15-logistik-capability.test.mjs`

Abgedeckt werden:

- source-gepinnte Planung und SEND_ITEM-Vertragsbindung;
- stale Source-Evidence;
- physischer Source-Mismatch;
- Source-Drift direkt vor Transfer;
- durable Transfer-Intent;
- Restart nach möglichem Transfer -> kein Blind-Retry;
- Restart vor Transfer -> nur sicherer Pre-Send-Pfad;
- Recipient-Settlement aus Recovery;
- persistenter `FAILED_SAFE`-Zustand.

Die bestehenden R15-Logistiktests bleiben zusätzlich maßgeblich.

## Safety-Grenze

CAP-038 besitzt keine direkte Adventure-Land-Gameplay-Mutation.

Weiterhin zwingend:

- Capability-/Owner-Authority;
- Operator-Deny / Kill Switch;
- Action Contract;
- Admission unmittelbar vor Mutation;
- Freshness;
- Resource-/Socket-Gates;
- Durable Intent;
- Outcome-Verifier;
- Recovery Contract;
- UNKNOWN/Reconciliation statt Blind-Retry.

## Historische R15-Manifeste

`roadmap/r15-abschluss.json` und `grundlage/vertraege/r15/merchant-core-b-abdeckung.json` bleiben unveränderte historische R15-Abschlussnachweise. Der dortige Status `V5_NATIVE_FOUNDATION` beschreibt den damaligen Phasenstand und wird durch diese Post-Release-Implementierung nicht rückwirkend umgeschrieben.
