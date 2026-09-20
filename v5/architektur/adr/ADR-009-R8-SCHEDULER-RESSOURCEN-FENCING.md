# ADR-009 – R8 Workflow-Scheduler, Ressourcen, Leases und Fencing

**Status:** RATIFIZIERT  
**Datum:** 2026-09-20

## Kontext

R8 muss Workflow-Planung, Priorisierung und Ressourcenkoordination so strukturieren, dass spaetere Gameplay-Mutationen nicht durch Parallelitaet, stale Leases, unbounded Retries oder unsafe Preemption gefaehrdet werden. Gleichzeitig bleibt das Gameplay-Runtime-Gesamtgate weiterhin gesperrt.

Verbindlich sind insbesondere Action-Channel-Serialisierung, das character-globale Socket-Budget, Lease-Epochen/Fencing, Safety-/Notfall-Dominanz, sichere Unterbrechungspunkte, bounded Retry/Circuit sowie Knowledge-Snapshot-Pinning fuer geplante Ablaeufe.

## Entscheidung

1. Jeder geplante Ablauf besitzt einen immutable, versionierten Vertrag mit stabiler Ablauf-ID, Owner, Prioritaetsklasse, numerischem Rang, Deadline, Ressourcen, Idempotenz, Abgleichstrategie, Retry-Richtlinie und gepinntem WissensSnapshot.
2. Der WissensSnapshot pinnt den verwendeten Git-Commit und die verwendeten Quellen-SHA256. Spaetere Knowledge-Aenderungen veraendern einen bereits registrierten Ablauf nicht still.
3. Prioritaetsklassen dominieren numerische Prioritaet. Aging wirkt nur innerhalb einer Klasse und kann daher keine Safety-Grenze ueberwinden.
4. Deadline und Ressourcenlokalitaet dienen innerhalb derselben Klasse als weitere deterministische Ordnungsmerkmale.
5. Safety-/Notfallarbeit kann niedriger priorisierte Arbeit nur an einem explizit gemeldeten sicheren Unterbrechungspunkt preempten. Ein solcher Punkt verlangt keinen offenen irreversiblen Side Effect und einen durable Checkpoint.
6. Normale Arbeit kann Safety-/Notfallarbeit nie preempten.
7. Ressourcenclaims werden deterministisch sortiert und vor der ersten Vergabe komplett validiert. Dadurch entstehen keine partiellen Hold-and-Wait-Claims bei einem belegten Claim.
8. Action-Channels werden als exklusive Scheduler-Ressourcen serialisiert.
9. Langlebige Ressourcen verwenden monoton steigende Epochen und Fencing-Tokens. Ein abgelaufener Lease geht in ABGELAUFEN_ABGLEICH und darf erst nach explizitem Abgleich neu vergeben werden.
10. Stale Fencing-Tokens autorisieren keine spaetere Nutzung.
11. Alle mutierenden Action-Channels eines Characters teilen zusaetzlich das character-globale Socket-Planbudget. Der initiale V5-Planwert bleibt 100 gewichtete Punkte je 4000 ms bei verifizierter Servergrenze 200; die Differenz bleibt Reserve.
12. Eine erfolgreiche MutationsKanalKoordination liefert nur die Kombination aus Action-Channel-Claim und Socket-Budget-Reservierung aus.
13. Retries besitzen harte Grenzen fuer Versuche, Gesamtdauer, Backoff und scoped Circuit.
14. Nach moeglichem Send wird Same-Intent-Blind-Retry unabhaengig vom allgemeinen Retry-Budget blockiert und stattdessen Abgleich verlangt.
15. R8 erzeugt keine Gameplay- oder Raw-Write-Autoritaet.

## Alternativen

- **Locks einzeln nacheinander erwerben:** verworfen, weil partielle Holds Deadlock-/Hold-and-Wait-Risiko erzeugen.
- **Lease nach Timeout automatisch an neuen Owner geben:** verworfen, weil ein alter Owner nach unklarem Side Effect sonst weiterwirken koennte.
- **Ein globaler Circuit fuer alle Capabilities:** verworfen, weil unabhaengige Arbeit nicht durch einen fachfremden Fehler gesperrt werden darf.
- **Aging ueber Prioritaetsklassen hinweg:** verworfen, weil Hintergrundarbeit dadurch Safety-Grenzen ueberholen koennte.
- **Knowledge zur Laufzeit still auf den neuesten Stand umbiegen:** verworfen; In-Flight-Arbeit bleibt an ihren PlanungsSnapshot gebunden.
- **Socket-Serverlimit voll verplanen:** verworfen; V5 behaelt konservative Reserve fuer unbekannte/interne Kosten.

## Konsequenzen

- Action-Channels koennen nicht parallel von zwei Ablaeufen gehalten werden.
- Ein gescheiterter Mehrressourcenclaim hinterlaesst keine teilweise neu erworbenen Claims.
- Lease-Verlust fuehrt in einen expliziten Abgleichzustand statt zu stillem Lock-Stealing.
- Stale Epoch/Fencing-Tokens werden nach Neuvergabe abgelehnt.
- Aging verhindert Starvation innerhalb einer Prioritaetsklasse, ohne Klassenhierarchie zu lockern.
- Safe-Preemption ist ein Protokoll und kein generisches cancel().
- Retry-Stuerme sind durch mehrere unabhaengige Grenzen begrenzt.
- R9 kann Admission/Execution auf diesen Ressourcen- und Scheduler-Vertraegen aufbauen; R8 selbst sendet nichts an Adventure Land.

## Invarianten

Betroffen sind insbesondere:

- V5-INV-002 – riskante Mutationen benoetigen mehrere unabhaengige Verriegelungen;
- V5-INV-006 – langlebige Ressourcen verwenden Epoche/Fencing;
- V5-ALT-012 – Retries sind bounded;
- V5-ALT-013 – Circuits sind scoped;
- V5-ALT-015 – Preemption nur an SafePreemptionPoints;
- V5-ALT-016 – kein Abbruch mitten im unteilbaren Commit;
- V5-ALT-020 – Safety/Notfall darf normale Arbeit preempten, nie umgekehrt;
- V5-INV-040 – geplanter Ablauf pinnt seinen WissensSnapshot.

## Migration

R8 fuehrt ausschliesslich no-write Scheduler-, Ressourcen- und Retry-Vertraege unter `v5/grundlage/quelle/scheduler/**` ein. Bestehende R3-R7-Vertraege bleiben erhalten. Spaetere R9-Execution muss Action-Channel-, Budget-, Fencing- und Ablauf-Admission explizit konsumieren; eine direkte Umgehung dieser Grenzen ist nicht zulaessig.

## Rollback

Da R8 keine Gameplay-Mutation autorisiert, kann auf den R7-Stand zurueckgerollt werden, ohne Spielzustand zu migrieren. Persistierte oder in-memory R8-Tokens duerfen nach einem Rollback nicht als ExecutionAuthority behandelt werden. Bei unklarer Lease-/Ablaufhistorie bleibt die betroffene Arbeit fail-closed und verlangt Reobservation/Abgleich.

## Nachweise

- `v5/grundlage/quelle/scheduler/workflow-vertrag.ts`
- `v5/grundlage/quelle/scheduler/ablauf-scheduler.ts`
- `v5/grundlage/quelle/scheduler/ressourcen-verwalter.ts`
- `v5/grundlage/quelle/scheduler/socket-budget.ts`
- `v5/grundlage/quelle/scheduler/retry-circuit.ts`
- `v5/grundlage/tests/r8-scheduler.test.mjs`
- `v5/grundlage/tests/r8-ressourcen.test.mjs`
- `v5/grundlage/tests/r8-retry.test.mjs`
- `v5/werkzeuge/r8-statische-guards.mjs`
- `v5/werkzeuge/r8-struktur-pruefen.mjs`
- `.github/workflows/v5-r8.yml`
