# V5 – Abdeckung der 30 V3-Fehlerklassen

**Status:** R2 RATIFIZIERT  
**Stand:** 2026-09-19

Alle 30 konsolidierten V3-Fehlerklassen besitzen jetzt eine explizite strukturelle V5-Gegenmassnahme. Diese R2-Abdeckung ist eine Architektur-/Vertragsaussage und **kein Implementierungs- oder Live-Nachweis**.

Die maschinenlesbare Matrix liegt unter:

`v5/migration/v3-fehlerabdeckung.json`

Abgedeckt werden insbesondere:

- Return/Promise ≠ Commit und Arrival;
- Restart/UNKNOWN/Reconciliation statt Blind Resume;
- Scheduler-Fairness, scoped Circuits und Safe Preemption;
- Workspace/Outputspace;
- bounded Persistenz und SSD-Backpressure;
- Host/Runtime-Authority-Trennung;
- stale Party-/Movement-/Event-Evidence;
- Item-Identitaet und zentrale Disposition;
- Production Recipient Settlement;
- Content Quarantine;
- Single Owner und kein Legacy-Altpfad;
- Alert persist-before-claim;
- bounded Telemetrie und verifizierbare Certification Evidence.

Die spaeteren R3–R19-Gates muessen diese Gegenmassnahmen technisch durch Guards, Tests, Fault Injection, Replay und Live-Evidence beweisen.
