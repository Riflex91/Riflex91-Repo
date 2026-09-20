# CAP-045 – Production Live Testpaket

**Status:** IMPLEMENTIERT / LIVE-ABNAHME AUSSTEHEND  
**Basis-main:** `860b9f719370c853d5799d2bfb99c0d185c3a42a`  
**Testkennung:** `cap045-production-live-certification`  
**Controller-Version:** `1.0.0`

## Ziel

Dieses Paket erzeugt echte, klar als `LIVE` markierte Evidence fuer die CAP-045 Production Graph Certification. Es ersetzt weder den V5-Production-Planner noch den Production-Controller und oeffnet keine breite Runtime-Authority.

Artefakte:

- `werkzeuge/cap045-production-live-test-gui.js`
- `werkzeuge/cap045-production-live-test-paket-bauen.mjs`
- `werkzeuge/cap045-production-live-test-paket.js`
- `werkzeuge/cap045-production-live-static-guards.mjs`
- `werkzeuge/tests/cap045-production-live-test-gui.test.mjs`

## Stage 1 – Passive Live Discovery

Stage 1 ist read-only. Sie beobachtet den aktuellen Adventure-Land-Zustand und bildet reale, sichere, niedrigwertige Upgrade-Production-Ziele aus dem Live-Inventar ab.

Die Evidence wird ausschließlich als `LIVE` markiert. Ist kein geeigneter realer Kandidat vorhanden, bleibt die Stage blockiert; es wird kein synthetischer Ersatz als Live-Evidence erzeugt.

Die Coverage-Klassifikationen bleiben identisch zum CAP-045-Core:

- `FULLY_RESOLVED`
- `DEFERRED_EVENT_INAKTIV`
- `BLOCKIERT_QUEST_NICHT_ERFUELLT`
- `STRUCTURAL_GAP`

Der aktuelle Live-Harness verwendet als begrenzten Discovery-Scope sichere, nicht geschuetzte Level-0-Upgrade-Ziele. Nicht beobachtete Quest-/Event-Faelle werden nicht erfunden.

## Stage 2 – Live Shadow / Soak

Stage 2 sammelt fünf Minuten lang im 15-Sekunden-Intervall echte Production-Samples. Der Zertifizierer fuehrt dabei keine Gameplay-Writes aus.

Startbestaetigung:

`CAP045-STAGE2-LIVE-SOAK-START`

Die Stage erfasst unter anderem Production-ID, Plan-Fingerprint, Zustand, Demand, Gate-Verletzungen, Recipient-Settlement-Status, irreversible Operationen und die verketteten Sample-Fingerprints.

Stage 2 kann den read-only Live-Soak bestehen, setzt aber bewusst noch nicht den finalen Controlled-Production-Beweis auf bestanden.

## Stage 3 – Controlled Production Live Proof

Stage 3 ist nur nach bestandener Stage 1 und Stage 2 erreichbar.

Vor der Mutation wird erneut fail-closed geprueft:

- Character-/Server-Bindung;
- Kandidaten-Fingerprint und Inventarzustand;
- keine alternative Runtime;
- keine laufende Upgrade-/Compound-Queue;
- Performance-Trick aktiv;
- frischer Server-Preview;
- Mindestchance `0.99`;
- Action Contract `AL-ACTION-UPGRADE`;
- Recovery Contract `AL-RECOVERY-UPGRADE`;
- Verifier `AL-VERIFIER-UPGRADE`.

Danach wird der Production-Intent persistent geschrieben und per Storage-Roundtrip bestaetigt. Erst anschließend erfolgt die frische Admission und maximal ein einziger Upgrade-Send.

Explizite Mutationsbestaetigung:

`CAP045-PRODUCTION-LIVE-PROOF-UPGRADE-ONE-SHOT-AKZEPTIERT`

Es gibt keinen Same-Intent-Retry. Ein unbekannter Ausgang bleibt `RECOVERY_PENDING`. `COMMITTED` ist ausschließlich bei verifizierter Postcondition und Self-Recipient-Settlement erlaubt.

## Authority-Trennung

Der CAP-045-Zertifizierer bleibt:

- `diagnosticOnly=true`;
- `actionAuthority=false`;
- `rawWriteAuthority=false`;
- `zertifiziererGameplayWrites=0`.

Die exakt eine mögliche Stage-3-Mutation liegt im getrennten Controlled-Proof-Driver und wird im Bericht separat als `controlledProofDriverGameplayWrites` ausgewiesen.

Auch bei bestandenem Live-Beweis bleibt:

`breiteRuntimeFreigabe=false`

## SYNTHETISCH / LIVE

Die synthetische Regression ist eine separate Evidence-Lane. Sie kann niemals den Live-Nachweis ersetzen:

`synthetischeEvidenceZaehltAlsLive=false`

Wenn reale Evidence unvollständig ist oder eine Stage blockiert, bleibt:

`liveBeweisBestanden=false`

## Bericht

Der GUI-Gesamtbericht enthält mindestens Testkennung, GUI-/Controller-Version, Gesamtstatus, Start-/Endzeit, Stage-Status, Evidence-Klasse, CoverageAudit, Soak-Dauer, Samples/Gaps, Fingerprint-Fehler, Duplicate/Unverified irreversible Effects, Invariant Violations, Recipient Settlement, Zertifizierer-Writes, Synthetic Regression, Live-Beweis-Status, Blocker sowie die beiden unveraenderlichen Safety-Werte.

Der Bericht ist nach Abschluss über **Gesamtbericht kopieren** zu kopieren und zur Auswertung gegen den exakten Repo-/Merge-Stand zu verwenden.
