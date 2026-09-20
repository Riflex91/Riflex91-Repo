# ADR-012 – R11 Testlabor, Replay, Observability und Operations

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R11 erweitert das in R3/R4 begonnene Testlabor zu einem belastbaren Operations- und Zertifizierungsfundament. Safety-kritische Pfade muessen reproduzierbar, negativ testbar, fault-injected und soweit sinnvoll mutationsgetestet sein. Observability darf dabei keine neue Gameplay-Autoritaet erhalten und ein Ausfall von Dashboard oder Alert-Transport darf den Gameplay-Hot-Path nicht blockieren.

Das Gameplay-Runtime-Gesamtgate bleibt weiterhin `GESPERRT`. R11 liefert deshalb ausschliesslich no-write Test-, Replay-, Health-, Alert-, Telemetrie- und Statusvertraege.

## Entscheidung

1. Fehlende oder stale sicherheitskritische Health-Evidence wird als `UNBEKANNT`, niemals als gesund interpretiert.
2. Der Headless Supervisor besitzt explizit `actionAuthority:false` und kann keine Gameplay-Autoritaet erzeugen.
3. Kritische Alerts werden durable persistiert, bevor ein Claim erlaubt ist.
4. Der Alert-Spool besitzt eine harte Kapazitaetsgrenze; voller oder fehlerhafter Spool fail-closed.
5. Dashboard-Publishing ist best-effort observer-only; Fehler werden gezaehlt und nicht in Core-/Gameplay-Entscheidungen propagiert.
6. Operations-Telemetrie ist hart begrenzt und exponiert mindestens SSD-I/O-Latenz, Queue-Tiefe, Backpressure, freie Bytes und Recorder-Drops.
7. Automatische Authority ist im Status mit Owner, Evidence, Ressourcen, Policy, Grund, Erwartungswirkung und Gueltigkeit sichtbar.
8. Retention, Rotation und Kompressionsbedarf werden deterministisch und bounded geplant.
9. Golden Replay vergleicht kanonische Replay-Ausgaben byte-identisch.
10. Bounded Observation-Evidence kann deterministisch in Replay-Material ueberfuehrt werden; verworfene Samples bleiben als Drop-Zaehler sichtbar.
11. Scheduler, Ressourcen/Fencing und Zustandsautomaten besitzen zusaetzliche deterministische Property-/Model-Tests.
12. Crash, Disconnect, Timeout, Partial Completion, Persistenz-I/O, Dashboard-Ausfall und Alert-Spool-Fehler sind in einer Fault-Matrix mit konkreten Tests nachgewiesen.
13. Safety-kritische Source-Guards werden gegen bewusst invertierte Mutanten getestet: Runtime-Gate, Same-Intent-Recovery, Restart-Authority, Health-Fail-Closed und Alert-Persist-before-Claim.
14. Ein maschinenlesbarer Core-Testkatalog erzwingt fuer safety-kritische Kernpfade mindestens einen positiven und einen negativen/fault/property Nachweis.
15. R11 erhaelt keinen Raw-Write-, Gameplay- oder Recovery-Send-Pfad.

## Alternativen

- **Fehlende Health als CLEAN behandeln:** verworfen; Safety-Pfade bleiben fail-closed.
- **Dashboard synchron im Hot Path aufrufen:** verworfen; Observability ist observer-only.
- **Alert claimen und spaeter persistieren:** verworfen; ein Crash dazwischen koennte den kritischen Alert verlieren.
- **Unbounded Telemetrie-/Recorder-Historien:** verworfen; Drops und Backpressure muessen sichtbar sein.
- **Nur Happy-Path-Tests:** verworfen; R11 erzwingt Negativ-, Property-, Fault- und Mutation-Nachweise.
- **Replay nur semantisch statt byte-identisch vergleichen:** verworfen; Golden Replay bleibt kanonisch reproduzierbar.
- **Authority nur als Boolean anzeigen:** verworfen; Owner, Evidence, Ressourcen, Policy und erwartete Wirkung sind Pflicht.

## Konsequenzen

- Fehlende Health-Daten reduzieren Readiness/Authority statt sie still zu erhoehen.
- Dashboard-Ausfall beeinflusst die Core-Entscheidung nicht.
- Kritische Alerts koennen nicht vor durable Persistenz geclaimt werden.
- Operationsdaten sind bounded und zeigen Speicher-/I/O-Druck transparent.
- Safety-Guard-Inversionen besitzen einen automatisierten Mutation-Nachweis.
- Replay aus Live-Evidence bleibt deterministisch und weist Sample-Gaps aus.
- R12 kann den ersten Vertical Slice auf einem reproduzierbaren, beobachtbaren und fault-getesteten Kernel aufbauen.
- R11 selbst besitzt weiterhin keine Gameplay- oder Raw-Write-Autoritaet.

## Invarianten

Betroffen sind insbesondere:

- V5-ALT-038 – Alert-Transport blockiert Gameplay niemals;
- V5-ALT-039 – kritische Alerts persist-before-claim;
- V5-ALT-040 – Queues, Histories und Recorder sind bounded;
- V5-ALT-043 – fehlende Health-Evidence ist nicht CLEAN;
- V5-ALT-054 – automatische Authority ist sichtbar und erklaerbar;
- V5-ALT-055 – Certification Evidence weist Sample-Gaps und I/O-/Retention-Gesundheit aus;
- V5-INV-007 – Zeit/Zufall/IDs/Sequenzen bleiben replay-faehig;
- V5-INV-026 – Safety-Code besitzt Negativ-, Fault-, Property- und soweit sinnvoll Mutation-Tests.

## Migration

R11 erweitert ausschliesslich die no-write Foundation unter `v5/grundlage/**` sowie CI-/Werkzeug-Nachweise. Bestehende V4/V3-Operationsbausteine werden nicht importiert und erhalten keine neue Autoritaet.

Spaetere Runtime-/Vertical-Slice-Pfade muessen die R11-Health-/Authority-/Alert-/Telemetry-Vertraege konsumieren, ohne Dashboard oder Telemetrie in einen Write-Authority-Pfad umzuwandeln.

## Rollback

Ein Rollback auf R10 entfernt R11-Observability/Testlabor-Vertraege ohne Gameplay-Zustandsmigration. Kritische Safety-Grenzen aus R3-R10 bleiben bestehen. Ein Rollback darf fehlende Health-Evidence nicht als gesund interpretieren und Alert persist-before-claim nicht lockern.

## Nachweise

- `v5/grundlage/quelle/operations/health.ts`
- `v5/grundlage/quelle/operations/alerts.ts`
- `v5/grundlage/quelle/operations/authority-status.ts`
- `v5/grundlage/quelle/operations/telemetrie.ts`
- `v5/grundlage/quelle/operations/headless-supervisor.ts`
- `v5/grundlage/quelle/operations/segment-pflege.ts`
- `v5/grundlage/quelle/testlabor/golden-replay.ts`
- `v5/grundlage/quelle/testlabor/evidence-replay.ts`
- `v5/grundlage/tests/r11-operations.test.mjs`
- `v5/grundlage/tests/r11-replay.test.mjs`
- `v5/grundlage/tests/r11-property-model.test.mjs`
- `v5/grundlage/tests/r11-fault-labor.test.mjs`
- `v5/grundlage/tests/r11-mutation.test.mjs`
- `v5/grundlage/vertraege/r11/core-testabdeckung.json`
- `v5/grundlage/vertraege/r11/fault-matrix.json`
- `v5/werkzeuge/r11-testabdeckung.mjs`
- `v5/werkzeuge/r11-statische-guards.mjs`
- `v5/werkzeuge/r11-struktur-pruefen.mjs`
- `.github/workflows/v5-r11.yml`
