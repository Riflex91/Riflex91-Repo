# V3-Fehlerkatalog

Status: konsolidierte Fehlerklassen v1  
Quelle: vollständiger V3-Datei-Audit, 205 Tests, zentrale V3-Owner-/Guard-/Host-Dateien.

Jeder Eintrag beschreibt nicht nur einen historischen Bug, sondern die V4-Strukturregel, die dieselbe Fehlerklasse verhindern soll.

## V3ERR-001 – Command return wurde mit fachlichem Erfolg verwechselt

**Symptom:** Aktion kehrte zurück, aber gewünschter Weltzustand war nicht erreicht.

**Betroffene Klassen:** Travel, Transfer, Stand, Bank, Equip, Craft, Merchant-Transaktionen.

**V3-Korrektur:** explizite Outcome-Verifikation über beobachteten Zustand/Deltas; `smart_move`-Return ist z. B. kein Arrival-Beweis.

**V4-Prävention:** universeller Action-Lifecycle mit OBSERVING und COMMITTED nur nach Verifier-Evidenz.

## V3ERR-002 – Blind Resume nach Restart

**Symptom:** nicht-terminale Operation könnte nach Browser-/Prozessrestart erneut ausgeführt und damit dupliziert werden.

**V3-Korrektur:** persisted nonterminal -> RECOVERING / reconciliation required; keine automatische Wiederholung.

**V4-Prävention:** jeder langlebige Workflow besitzt Checkpoint, Idempotenzkennung und verpflichtendes Live-Reconcile vor neuer Mutation.

## V3ERR-003 – Merchant-Lease-Starvation

**Symptom:** ein HOLD/WAIT/abgelehnter Merchant-Pfad konnte den gemeinsamen Lease halten und Production/Service blockieren.

**V3-Korrektur:** NO-PROGRESS-/HOLD-Fälle geben den Lease aktiv frei; Tests sichern Self-Gear, Progression und Finalization ab.

**Warum möglich:** globaler nicht-preemptiver Merchant Task Coordinator kennt nur exklusiven Owner/Key, aber keine echte Workflow-Phase oder Safe-Preemption.

**V4-Prävention:** PriorityClass + Aging + SafePreemptionPoint + resumierbarer Workflow statt einfachem globalen Lock.

## V3ERR-004 – Historische Hotfix-/Patch-Kaskaden

**Symptom:** gleiche Semantik wurde nachträglich in Reliability-/Alpha-Schichten mehrfach überschrieben.

**Risiko:** unklare Ownership, versteckte Reihenfolgeabhängigkeit, schwer reproduzierbare Regressionen.

**V3-Korrektur:** Patch Registry, Runtime Composition Guard, Legacy Reliability Guard.

**V4-Prävention:** keine Monkey-Patches; ein Owner-Modul pro Verantwortung; Erweiterung über Ports/registrierte Capabilities.

## V3ERR-005 – Stale Party Identity / Progression Leak

**Symptom:** nach Partywechsel konnten alte Progression-/Cross-Map-Ziele auf neue, schwächere Charaktere wirken.

**V3-Korrektur:** Ziele an aktuelle Party-/Character-Identität binden und stale Identitäten ablehnen.

**V4-Prävention:** jedes Gruppen-/Progression-Objective trägt Roster-Epoch/Fingerprint; Ausführung revalidiert Identität unmittelbar vor Autorität.

## V3ERR-006 – Pending Offer / Logistics Deadlock

**Symptom:** fehlgeschlagene/rejected Loot- oder Delivery-Verhandlung konnte Item-/Goldlogistik blockieren.

**V3-Korrektur:** explizite ACK/NACK-, Release-, Dedupe- und kurze identitätsbezogene Backoff-Pfade.

**V4-Prävention:** Delivery Workflow mit eigener ID, Settlement, Timeout, Abort und idempotenter Gegenstellen-Evidenz.

## V3ERR-007 – Terrain-/Movement-Thrashing

**Symptom:** unerreichbares Ziel oder direkte Bewegung konnte wiederholt denselben Fehlerpfad triggern.

**V3-Korrektur:** bounded waypoint, temporäre Target-Sperre, Movement Circuit, Replan statt global BLOCKED.

**V4-Prävention:** Navigation Port mit RouteAttempt-ID, bounded retry, circuit und anti-thrashing score hysteresis.

## V3ERR-008 – Bank/Inventory ohne Workspace

**Symptom:** mehrstufige Bank-/Consolidation-/Mutation konnte bei vollem Inventory keinen sicheren Zwischenschritt ausführen.

**V3-Korrektur:** Workspace-Slots, Capacity Planning, fail-closed, Emergency Reclaim nur begrenzt und frisch revalidiert.

**V4-Prävention:** InventorySpace als explizite Resource/Precondition jedes Workflows.

## V3ERR-009 – Persistence Quota Retry Storm

**Symptom:** QuotaExceeded oder voller Storage konnte wiederholte Writes und weitere Fehler erzeugen.

**V3-Korrektur:** Quota-Preflight, bounded retry, exponential backoff, circuit, selektive Kompaktierung historischer Daten.

**V4-Prävention:** zentraler Persistence-Port mit Budget/Quota Health und Prioritätsklassen für persistente Evidenz.

## V3ERR-010 – Gameplay-Code als eigener Prozess-Restarter

**Symptom:** ein toter Browser kann seine eigene Totalsituation nicht zuverlässig erkennen/reparieren; Restart könnte halbfertige Transaktionen duplizieren.

**V3-Korrektur:** Runtime empfiehlt Recovery/Restart, externer Host besitzt Prozess-Lifecycle.

**V4-Prävention:** harte Runtime/Host-Capability-Grenze; Host besitzt niemals Gameplay-Autorität.

## V3ERR-011 – Stale Moving Target bei Merchant Service

**Symptom:** alte Positionsdaten konnten Reise/Delivery zu einem inzwischen bewegten Farmer auslösen.

**V3-Korrektur:** motion-aware freshness, sichtbares/trusted Ziel, same-map/range checks.

**V4-Prävention:** FreshnessPolicy als Port; Workflow revalidiert Ziel-Freshness vor Travel und vor Commit.

## V3ERR-012 – Production zu früh als fertig markiert

**Symptom:** erfolgreicher Craft wurde als Abschluss behandelt, obwohl das Zielitem noch nicht beim vorgesehenen Empfänger angekommen war.

**V3-Korrektur:** persistierter Production Intent bleibt OUTPUT_READY_FOR_DELIVERY, bis Recipient Inventory/Equipment verifiziert ist.

**V4-Prävention:** fachlicher Workflow-Commit = Recipient Settlement, nicht letzter lokaler Craft-Commit.

## V3ERR-013 – doppelte Verarbeitung nach Restart

**Symptom:** bereits beobachtete irreversible Operation oder Encounter konnte nach Restart erneut als neu gezählt werden.

**V3-Korrektur:** persistierte Dedupe-Ringe/Observer Cursor/Operation IDs.

**V4-Prävention:** globale Idempotency-Key-Regel für side effects und Evidence-Ingest.

## V3ERR-014 – Persistierter Katalog als Ausführungsautorität

**Symptom:** historisches Bank-/World-Wissen könnte fälschlich physische Verfügbarkeit suggerieren.

**V3-Korrektur:** persistierte Kataloge dürfen Planung informieren, aber Live-Ausführung revalidiert physische Evidenz.

**V4-Prävention:** Knowledge != Authority; Port-Typen unterscheiden PlanningEvidence von ExecutionEvidence.

## V3ERR-015 – Unknown Content wurde aus Liveness-Gründen freigegeben

**Symptom:** neues/geändertes Monster könnte als normales Farmziel behandelt werden.

**V3-Korrektur:** Quarantine, explizite Revalidation, Safety vor Liveness.

**V4-Prävention:** Unknown/Changed => fail-closed; Lernsystem kann Freigabe nicht selbst autorisieren.

## V3ERR-016 – Mehrere Potion-/Service-Owner

**Symptom:** Legacy Party Supply und neuer Merchant Service konnten dieselbe Versorgung konkurrierend ausführen.

**V3-Korrektur:** Legacy-Pfad deaktiviert; genau ein aktueller Owner.

**V4-Prävention:** Capability Registry erzwingt Single Owner pro mutierender Capability.

## V3ERR-017 – Partielle Multi-Item-Delivery

**Symptom:** erste Teilaktion kann erfolgreich, zweite fehlschlagen; blindes Replay würde duplizieren.

**V3-Korrektur:** persisted active operation, lokale Delta-Verifikation, at-most-once fail-safe semantics.

**V4-Prävention:** mehrteilige Transaktion besitzt Phase, per-step idempotency und Reconcile-Strategie; kein Whole-Workflow-Retry.

## V3ERR-018 – Globaler Circuit blockiert fachfremde Arbeit

**Symptom:** Fehler einer Economy-/Travel-Familie konnte gesunde unabhängige Funktionen unnötig abschalten.

**V3-Korrektur:** getrennte Circuits/Failure Families.

**V4-Prävention:** Circuits sind capability-/resource-/identity-scoped, nicht global.

## V3ERR-019 – Raw Target statt Owned Target

**Symptom:** Adventure-Land-`target` allein konnte Cohesion/Performance/Team-Entscheidungen verfälschen.

**V3-Korrektur:** Farmer-owned Engagement-/Leader-Target-Evidenz; raw target ist nicht automatisch fachlicher Besitz.

**V4-Prävention:** explizites TargetOwnership-Modell.

## V3ERR-020 – Fresh Plan Drift vor irreversibler Aktion

**Symptom:** Plan war beim Erstellen korrekt, aber Weltzustand änderte sich vor SELL/BUY/BANK/TRANSFER.

**V3-Korrektur:** unmittelbarer Preflight/Revalidation vor Raw Action; bei Drift zero raw actions.

**V4-Prävention:** Admission Token ist kurzlebig und an Preconditions/Fingerprint gebunden.

## V3ERR-021 – Item-Identität nur über Name/Level

**Symptom:** Duplikate konnten falsches physisches Gear reservieren oder transferieren.

**V3-Korrektur:** sourceIndex/physische Slot-Reservierung, exact goal item.

**V4-Prävention:** ItemHandle = Character + InventoryRevision + Slot + ItemFingerprint; Mengenreservierung separat.

## V3ERR-022 – Bank/Compound-Fairness

**Symptom:** große oder ständig neu geplante Identität konnte andere Compound-Sets verhungern lassen.

**V3-Korrektur:** backlog-orientierte Auswahl plus Rotation bei Gleichstand.

**V4-Prävention:** Scheduler-Aging und explizite Fairness-Policy.

## V3ERR-023 – Alert zwischen Dequeue und Persistenz verloren

**Symptom:** Host-/Transportfehler könnte kritischen Alert nach Entnahme verlieren.

**V3-Korrektur:** pending -> durable spool -> claim exact IDs -> delivery.

**V4-Prävention:** persist-before-claim bleibt Host-Invariante.

## V3ERR-024 – Host-/Dashboard-Bridge zu mächtig

**Symptom:** generisches `evaluate()` würde externe Remote-Control-Autorität erzeugen.

**V3-Korrektur:** harter allowlisted Narrow Bridge ohne generisches evaluate/invoke/call.

**V4-Prävention:** Host-API nur typisierte, read-only bzw. explizit begrenzte Lifecycle-Ports.

## V3ERR-025 – Restart als erfolgreiche Recovery interpretiert

**Symptom:** neuer Prozess läuft, aber offene fachliche Operation ist ungeklärt.

**V3-Korrektur:** fresh run ID + runtime-owned observation-only reconciliationStatus.

**V4-Prävention:** HostRecovery und GameplayRecovery sind getrennte Zustandsmaschinen.

## V3ERR-026 – Safety-Lockerung zur Deadlock-Behebung

**Symptom:** ein Liveness-Fix könnte Unknown-/Target-/Content-Schutz lockern.

**V3-Korrektur:** Logic Guardian: Liveness darf Safety nicht schwächen.

**V4-Prävention:** statische und dynamische Invariante: Recovery darf Authority nur gleich lassen oder reduzieren.

## V3ERR-027 – Unbegrenzte Telemetrie-/History-Zunahme

**Symptom:** 24/7-Betrieb führt zu Speicherwachstum.

**V3-Korrektur:** bounded buffers, bounded histories, capacity drops/compaction, Soak-Tests.

**V4-Prävention:** jede History/Queue braucht Capacity + Eviction Policy + Status Counter.

## V3ERR-028 – Event-/Quest-Quelle driftet zwischen Plan und Ausführung

**Symptom:** Event war beim Planen aktiv, beim Exchange/Farm aber beendet.

**V3-Korrektur:** Event-Evidence wird unmittelbar vor Ausführung revalidiert.

**V4-Prävention:** external-world Preconditions sind Admission-Fingerprints mit Ablauf/Freshness.

## V3ERR-029 – Operator Stop während In-Flight Transaction

**Symptom:** sofortiges Stoppen kann eine Mutation mitten im Commit zerreißen.

**V3-Korrektur:** Stop blockiert neue Arbeit zuerst und wartet bounded auf sichere Settlement-/Reconcile-Grenze.

**V4-Prävention:** Stop/Preemption verwenden SafePreemptionPoint; Timeout führt zu STOPPED_BLOCKED/RECONCILE_REQUIRED statt erzwungenem Resume.

## V3ERR-030 – Semantische Regression durch Altpfad

**Symptom:** korrigierte neue Logik existiert parallel zu einem alten direkten Pfad.

**V3-Korrektur:** Guards und Tests für Legacy-Reliability/Composition/Ownership.

**V4-Prävention:** kein Legacy-Pfad im Runtime-Graph; Capability Registry darf pro Write-Capability genau einen aktiven Provider kennen.
