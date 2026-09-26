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

## Observer-Handoff

Nach der Checkpoint-Admission ist der PR21-Observer-Handoff jetzt explizit
gebunden. Er verwendet den bestehenden R11/PR21-28-Observability-Pfad und
definiert fuer den Merchant-Checkpoint:

- Segment `pr21-merchant-integration`;
- exakt 900 Sekunden Ziel- und Mindestdauer;
- 5 Sekunden Sample-Intervall;
- maximal 15 Sekunden Abstand zwischen zwei Samples;
- 181 erwartete Samples fuer einen vollstaendigen 0..900s-Lauf;
- Health-Zustand muss `GESUND` sein;
- Operations muessen aktuell sein;
- SSD-Latenz, IO-Queue und freie Bytes muessen vorhanden sein;
- Recorder-Drops muessen 0 bleiben;
- Backpressure muss false bleiben;
- aktive Runtime-Authority muss exakt `runtime:merchant` sein;
- jede zusaetzliche oder fehlende Runtime-Authority blockiert fail-closed.

Der Handoff startet die Runtime nicht und erteilt keine Authority. Externe
Runtime-Autorisierung bleibt ein separater Schritt. Der dokumentierte
PR20.9-Development-Override bleibt weiterhin explizit von echter Craft-
Live-Evidence getrennt.

## Bounded Sample-Collector

Nach dem Observer-Handoff ist der PR21-Sample-Collector jetzt als reine
NO-WRITE-Grenze vorbereitet. Er uebersetzt validierte Supervisor-/Observability-
Snapshots in die bestehenden `Pr21_28MilestoneSample`-Rows.

Grenzen:

- maximal 184 Samples im Speicher;
- Zielzeit 900 Sekunden;
- 5 Sekunden Sollintervall;
- maximal 15 Sekunden Sample-Gap;
- 181 Samples fuer den normalen 0..900s-Lauf;
- monotone Beobachtungszeit;
- jeder Observability-/Safety-Fehler friert die Serie sofort fail-closed ein;
- Erreichen des 900s-Ziels friert die Serie deterministisch ein;
- Erreichen des Sample-Limits vor dem Ziel blockiert fail-closed;
- die eingefrorenen Samples sind direkt mit dem bestehenden
  PR21-28-Milestone-Runner auswertbar.

Der Collector besitzt weder Runtime-Startrecht noch Gameplay-, Raw-Write-
oder Normal-Runtime-Authority und erzeugt selbst keine Gameplay/Public/Raw
Writes.

## Freeze/Evaluation-Handoff

Nach dem bounded Sample-Collector ist jetzt auch der reine
Freeze/Evaluation-Handoff vorbereitet. Er akzeptiert nur eine bereits
eingefrorene, saubere 181-Sample-Serie mit mindestens 900 Sekunden Dauer und
finalem `BEOBACHTUNG_BEREIT`.

Der Handoff fuehrt die vorhandenen Bausteine in fester Reihenfolge aus:

1. PR21-28 Milestone-Auswertung;
2. Live-Evidence-Auswertung;
3. Result-Package-Build;
4. Erzeugung eines Ratification-Drafts.

Der maximal erreichbare Zustand ist
`READY_FOR_EXPLICIT_MANUAL_RATIFICATION`. Der Draft bleibt
`AWAITING_EXPLICIT_RATIFICATION`; der Handoff ratifiziert nicht selbst,
mutiert kein Gate und erteilt keine Authority.

## Explizite Ratification-Record-Grenze

Die PR21-spezifische Ratification-Grenze akzeptiert ausschließlich einen
`READY_FOR_EXPLICIT_MANUAL_RATIFICATION`-Handoff des Merchant-Checkpoints.
Der Bestätigungstext muss exakt dem im Draft gepinnten Text entsprechen.

Ein erfolgreicher Aufruf erzeugt nur `RATIFIED_RECORD_ONLY`. Dabei bleiben
`gateAdvanced=false`, `authorityIssued=false` und
`broadRuntimeGrant=false`; das Result-Package bleibt unverändert gebunden.
Damit ist Ratifizierung bewusst von einem späteren Gate-Advance getrennt.

## Gate-Advance-Proposal-Grenze

Nach einem expliziten `RATIFIED_RECORD_ONLY` kann die PR21-spezifische
Proposal-Grenze den bestehenden PR21-28 Gate-Advance-Evaluator verwenden.

Sie verlangt gleichzeitig:

- Stage exakt `PR21`;
- Merchant-Checkpoint `PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT`;
- frischen Main-SHA identisch zum Ratification-Record;
- identischen Package-Fingerprint;
- produktiv berechtigte, blockerfreie PR21-Feature-Gate-Sicht;
- keine Authority in der Feature-Gate-Sicht.

Der maximal erreichbare Zustand ist `READY_FOR_SEPARATE_GATE_APPLY`.
Der Proposal selbst setzt kein Gate, erteilt keine Authority und verlangt
beim spaeteren Apply erneut einen frischen Main-Check.

## Default-Off Gate-Apply-Grenze

Nach einem `READY_FOR_SEPARATE_GATE_APPLY`-Proposal wird die PR21-Apply-
Transaktion weiterhin ausschließlich **vorbereitet**, nicht ausgeführt.

Die PR21-spezifische Grenze:

- erzeugt eine deterministisch gebundene `PREPARED_DEFAULT_OFF`-Transaktion;
- revalidiert Main, Stage, Package-Fingerprint und Ratification-Fingerprint;
- verlangt Durable Intent vor einem spaeteren Apply;
- verlangt One-Shot-Ausfuehrung ohne Same-Intent-Retry;
- verlangt Postcondition-Verifikation;
- schickt UNKNOWN spaeter zwingend in Reconciliation.

Dabei bleiben `applyAdapterInstalled=false`, `executionEnabled=false`,
`durableIntentCreated=false`, `gateMutationPerformed=false` und
`authorityIssued=false`. Ein echter Apply bleibt ein separater,
explizit autorisierter Schritt.

## Apply-Execution-Authorization-Boundary

Nach der Default-Off-Apply-Grenze ist die eigentliche Execution-Freigabe
separat vorbereitet. Eine Authorization kann nur fuer exakt eine gepinnte
PR21-Gate-Apply-Transaktion und nur mit dem vollstaendigen Confirmation-Text
ausgestellt werden.

Die Authorization ist maximal 1500 ms gueltig und auf exakt eine Verwendung
begrenzt. Direkt vor einer spaeteren Execution muessen der aktuelle Main-Commit
und der Transaction-Fingerprint erneut passen; vor jeder Mutation bleibt ein
durable Intent Pflicht. Same-Intent-Retry bleibt verboten und ein unbekannter
Ausgang muss reconciled werden.

Auch ein erfolgreich erzeugter Authorization-Record fuehrt selbst keinen Apply
aus: Apply-Adapter und Execution bleiben aus, es erfolgt keine Gate-Mutation und
keine Gameplay-/Raw-Write-/Broad-Runtime-Authority wird erteilt.

## One-Shot Gate-Apply-Execution-Boundary

Die nachgelagerte Execution-Grenze ist jetzt als schmale PR21-Control-Plane-
Mutation vorbereitet. Sie akzeptiert ausschließlich einen noch nicht
verbrauchten `AUTHORIZED_ONE_SHOT_RECORD_ONLY` fuer exakt dieselbe
`PREPARED_DEFAULT_OFF`-Transaktion. Direkt vor dem Versuch muessen Main,
Transaction-Fingerprint, Package-Fingerprint und Ratification-Fingerprint
weiterhin exakt passen; ein Restart seit Authorization blockiert die direkte
Ausfuehrung.

Vor dem einzigen Gate-Mutationsversuch muss ein exakt gebundener Durable Intent
persistent als neu bestaetigt werden. Existiert derselbe Intent bereits, wird
nicht resumed und nicht erneut mutiert, sondern zwingend reconciled. Die einzige
Mutationsschnittstelle ist `applyPr21MerchantIntegrationGate(...)`; eine
generische execute-/mutieren-Hintertuer existiert nicht.

Nach jedem Mutationsversuch ist eine getrennte Postcondition-Beobachtung Pflicht.
UNKNOWN, fehlender terminaler Mutation-Record oder eine nicht verifizierte
Postcondition fuehren in `reconcilePr21_28GateApply(...)` und verbieten einen
Same-Intent-Retry. Nur eine verifizierte PR21-Postcondition mit terminalem Record
wird ueber `recordPr21_28GateSettlement(...)` als
`APPLIED_VERIFIED_RECORD_ONLY` festgehalten.

Diese Grenze kann ausschließlich den PR21 Feature-Gate-Control-Plane-Zustand
mutieren. Sie erteilt keine Movement-, Combat-, Merchant-Gameplay-, Craft-,
Upgrade-, Compound-, Exchange-, Bank-Write-, Raw-Socket-, Broad-Runtime- oder
Normal-Runtime-Authority. PR22 bleibt bis zum separaten verifizierten
Post-Settlement-/Roadmap-/Ledger-Uebergang blockiert.

## Post-Settlement-Transition-Boundary

Nach einem verifizierten `APPLIED_VERIFIED_RECORD_ONLY` wird der PR21-Abschluss
nicht automatisch in Roadmap oder Stage-Ledger geschrieben. Die Transition-
Boundary revalidiert zuerst den Settlement-Record, die erfolgreiche
`ALREADY_APPLIED_REQUIRES_RECORD_ONLY`-Reconciliation und den aktuellen Main.

Der uebergebene Stage-Ledger wird aus seinen Entry-States erneut aufgebaut.
Ledger- und Entry-Fingerprints muessen exakt dem Rebuild entsprechen. PR21 muss
darin `preparationComplete`, Live-Evidence, explizite Ratifikation und
`gateApplyVerified` besitzen und als hoechste produktiv eligible Stage stehen.
PR22 darf zu diesem Zeitpunkt noch nicht produktiv eligible sein.

Der maximal erreichbare Zustand dieser Grenze ist
`READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY`. Die Grenze selbst:

- schliesst PR21 nicht ab;
- aktiviert PR22 nicht;
- veraendert Roadmap oder Ledger nicht;
- erteilt keine PR22-Produktiv-Authority;
- verlangt vor einem spaeteren Completion-Apply erneut einen frischen Main-Check;
- erteilt keine Gameplay-, Raw-Write-, Broad-Runtime- oder Normal-Runtime-Authority.

Erst ein separater, spaeterer Stage-Completion-Apply darf den verifizierten
Transition-Record auf die PR21/PR22-Stage-Grenze anwenden.

## Stage-Completion-Apply-Boundary

Die erste Apply-Grenze fuer den Stage-Uebergang bleibt bewusst default-off.
Sie akzeptiert ausschließlich einen unveraenderten
`READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY`-Record, revalidiert dessen
Transition-Fingerprint und verlangt, dass der aktuelle Main weiterhin exakt
dem im Transition-Record gepinnten Source-Main entspricht.

Bei erfolgreicher Vorbereitung entsteht nur eine
`PREPARED_STAGE_COMPLETION_DEFAULT_OFF`-Transaktion. Diese Transaktion bindet
PR21, PR22, Settlement-, Ledger- und Transition-Fingerprint deterministisch
und verlangt fuer eine spaetere Execution erneut:

- frischen Main-Check;
- Transition-Fingerprint-Recheck;
- Durable Intent vor jeder Stage-Mutation;
- One-Shot-Ausfuehrung;
- keinen Same-Intent-Retry;
- Postcondition-Verifikation;
- Reconciliation bei UNKNOWN.

Die Apply-Boundary selbst installiert keinen Stage-Completion-Adapter, fuehrt
keine Execution aus, schliesst PR21 nicht ab und aktiviert PR22 nicht.
Ein eigener Execution-Authorization-Schritt bleibt erforderlich.

## Stage-Completion-Execution-Authorization-Boundary

Die Execution-Freigabe fuer den PR21→PR22-Stage-Uebergang wird separat und
kurzlebig vorbereitet. Aus einer `PREPARED_STAGE_COMPLETION_DEFAULT_OFF`-
Transaktion entsteht zunaechst nur
`AWAITING_EXPLICIT_STAGE_COMPLETION_AUTHORIZATION`.

Eine Authorization darf nur durch den vollstaendigen, transaktions- und
Main-gebundenen Confirmation-Text erzeugt werden. Der Record ist maximal
1500 ms gueltig vorbereitet und auf genau eine Verwendung begrenzt.

Auch `AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY` fuehrt selbst keine
Stage-Mutation aus. Vor einer spaeteren Execution muessen Main,
Transaction-Fingerprint und Transition-Fingerprint erneut exakt passen;
Durable Intent, One-Shot-Ausfuehrung, Postcondition-Verifikation und
Reconciliation bei UNKNOWN bleiben Pflicht.

PR21 bleibt in dieser Boundary `IN_PROGRESS`, PR22 bleibt `BLOCKED_BY_PR21`.
Es werden keine Gameplay-, Raw-Write-, Broad-Runtime- oder Normal-Runtime-
Rechte erteilt.

## Stage-Completion-One-Shot-Execution-Boundary

Die eigentliche Stage-Completion-Execution ist als enge Control-Plane-
Mutation vorbereitet. Vor dem einzigen Versuch muessen Authorization,
Default-Off-Transaktion, aktueller Main, Transaction-Fingerprint und
Transition-Fingerprint weiterhin exakt gebunden sein.

Vor der Mutation wird ein Durable Intent persistent als neu bestaetigt.
Existiert derselbe Intent bereits oder gab es seit Authorization einen
Restart, erfolgt kein Resume und kein Retry; der Zustand muss reconciled
werden. Die einzige Mutationsschnittstelle lautet
`applyPr21StageCompletion(...)`.

Nach dem Versuch wird der Stage-Zustand separat gelesen. Nur wenn PR21
verifiziert abgeschlossen, PR22 als Development-Stufe aktiviert,
PR22-Produktiv-Authority weiterhin false und ein terminaler Mutation-Record
vorhanden sind, darf
`APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY` entstehen.

Die Runtime-Boundary schreibt keine Repository-Roadmap und keinen Stage-
Ledger um. UNKNOWN oder eine nicht eindeutig verifizierte Postcondition
fuehrt fail-closed in Reconciliation ohne Same-Intent-Retry.

## Stage-Completion-Post-Execution-Transition-Boundary

Nach einem verifiziert erfolgreichen Stage-Completion-Versuch wird der
Repository-Status nicht automatisch umgeschrieben. Die nachgelagerte
Transition-Boundary akzeptiert ausschließlich
`APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY` und revalidiert den
Completion-Fingerprint sowie den gepinnten Source-Main.

Bei Erfolg entsteht nur
`READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY`. Dieser Record beschreibt
als spaeteres Ziel PR21=`COMPLETE`, PR22=`IN_PROGRESS` und
`currentStage=PR22`, waehrend PR22-Produktiv-Authority weiterhin false
bleibt.

Die Boundary selbst veraendert weder Roadmap noch Stage-Ledger oder
Control-Plane. Vor einem separaten Repository-State-Apply muessen Main und
Completion-Fingerprint erneut exakt passen.

## Repository-Stage-State-Apply-Boundary

Der Repository-Uebergang bleibt zunaechst default-off. Ein
`READY_FOR_SEPARATE_REPOSITORY_STAGE_STATE_APPLY`-Record wird nur akzeptiert,
wenn Main und Repository-Ausgangszustand weiterhin exakt dem gepinnten
PR21-Zustand entsprechen: `currentStage=PR21`,
`currentGate=PR21_MERCHANT_INTEGRATION`, PR21=`IN_PROGRESS` und
PR22=`BLOCKED_BY_PR21`.

Bei erfolgreicher Vorbereitung entsteht nur eine
`PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF`-Transaktion. Sie bindet den
spaeteren Zielzustand PR21=`COMPLETE`, PR22=`IN_PROGRESS`,
`currentStage=PR22` und `currentGate=PR22_MULTI_CHARACTER_COORDINATION`.

Die Boundary selbst installiert keinen Repository-Apply-Adapter und fuehrt
keine Mutation aus. Vor einer spaeteren Execution bleiben frischer Main-,
Repository-Transition-, Completion-Fingerprint- und Repository-State-Recheck
sowie Durable Intent, One-Shot-Ausfuehrung, Postcondition-Verifikation und
Reconciliation bei UNKNOWN Pflicht.

## Repository-Stage-State-Execution-Authorization-Boundary

Die Freigabe fuer die spaetere Repository-State-Mutation wird separat,
kurzlebig und transaktionsgebunden vorbereitet. Aus
`PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF` entsteht zunaechst nur
`AWAITING_EXPLICIT_REPOSITORY_STAGE_STATE_AUTHORIZATION`.

Nur der vollstaendige Confirmation-Text mit exakt passendem Transaction-
Fingerprint und gepinntem Main darf innerhalb maximal 1500 ms einen
`AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY` erzeugen.

Der Authorization-Record fuehrt selbst keine Repository-Mutation aus.
Vor einer spaeteren One-Shot-Execution muessen Main, Transaction-,
Repository-Transition- und Completion-Fingerprint sowie der komplette
Repository-Ausgangszustand erneut exakt passen. Durable Intent,
Postcondition-Verifikation und Reconciliation bei UNKNOWN bleiben Pflicht.

## Repository-Stage-State-One-Shot-Execution-Boundary

Die Repository-State-Execution ist als eng gebundene One-Shot-Mutation
vorbereitet. Vor dem einzigen Versuch muessen Authorization, Main,
Transaction-, Repository-Transition- und Completion-Fingerprint sowie der
vollstaendige Repository-Ausgangszustand weiterhin exakt passen.

Vor der Mutation wird ein neuer Durable Intent verlangt. Ein bereits
vorhandener Intent oder ein Restart seit Authorization fuehrt ohne Resume
und ohne Retry in Reconciliation. Die einzige Mutationsschnittstelle lautet
`applyPr21RepositoryStageStateTransition(...)`.

Nach dem Versuch wird der Repository-State separat gelesen. Nur wenn
PR21=`COMPLETE`, PR22=`IN_PROGRESS`, `currentStage=PR22`,
`currentGate=PR22_MULTI_CHARACTER_COORDINATION`, PR22-Produktiv-Authority
weiterhin false und ein terminaler Mutation-Record vorhanden sind, darf
`APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY` entstehen.

Diese Entwicklungsstufe fuehrt keinen solchen Apply aus; der Repository-
Status bleibt bis zu einer spaeteren explizit autorisierten Execution
unveraendert.

## Repository-Stage-State-Post-Execution-Finalization-Boundary

Nach einem spaeter tatsaechlich verifizierten Repository-State-Apply wird
kein weiterer Zustand automatisch mutiert. Die Finalization-Boundary
revalidiert den `APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY`-
Fingerprint und den beobachteten Repository-Postzustand.

Nur PR21=`COMPLETE`, PR22=`IN_PROGRESS`, `currentStage=PR22`,
`currentGate=PR22_MULTI_CHARACTER_COORDINATION` und weiterhin false
gesetzte PR22-Produktiv-Authority duerfen
`READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY` erzeugen.

Der Finalization-Record bindet den urspruenglichen Source-Main, den
Finalization-Main sowie Transaction-, Transition-, Completion- und
Repository-Execution-Fingerprint. Er fuehrt keine weitere Repository- oder
Control-Plane-Mutation aus und bereitet keinen produktiven PR22-Handoff vor.

## PR22-Development-Handoff-Boundary

Der Uebergang in die PR22-Entwicklung bleibt an einen spaeter real
finalisierten PR21-Repository-State gebunden. Nur ein
`READY_FOR_PR22_DEVELOPMENT_HANDOFF_RECORD_ONLY` mit revalidiertem
Finalization-Fingerprint, identischem Finalization-Main und erneut
bestaetigtem Zustand PR21=`COMPLETE`, PR22=`IN_PROGRESS`,
`currentStage=PR22` darf den Development-Handoff vorbereiten.

Ergebnis ist maximal `READY_FOR_PR22_SHADOW_DEVELOPMENT_RECORD_ONLY`.
Damit darf die vorhandene PR22-Coordination-Admission nur im
`BEREIT_NO_WRITE`-/Shadow-Pfad weiterentwickelt werden. `send_cm`-Authority,
Gameplay-/Raw-Write-/NormalRuntime-Authority und produktive PR22-
Ratifizierung bleiben geschlossen.

Die Boundary selbst veraendert weder Repository noch Control-Plane.

## PR22-Coordination-Development-Preflight-Boundary

Vor produktiver PR22-Evidence wird zunaechst nur ein korreliertes
NO-WRITE-Development-Szenario vorbereitet. Der Preflight revalidiert den
PR22-Development-Handoff, dessen gepinnten Main und den Repository-Zustand
PR21=`COMPLETE`, PR22=`IN_PROGRESS`, `currentStage=PR22`.

Anschliessend werden die bereits vorhandene
`pruefePr22CoordinationShadowAdmission(...)` und der
`bewertePr22ShadowWorkflow(...)` wiederverwendet. Erfolg verlangt eine
`BEREIT_NO_WRITE`-Admission und einen initialen Workflowzustand
`ACK_AUSSTEHEND` mit identischer Message-/Workflow-Bindung.

Der Preflight sendet keine CM-Nachricht, startet keine externe Runtime und
erteilt keine produktive PR22-, Gameplay-, Raw-Write- oder NormalRuntime-
Authority. Produktive Evidence und separate Ratifizierung bleiben spaeter
eigenstaendige Gates.

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
