# CAP-045 – Production Graph Certification

**Status:** IMPLEMENTIERT / LIVE-EVIDENCE SEPARAT ERFORDERLICH  
**Stand:** 2026-09-20  
**Basis-main:** `25f513b725bd80fb9261d97f891519559d0eef03`

## Ziel

CAP-045 implementiert die V5-nativen Vertraege `CoverageAudit` und `SoakEvidence` fuer den Production Graph.

Das historische Hauptrisiko wird explizit verhindert:

> synthetische Evidence darf niemals als echter Live-Beweis gewertet werden.

Die Capability bleibt rein diagnostisch und besitzt keine Gameplay- oder Raw-Write-Authority.

## Implementierung

- `v5/grundlage/quelle/zertifizierung/production-certification.ts`
- `v5/grundlage/tests/r19-production-certification.test.mjs`

Sie baut auf den vorhandenen V5-Modellen auf:

- `production-graph.ts`;
- `production-intent.ts`;
- generische R19-Evidence-Fingerprints;
- bestehende R19-Zertifizierungs-Ladder.

Es wird kein V3-Runtimecode kopiert.

## CoverageAudit

Ein Audit bekommt einen explizit gepinnten Zielkatalog:

- `auditId`;
- `katalogFingerprint`;
- erwartete Zielanzahl;
- genau einen Fall pro Ziel.

Ein Fall besitzt entweder:

1. einen konkreten V5-`ProduktionsGraph`; oder
2. einen dokumentierten Planfehler.

Beides gleichzeitig oder keines von beiden ist ungueltig.

### Klassifikationen

- `FULLY_RESOLVED`
- `DEFERRED_EVENT_INAKTIV`
- `BLOCKIERT_QUEST_NICHT_ERFUELLT`
- `STRUCTURAL_GAP`

Bekannt inaktive Events duerfen als temporär deferred gelten.

Ein Quest-Block oder struktureller Gap laesst den CoverageAudit nicht bestehen.

Graphen werden mit derselben V5-Funktion `pruefeProduktionsGraph()` bewertet wie die eigentliche Production-Planung. Es existiert keine zweite Graphdefinition.

## Evidence-Klassen

Jeder Coverage-Fall und jeder Soak besitzt explizit eine Klasse:

- `SYNTHETISCH`
- `LIVE`

Die Auswertung zaehlt beide Klassen separat.

Die Klasse ist Teil der hashverketteten Soak-Evidence und darf innerhalb einer Serie nicht wechseln.

## Production Soak

Ein `ProduktionsSoakSample` dokumentiert unter anderem:

- Sequenz und Zeit;
- Evidence-Klasse;
- Production-ID;
- Plan-Fingerprint;
- Production-Zustand;
- `sameIntentErneutSenden=false`;
- Recipient-Settlement-Status;
- offene Production-Aufgaben;
- offene Materialziele;
- offene Mutation-Demand;
- offene Exchange-Demand;
- Gate-Verletzungen;
- geschuetzte Transfers ohne Autorisierung;
- Gameplay-Writes durch den Zertifizierer;
- neu beobachtete irreversible Operationen;
- Postcondition-Verifikation jeder irreversiblen Operation.

Jedes Sample ist mit dem vorherigen Sample fingerprint-verkettet.

## Production-Invarianten

Ein Soak blockiert bei:

- Sequenz-/Zeit-Gaps;
- manipulierter Fingerprint-Kette;
- doppeltem irreversiblem Operation-Key;
- irreversibler Operation ohne verifizierte Postcondition;
- irreversibler Beobachtung waehrend `RECOVERY_PENDING`;
- `sameIntentErneutSenden != false`;
- Gate-Verletzung;
- geschuetztem Transfer ohne Autorisierung;
- Gameplay-Write durch den Zertifizierer;
- `COMMITTED` ohne verifiziertes Recipient Settlement;
- `COMMITTED` mit verbliebener Production-Arbeit/Demand.

Damit wird insbesondere verhindert, dass ein Merchant-seitiger Craft-Erfolg faelschlich als end-to-end Production-Abschluss gilt.

## Bounded Soak

Die Grenzen werden explizit uebergeben:

- maximale Samplezahl;
- maximaler Sampleabstand;
- minimale synthetische Samplezahl;
- minimale Live-Samplezahl;
- minimale Live-Dauer.

Die Implementierung akzeptiert maximal 5000 Samples pro Serie und maximal 32 irreversible Operationen pro Sample.

## Synthetic vs Live

Ein bestandener synthetischer Soak setzt ausschließlich:

`syntheticRegressionBestanden=true`

und immer:

`liveBeweisBestanden=false`

Ein echter Live-Beweis ist nur moeglich, wenn:

- die gesamte Serie `evidenceKlasse=LIVE` besitzt;
- alle Production-Invarianten bestehen;
- die Mindestanzahl echter Live-Samples erreicht ist;
- die konfigurierte Mindest-Live-Dauer erreicht ist.

Gemischte Synthetic-/Live-Serien werden abgelehnt.

## Combined Production Certification Gate

Das kombinierte Gate verlangt:

1. CoverageAudit bestanden;
2. synthetische Regression bestanden;
3. separaten echten Live-Soak bestanden.

Ohne echten Live-Soak bleibt der Blocker:

`LIVE_SOAK_FEHLT_ODER_NICHT_BESTANDEN`

Selbst bei komplett bestandenem Production-Gate gilt weiterhin:

- `diagnosticOnly=true`;
- `actionAuthority=false`;
- `rawWriteAuthority=false`;
- `breiteRuntimeFreigabe=false`.

CAP-045 darf die globale R19-/Betreiberfreigabe daher nicht ersetzen oder umgehen.

## Tests

Abgedeckt werden:

- vollständig aufgeloester Production Graph;
- bekannt inaktives Event als Deferred Coverage;
- Planfehler als `STRUCTURAL_GAP`;
- invalides Production-Graph-Workspace als `STRUCTURAL_GAP`;
- synthetischer Soak;
- echter Live-Soak mit expliziter Mindestdauer;
- gemischte Synthetic-/Live-Evidence;
- Duplicate irreversible Effects;
- unverified Postcondition;
- irreversible Action waehrend Recovery;
- Commit ohne Recipient Settlement;
- Restarbeit nach Commit;
- manipulierte Fingerprint-Kette;
- synthetischer Regressionserfolg ohne Live-Gate-Freigabe;
- vollstaendiger Coverage + Synthetic + Live Fall bleibt trotzdem diagnostic-only.

## R19-Integration

Die neue Capability ist in:

- `r19-statische-guards.mjs`;
- `r19-struktur-pruefen.mjs`

als Pflichtartefakt eingebunden.

Der R19-Raw-Gameplay-Write-Scan umfasst damit auch den Production-Zertifizierer.

## Nicht uebernommen

Aus V3 werden insbesondere nicht uebernommen:

- Runtime-Einstiegspunkte;
- globale Runtime-Monkey-Patches;
- alte Production-Heuristiken;
- P90-Farm-Scheduling als implizite neue V5-Policy;
- eine zweite Definition von Production Graph oder Recipient Settlement.

CAP-045 zertifiziert die aktuelle V5-Production-Architektur, statt historische V3-Entscheidungslogik wieder einzufuehren.

## Live-Abnahme

Dieser Implementierungsschritt liefert die V5-native Zertifizierungslogik und Regressionstests.

Er ist **kein behaupteter echter Production-Live-Soak**.

Ein spaeterer echter Live-Nachweis muss als `LIVE`-Evidence erzeugt werden und die expliziten V5-Testzeit-/Soak-Grenzen erfuellen, bevor `liveBeweisBestanden=true` gesetzt werden kann.
