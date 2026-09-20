# CAP-035/036/037 – V5 Production Autonomie

**Status:** IMPLEMENTIERT / NO-WRITE  
**Stand:** 2026-09-20  
**Basis-main:** `7dc6a6db9494f432bf417e0f15c8ecdf6c319f3b`

## Ziel

Die R15-Foundations fuer Production werden zu V5-nativen Capabilities verbunden, ohne V3/V4-Runtimecode, alte Preisformeln oder neue Gameplay-Authority zu uebernehmen.

## CAP-035 Production Planner

Implementierung:

- `v5/grundlage/quelle/produktion/production-planer.ts`

Eigenschaften:

- explizite Source-Evidence statt versteckter Preis-/Gear-Heuristik;
- vom Aufrufer festgelegte Source-Prioritaet;
- lokaler Bestand, Bank, Buy, Farm, Quest, Event und Transformationen;
- Transformationen: Craft, Exchange, Upgrade, Compound;
- bounded Rekursion und Schrittgrenze;
- Recipe-Cycle fail-closed;
- stale Evidence fail-closed;
- Event-/Quest-Gates bleiben an frische Evidence gebunden;
- Bankzugriffe verwenden nur einen frischen `BankKatalogPin`;
- Action-/Recovery-/Verifier-IDs werden nur als Planning-Bindung ausgegeben;
- keine Execution-, Gameplay- oder Raw-Write-Authority.

Es werden bewusst keine V3-Preisformeln und keine historischen Gear-Score-Entscheidungen kopiert.

## CAP-036 Production Controller / Persistent Intent

Implementierung:

- `v5/grundlage/quelle/produktion/production-controller.ts`
- bestehendes `production-intent.ts`
- bestehendes `recipient-settlement.ts`

Eigenschaften:

- uebernimmt nur einen `BEREIT`-Plan;
- persistiert den `ProduktionsLedger` ueber `SpeicherPort`;
- jede Zustandsaenderung wird kritisch persistiert;
- Restart importiert nichtterminale Eintraege als `RECOVERY_PENDING`;
- `sameIntentErneutSenden=false` bleibt unveraendert;
- Craft-/Output-Erfolg allein ist kein Production-Commit;
- finaler Commit erst nach positiv verifiziertem Recipient Settlement;
- korrupte oder aus der Zukunft stammende Persistenz wird fail-closed abgelehnt;
- keine Gameplay- oder Raw-Write-Authority.

## CAP-037 Persistent Bank Catalog

Implementierung:

- `v5/grundlage/quelle/produktion/bank-katalog.ts`

Eigenschaften:

- Snapshot wird ueber `SpeicherPort` persistent gespeichert;
- Snapshot bleibt ausschließlich `planningEvidence`;
- `executionAuthority=false`;
- TTL, Mount-Epoche und Lease-Epoche bleiben Teil des Pins;
- Bankmutation kann den Katalog explizit invalidieren;
- Invalidierung bleibt ueber Restart erhalten;
- stale oder invalidierter Katalog kann keinen neuen Pin liefern;
- neue Live-Beobachtung ersetzt die Invalidierung.

## Tests

- `v5/grundlage/tests/r15-production-capabilities.test.mjs`

Abgedeckt werden insbesondere:

- Bank -> Craft -> Delivery als deterministischer DAG;
- explizite Source-Prioritaet statt Legacy-Kostenheuristik;
- Recipe-Cycle;
- stale Source-Evidence;
- persistenter Bankkatalog und Invalidierung;
- stale persistierter Bankkatalog;
- persistenter Production-Intent;
- Restart -> `RECOVERY_PENDING`;
- kein Commit ohne Recipient Settlement;
- blockierter/deferred Plan wird vom Controller nicht uebernommen.

## Safety-Grenze

Diese Capabilities planen, persistieren und reconciliieren. Sie rufen keine Adventure-Land-Public-Function direkt auf.

Alle spaeteren wertveraendernden oder sonstigen Gameplay-Aktionen bleiben an die bestehenden V5-Grenzen gebunden:

- Action Contract;
- Owner-/Capability-Authority;
- Operator-Deny / Kill Switch;
- Admission unmittelbar vor Mutation;
- Resource-/Socket-/Workspace-Gates;
- Durable Intent;
- Outcome-Verifier;
- Recovery Contract;
- UNKNOWN/Reconciliation statt Blind-Retry.

## Historische R15-Manifeste

`roadmap/r15-abschluss.json` und `grundlage/vertraege/r15/merchant-core-b-abdeckung.json` bleiben unveraendert historische R15-Abschlussnachweise. Deren Eintrag `V5_NATIVE_FOUNDATION` beschreibt den damaligen Phasenstand und wird durch diese Post-Release-Implementierung nicht rueckwirkend umgeschrieben.
