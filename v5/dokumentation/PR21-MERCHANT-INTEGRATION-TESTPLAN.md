# PR21 – Merchant Gesamtintegration: Testplan

**Status:** CHECKPOINT-ADMISSION VORBEREITET / NO-WRITE  
**Aktueller Development-Gate:** PR21 Merchant Gesamtintegration.  
**PR20.9-Basis:** dokumentierter manueller Development-Override; keine erfundene Craft-Live-Evidence.

## Maschinenlesbarer Live-Preflight

Vor einem spaeter separat autorisierten 15-Minuten-Lauf wird die Voraussetzung
zusaetzlich read-only ueber
`grundlage/quelle/merchant/pr21-merchant-integration-live-preflight.ts`
geprueft.

Der Preflight bindet:

- den frisch verifizierten `main` an den gepinnten Main-Commit;
- die bestehende Merchant-Readiness
  `BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE`;
- den Checkpoint
  `PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT` und dessen Runbook;
- den aktuellen PR21-28-Readiness-Snapshot;
- alle neun produktiven Einzelratifizierungen PR20.1 bis PR20.9.

Der aktuelle Repository-Stand akzeptiert PR20.9 fuer den **Entwicklungsfortschritt**
ueber `roadmap/pr20-9-craft-manual-development-override.json`. Die historische
No-Candidate-Evidence bleibt unveraendert und wird nicht als echte Craft-Live-
Ratifizierung umgedeutet.

Die PR21-Checkpoint-Admission bindet den
`PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT` an exakt 900 Sekunden
`MERCHANT_INTEGRATION_15M` mit 5-Sekunden-Sampling und dem bestehenden
observer-only Runbook. Sie startet keine Runtime. Die externe
Runtime-Autorisierung bleibt ein separater Schritt; Preflight und Admission
besitzen keine Gameplay-, Raw-Write- oder Normal-Runtime-Authority.

## Ziel

Der Merchant gilt erst dann als "rund laufend", wenn nicht nur einzelne
Actions funktionieren, sondern die gesamte Kette autonom, bounded und
restart-sicher zusammenspielt.

## Testgruppen

### A. Normaler Rundlauf

Mindestens folgende fachliche Ketten werden abgedeckt:

- Bank -> Inventory -> Markt/NPC -> Bank;
- Supply -> Rendezvous -> Itemtransfer -> Recipient Settlement;
- Collection -> Rendezvous -> Ruecktransfer -> Bank;
- Gear-Ziel -> physische Reservierung -> Delivery -> Equip Settlement;
- Production -> Beschaffung -> Transformation -> Delivery -> finales Settlement;
- MLuck als Optimierungsarbeit zwischen hoeher priorisierten Aufgaben.

### B. Scheduler, Pingpong und Starvation

Nachzuweisen:

- Prioritaetsklassen bleiben vor Rang/Aging;
- Aging verhindert Starvation;
- Lokalitaet bevorzugt sinnvolle Buendelung nur bei sonst gleichem Vorrang;
- Mindesthaltedauer verhindert sofortiges Zurueckspringen;
- Wechsel-Cooldown verhindert Oszillation;
- bounded Wechselbudget erkennt Thrash;
- Safety/Notfall darf an sicherem durable Checkpoint preempten;
- offene irreversible Mutation ist nicht preemptbar;
- lange wartende kritische Versorgung wird nicht durch Optimierungsarbeit
  verhungern gelassen.

### C. Recovery- und Restart-Matrix

Restart/Disconnect werden mindestens injiziert:

1. vor durable Intent;
2. nach durable Intent aber vor Send;
3. unmittelbar nach moeglichem Send;
4. waehrend UNKNOWN;
5. waehrend Bank-Lease;
6. waehrend Market-RID/Listing gebunden ist;
7. waehrend Rendezvous;
8. waehrend Transfer vor Recipient Settlement;
9. waehrend q/Placeholder einer Wertmutation;
10. nach Craft-Output aber vor finaler Delivery;
11. nach Delivery aber vor Production Commit.

Erwartung in jedem Fall:

- keine alte ExecutionAuthority wird restauriert;
- kein Same-Intent-Blind-Retry;
- frische Reobservation/Reconciliation;
- widerspruechliche Evidence => fail-closed/operator-required;
- neue Mutation erst nach terminalem oder sicher reconciliertem Altzustand.

### D. Evidence-/Drift-Faelle

Zu injizieren:

- Inventory-Index drift;
- physisches Item ersetzt/verschoben;
- Bank-Lease-Epoche driftet;
- Bank-Snapshot stale;
- Market RID ersetzt;
- Partial Fill bei gleicher RID;
- Preis/Menge driftet;
- Empfaenger wechselt Session;
- Empfaenger wechselt Server/Instanz;
- Roster-Epoche driftet;
- Recipient Inventory/Gold Baseline driftet;
- MLuck Zielcondition wird durch andere Quelle stark;
- Skill MP/Cooldown driftet;
- Production Event/Quest Gate wird stale;
- Knowledge-/Config-Pin aendert sich waehrend In-Flight.

### E. Ressourcen- und Kapazitaetsfaelle

- Inventory voll;
- konservativer Workspace reicht nicht;
- Bankkapazitaet reicht nicht;
- Gold-Safety-Reserve wuerde unterschritten;
- Socket-Budget ist belegt;
- Action-Channel ist gefenced;
- dieselbe physische Gear-/Mutation-Ressource bereits reserviert;
- derselbe Recipient-Slot bereits reserviert.

### F. Operator und Safety

- Capability-Deny vor Admission;
- Capability-Deny zwischen Planung und Send-Recheck;
- NOTHALT vor Admission;
- NOTHALT waehrend wartender Arbeit;
- Stop waehrend UNKNOWN;
- Stop waehrend irreversibler In-Flight-Transaktion.

## Telemetrie fuer 15m Integrationslauf

Mindestens zu erfassen:

- geplante/gestartete/terminale Merchant-Demands;
- Bereichswechsel und Gruende;
- Wechselrate je Zeitfenster;
- aeltester wartender Demand;
- Bank-Lease-Epochen;
- offene Transaktionen nach Familie;
- UNKNOWN/PARTIAL/OPERATOR_REQUIRED;
- Adapteraufrufe und Gameplay-Writes nach Capability;
- Same-Intent-Retry-Zaehler;
- Recipient-Settlement-Latenz;
- Restart-/Recovery-Zaehler;
- bounded Queue-/Journal-/RAM-/SSD-Metriken.

## Harte Exit-Kriterien

Der reale 15-Minuten-Lauf besteht nur bei:

- 0 unerwarteten Gameplay-Writes;
- 0 doppelten irreversiblen Wirkungen;
- 0 Same-Intent-Blind-Retries;
- 0 Authority-Leaks nach Restart;
- 0 dauerhaft unreconcilierten offenen Transaktionen, ausser explizit
  fail-safe/operator-required;
- 0 unbegruendetem Pingpong/Thrash;
- keiner Starvation kritischer Versorgung;
- keinem Bypass von NOTHALT/Deny;
- bounded Ressourcen;
- vollstaendiger erklaerbarer Evidence-Kette.

## Langzeit-Folgegates

Nach PR21 ersetzt der 15-Minuten-Lauf nicht die spaetere Langzeit-Evidence.
Fuer den angestrebten Wochen-/Monatsbetrieb folgen weiterhin die Post-R19
Gates: mehrere Stunden, ueber Nacht, 72h, 7 Tage und 30 Tage unbeaufsichtigt.
