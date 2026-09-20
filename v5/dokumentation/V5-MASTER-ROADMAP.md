# V5 Master-Roadmap v3

**Status:** ACTIVE MASTER PLAN  
**Stand:** 2026-09-19  
**Ziel:** Ein langfristig wartbarer, modularer, erweiterbarer und sicher recoverbarer 24/7-Autonomie-Bot fuer Adventure Land.

## 0. Grundsatz

Das Ziel ist nicht, Fehler magisch auszuschliessen. Das Ziel ist ein System, in dem Fehler:

1. moeglichst vor der Ausfuehrung verhindert werden;
2. sofort erkannt werden;
3. keine fachfremden Bereiche mitreissen;
4. keine irreversiblen Doppelaktionen erzeugen;
5. reproduzierbar erklaert werden koennen;
6. nach Restart/Disconnect sicher reconciliiert werden;
7. durch Guards, Tests und Zertifizierung nicht unbemerkt wiederkehren.

**Keine Phase wird nur deshalb freigegeben, weil "es funktioniert".** Sie wird erst freigegeben, wenn ihre Invarianten beweisbar eingehalten werden.

### Verbindliche Sprache und Narrensicherheit

Der Standard `DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md` ist fuer V5 bindend.

- Alle von uns kontrollierten Funktionen, Typen, Variablen, Zustaende, Ereignisse, Fehlergruende, Capabilities, Workflows, Transaktionen, Schemafelder, internen Protokollfelder, Ordner und Dateien verwenden deutsche Fachbegriffe.
- Englische/externe Namen sind nur an unvermeidbaren Systemgrenzen erlaubt und werden dort sofort normalisiert oder gekapselt.
- V4-Narrensicherheit ist nur das Mindestniveau. V5 verwendet Default-Deny, typisierte Freigaben, Live-Revalidierung, Persist-before-action, Ergebnisnachweis, Reconciliation und negative Bypass-Tests als Mehrfach-Verriegelung.
- Fuer riskante Mutationen soll kein einzelner Fach-/Planungsfehler allein bis zum Game Write reichen.

## 1. Ausgangslage

Aktueller Wissensstand:

- V3: 535 auditierte Dateien, 205 Tests als Fehler-/Verhaltenswissen.
- V3-Fehlerkatalog: 30 strukturelle Fehlerklassen.
- V4: 55 Architektur-Invarianten als Mindestbasis.
- V5 Knowledge Base: 38 Facts, 38 offene Fragen.
- Von 38 offenen Fragen: 24 P0, 7 P1, 7 P2.
- Action Contracts: 60 erfasst; 53 gegen den offiziellen Repo-Snapshot verifiziert, 6 gegen den aktuell deployten offiziellen Live-Clientcontract verifiziert, 1 (`cave_buy`) wegen nicht öffentlich belegbarer interner Transportsemantik explizit für Automation gesperrt.
- P0-01 bis P0-07 sind DONE.
- Adventure Land kann Production vor dem oeffentlichen Source-Snapshot bewegen; Live-MCP/Live-Daten haben fuer Contract-Revalidierung Vorrang.
- Fuer V5 steht eine dedizierte 1-TB-SSD als lokales Adventure-Land-Datenfundament zur Verfuegung; Standardwurzel ist `D:\\AdventureLand-V5`.

**Konsequenz:** Noch kein V5-Gameplay-Runtime-Code.

## 2. Unveraenderbare Architekturform

```text
Knowledge / Definitions
  -> Observed Evidence
  -> Reconciled World Truth
  -> Demand / Goal
  -> Planning
  -> Workflow
  -> Scheduler
  -> Authority + Resource + Action-Channel Admission
  -> Transaction Intent / Journal
  -> Execution Adapter
  -> Server Result
  -> Postcondition Observation
  -> Commit | Unknown | Reconcile | Failed-Safe
```

Definition, Beobachtung, Reconciliation, Planung und Execution duerfen nicht in einer God-Class verschmelzen.

### 2.1 Lokales Datenfundament und Speicher-Tiering

Der Vertrag `LOKALES-SSD-DATENFUNDAMENT.md` ist verbindlich.

Grundmodell:

```text
HOT  = RAM: aktueller World/Character State, Scheduler, Locks, aktive Workflows/Transaktionen
WARM = SSD: Journale, Checkpoints, Evidence, Replay, aktuelle Historien, aggregierte Telemetrie
COLD = SSD verdichtet: alte Replays, Testlaeufe, Zertifizierung, Langzeitstatistik
```

Regeln:
- CPU/RAM bleiben fuer Entscheidungen und zeitkritische Runtime-Arbeit zustaendig; die SSD ersetzt kein Arbeitsgedaechtnis.
- normale Combat-, Movement-, Scheduling- und Execution-Entscheidungen duerfen keinen SSD-Roundtrip benoetigen;
- nichtkritische Persistenz laeuft ueber bounded asynchrone Writer mit Batching, Backpressure und Telemetrie;
- kritische Intents muessen vor irreversibler/wertveraendernder Mutation durable persistiert sein;
- grosse Historien bleiben auf SSD; Hintergrund-Aggregatoren publizieren kompakte Working Sets in RAM;
- Speicherort oder Persistenz verleihen niemals Gameplay-Autoritaet;
- mindestens 15 Prozent SSD-Sicherheitsreserve bleiben standardmaessig frei; Datenklassen erhalten eigene konfigurierbare Budgets;
- bei Speicherdruck werden zuerst Cache, Rohtelemetrie, alte Replays/Testdaten und Cold Data reduziert; ungeklärte Journale werden niemals still geloescht;
- kann kritische Persistenz nicht mehr garantiert werden, werden neue wertveraendernde Mutationen fail-closed gesperrt;
- `D:\\` ist nur Standard-Laufwerksbuchstabe; produktiv wird zusaetzlich eine persistente Volume-/Datentraegeridentitaet geprueft;
- die Windows Bridge bleibt auf den konfigurierten Live-Wissenspfad begrenzt und spiegelt keine Runtime-, Replay-, Telemetrie- oder Learning-Massendaten nach GitHub.

## 3. Globale Stop-Regeln

Eine neue Phase oder neue Live-Autoritaet ist gesperrt, wenn mindestens eines gilt:

- offene P0-Frage betrifft den geplanten Contract;
- verwendeter Action Contract ist nicht verifiziert;
- ein Source-/Live-Drift ist ungeklaert;
- direkte Game Writes existieren ausserhalb der Execution Adapter;
- eine mutierende Capability besitzt mehr als einen Owner;
- Persistenzmigration ist nicht getestet;
- ein irreversibler Side Effect besitzt keinen Journal-/Verifier-/Reconcile-Contract;
- Retry ist unbounded;
- ein Workflow kann an unsicherer Stelle preempted werden;
- Recovery kann nur durch "noch einmal senden" funktionieren;
- ein kritischer Queue-/History-/Recorder-Pfad ist unbounded;
- Operator-Deny oder Kill-Switch kann umgangen werden;
- Shadow/Replay zeigt unerwartete Game Writes;
- Test-, Fault- oder Certification-Evidence fehlt;
- PR-Head ist nicht exakt verifiziert oder Branch ist hinter aktuellem `main`;
- `v5/bereitschaft/laufzeit-bereitschaft.json` meldet nicht `FREIGEGEBEN`, sobald echter V5-Runtime-Code begonnen werden soll;
- der strenge Entwicklungs-Wissensgate ist fuer echte Implementierung nicht gruen;
- der letzte Wissenswaechterlauf ist fuer Implementierung aelter als 180 Minuten;
- eine fuer die Domaene relevante offizielle Quelle ist unbewertet gedriftet, fehlerhaft oder gekuerzt;
- der Implementierungsbranch enthaelt nicht den aktuellen `main` inklusive letzter Knowledge-Commits;
- kritische Persistenz kann wegen SSD-/Dateisystemfehler, falschem Volume oder zu geringem Reserveplatz nicht durable garantiert werden.

## R0 – Lebende Wissensbasis

**Status:** DONE – laufend gepflegt. Der automatische Wissenswaechter wird parallel als Host-Erweiterung nach dem verbindlichen Wissenswaechter-Vertrag aufgebaut, ohne Gameplay-Autoritaet.

Ziele:
- immutable Roh-Snapshots;
- stabile Wissens-IDs;
- Source Provenance;
- Confidence/Volatility;
- Revalidation;
- Supersede statt stilles Ueberschreiben;
- offene Fragen;
- maschinenlesbare Contracts.

Exit Gate:
- Knowledge-Validator gruen;
- Drift-/Revalidation-Prozess dokumentiert;
- Live Truth darf stale Snapshot fuer Execution ueberstimmen.

## R1 – Research Closure vor Runtime

**Status:** DONE.

### R1.1 P0 – vor finalen Core Contracts

1. Action-Contract-Matrix vervollstaendigen.
2. Recovery-Semantik je Action inklusive UNKNOWN.
3. Bank-Concurrency eigener Characters.
4. Trade Listing Lifecycle, RID, Partial Sale.
5. Upgrade-/Compound-Formeln, Resultcodes, Restart-/Disconnect-Semantik.
6. Exchange-/Craft-Sonderfaelle und Outputspace.
7. Request-/Call-Cost-/Rate-Limit-Modell.

### R1.1 Abschlussstand

- P0-01: 60/60 wertrelevante Actions sind verifiziert oder explizit disabled.
- P0-02: 60/60 Actions besitzen genau einen Recovery Contract; Same-Intent-Retry nach moeglichem Send ist verboten.
- P0-03: Adventure Land erzwingt einen accountweiten Single-Bank-Mount. V5 modelliert deshalb genau eine `account:bank` Lease im Account Coordinator, gehalten ueber die gesamte Banksitzung. Jeder Raw Bank Write benoetigt zusaetzlich den lokalen `bank`-Action-Channel des Lease-Owners. Disconnect/Crash gibt die Lease nicht automatisch frei; `bank_opx`/already_in_bank ist ein externes Fence; BankSnapshots sind Mount-/Lease-Epoch-gebunden.
- P0-04: DONE – RID schützt Listing-Replacement, rotiert aber nicht bei Partial Fill; `trade_sell` nutzt serverseitige physische Itemauswahl.
- P0-05: DONE – Upgrade/Compound sind mehrphasige Werttransaktionen; q/Placeholder bedeutet accepted in-flight, Outcome kann vor Timerende feststehen, `upgrade_fail` ist pfadabhängig und Compound-Failure verliert alle drei Inputs.
- P0-06: DONE – Outputspace ist Transaction Safety; Exchange besitzt Multi-Domain-/rekursive Rewards, Craft getrennte Normal-/Anniversary-Pfade und Dismantle einen speziellen Drei-Output-Compound-Pfad.
- P0-07: DONE – character-globales gewichtetes Socket-Budget, 200/4000-ms-Servergrenze, konservatives 100/4000-ms-V5-Planbudget, Deferred-/Safeties-/MCP-/CPU-Trennung und limitdc-Recovery sind formalisiert.

### P0-05 Upgrade/Compound
- `calculate=true` ist serverseitige Preview ohne Mutation;
- echter Start konsumiert Consumables/Inputs vor Timerende und erzeugt q/Placeholder;
- der Outcome-Zweig kann serverseitig bereits vor q-Abschluss feststehen;
- `upgrade_fail` ist pfadabhaengig: normaler Scroll kann vernichten, `scroll4` und Material-Offering-Failure erhalten das Item;
- pscroll und Offering-only besitzen eigene nicht-Level-Postconditions;
- Compound-Failure verliert alle drei Inputs; Success liefert einen terminal zu beobachtenden Output;
- Booster-Compound kann ueber rekursive 12%/6%/3%... Procs mehrere Extra-Level erhalten;
- Preview-Threshold wird wegen Grace-/Slot-Roll-Mechanik nicht als zeitlose vollstaendige effektive Wahrscheinlichkeit behandelt.

### P0-06 Exchange/Craft/Outputspace
- generischer `add_item`-Overflow ist kein geplanter V5-Kapazitaetsmechanismus;
- Exchange ist Multi-Phase und kann Inventory, Gold, Shells, Cosmetics, Empty oder rekursive Rewards erzeugen;
- Public `exchange().reward/num` ist nur Teil-Evidence;
- rekursive Drop-Graphs muessen bounded/versioniert sein;
- `exchange_buy` pinnt den exakten Token-Stack samt kompletter q;
- Normal Craft pinnt exakte Single-Stack-Inputs; aktuelle Recipes besitzen keine Duplicate-Ingredient-Namen;
- Anniversary Craft ist ein separater trusted Multi-Stack-Pfad;
- Leveled-Compound-Dismantle erzeugt drei Level-1-Kopien und wird von V5 strenger als vom Server gegen Lock/Value geschuetzt;
- probabilistische Dismantle-Ausgaben werden fuer Outputspace konservativ als moegliche Outputs behandelt.

### P0-07 Call Cost / Rate Limits
- `character:socket_call_budget` ist global ueber alle Action-Channels eines Characters;
- Server-Evidence: 200 gewichtete Punkte / 4000 ms; V5-Policy initial 100 / 4000 ms plus 100 Reserve;
- Requestkosten sind gewichtet und koennen statische, dynamische und interne Zusatzkosten enthalten;
- mutierende FIFO-Channels: maximal ein managed In-Flight-Request je Channel;
- `limitdc` nach moeglichem Send => UNKNOWN/Reconcile statt Blind-Retry;
- Client-Safeties bleiben aktiviert;
- externe MCP-Token-Buckets und Mainframe-Worker-CPU bleiben getrennte Ressourcen/Metriken;
- `ccreport` ist Diagnose-Evidence, kein Scheduler-Tick-Polling;
- Cost-Drift blockiert betroffene Automation bis zur Revalidierung.

P0 Exit Gate:
- jede wertveraendernde Public Function hat einen verifizierten Contract oder bleibt explizit disabled;
- jede verifizierte Action besitzt Recovery-Klasse und Postcondition;
- keine "unknown live" Action wird automatisiert;
- offene P0-Fragen blockieren nicht mehr die Kernvertraege.

### R1.2 P1A – vor Multi-Character Merchant

- CM delivery/retry;
- server-local constraints;
- Character liveness/freshness;
- Restart/Reload-Verhalten der Kommunikationspfade.

### R1.3 P1B – vor autonomem Party/Combat

- Party freshness/liveness;
- Skill-/Cooldown-Matrix live;
- Aggro/Threat/CC;
- death/respawn/rejoin;
- Group-composition capability calculation.

### R1.4 P2 – vor World Autonomy

- vollstaendiger Mapgraph;
- Spawn-Packs;
- Event State Machines;
- Quests;
- Rare/Boss Discovery;
- Server Hopping;
- PvP/Hardcore Policies.

## R2 – V5-Verfassung + V3/V4-Migrationsmatrix

**Status:** DONE.

Noch kein Gameplay-Code.

Lieferobjekte:
- alle 55 V4-Invarianten einzeln re-ratifizieren oder begruendet verschaerfen;
- neue V5-Invarianten fuer Action Channels, UNKNOWN, Drift, Fencing, Determinismus und Protocol Versioning;
- V3/V4-Komponentenmatrix: `PORTIEREN | UMBAUEN | NEU_BAUEN | NUR_WISSENSQUELLE | VERWERFEN`;
- Modul-/Port-/Layer-Abhaengigkeitsgraph;
- Threat-/Failure-Modell;
- Naming/Schema/Versioning-Konventionen;
- vollstaendige deutsche V5-Domaenensprache gemaess `DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md`;
- Migrationsplan fuer bestehende eigene englische V5-Schema-/Statusbezeichner vor Runtime-Nutzung;
- Mehrfach-Verriegelungs-Invarianten fuer riskante Mutationen;
- 99+ kanonische Anforderungen und Nachverfolgbarkeit ratifiziert;
- Gefahrenkatalog und Rest-Risiko-Regel ratifiziert;
- kritische Zustandsautomaten ratifiziert;
- Wissenswaechter-/Git-Sicherheitsvertrag ratifiziert;
- Persistenz-, Determinismus-, Security-, Operator-, Fehlerdomaenen- und Simulatorstrategie ratifiziert;
- formales Laufzeit-Bereitschaftsgate vorbereitet;
- Entwicklungs-Wissensgate und bewertete Quellenhash-Baselines ratifiziert;
- Zugriffspfad `manifest -> laufende Datenbank -> strukturierte Wissensbasis -> Evidence` verbindlich;
- spaeterer read-only `WissensZugriffPort` und WissensSnapshot-Pinning festgelegt;
- ADR-Regeln;
- lokales SSD-Datenfundament mit HOT/WARM/COLD-Tiering, Speicherbudgets, Retention, Volume-Identitaet und I/O-Backpressure ratifiziert.

Mindestens neue V5-Regeln:
- Action Channel ist eine Ressource.
- UNKNOWN ist kein normales FAILURE.
- Lange Leases brauchen Epoch/Fencing Token.
- keine Definition- und Live-Truth im selben State-Modell.
- Clock und Randomness sind injizierbar/deterministisch.
- jede langlebige Nachricht besitzt Protocol-Version, ID, TTL und Dedupe-Semantik.
- Drift kann Capability automatisch auf QUARANTINED setzen.
- jede Live-Capability besitzt Disable-/Rollback-Pfad.
- Speicherort/Persistenz ist niemals Authority.
- Nichtkritisches SSD-I/O darf den Gameplay-Hot-Path nicht blockieren.
- Kritische Mutation darf erst nach bestaetigter durable Intent-Persistenz gesendet werden.

Exit Gate:
- keine ungeklärte Kernownership;
- keine zyklische Layer-Abhaengigkeit;
- alle 30 V3-Fehler haben eine strukturelle Gegenmassnahme in Roadmap/Verfassung;
- deutsche Domaenensprache und erlaubte externe Ausnahmen sind abschliessend festgelegt;
- kritische Zustaende sind geschlossene, fail-closed Modelle;
- Mehrfach-Verriegelung fuer hohe Risiken ist verbindlich;
- Wissenswaechter ist als Evidence-System ohne Gameplay-Autoritaet abgegrenzt;
- 100-%-Deutsch-Regel fuer uebersetzungspflichtige Sichttexte ist verbindlich; Monster-Ausnahme ist exakt definiert;
- formale Vor-Runtime-Artefakte sind konsistent und der Bereitschaftsvalidator ist gruen;
- Kandidaten besitzen nachweislich keine Entwicklungs-/Gameplay-Autoritaet;
- laufende Waechterdateien sind schema-/maschinenlesbar und das Aenderungsprotokoll ist echtes JSONL;
- SSD-Datenklassen, Retention, Budgets, Sicherheitsreserve, Degradationsregeln und falsches-Volume-Verhalten sind verbindlich festgelegt.

### R2 Abschlussstand

- 55/55 V4-Invarianten einzeln ratifiziert: 28 UEBERNEHMEN, 26 VERSCHAERFEN, 1 ERSETZEN.
- 47/47 historische V3/V4-Runtime-Capabilities klassifiziert: 44 NEU_BAUEN, 1 NUR_WISSENSQUELLE, 2 VERWERFEN; keine historische Runtime-Codewiederverwendung.
- 30/30 V3-Fehlerklassen besitzen strukturelle V5-Gegenmassnahmen.
- R2-Verfassung, azyklischer Layer-/Ownership-Graph, Authority-Grenzen, Mehrfach-Verriegelung und ADR-Regeln ratifiziert.
- 119 Anforderungen und 119 Traceability-Eintraege fachlich ratifiziert; Implementierungs-/Test-/Live-Nachweise bleiben offen.
- 161 Gefahren mit Restrisiko-Regel ratifiziert; Gefahren bleiben technisch OFFEN bis zu ihrem Nachweis.
- 13 kritische Zustandsautomaten ratifiziert und unbekannte Uebergaenge fail-closed.
- deutsche Domaenenmigration fuer historische Research-Schemas und externe Boundaries festgelegt.
- Persistenz-, Determinismus-, Security-, Operator-, Failure-Domain- und Simulatorstrategie ratifiziert.
- Source-Baselines inklusive vier gedrifteter offizieller Webquellen nach unabhaengiger Source-/Live-Revalidierung bewertet.
- R2-Verfassungsvalidator ist CI-verbindlich.
- Gameplay-Runtime-Gesamtgate bleibt GESPERRT.

## R3 – Repository, Build, Guards und Host-Grenzen

**Status:** DONE.

Noch keine Gameplay-Autoritaet.

Bauen:
- V5 Source Layout;
- TypeScript strict;
- Lint/format/build;
- Dependency Guards;
- no-direct-game-write Guard;
- no-monkey-patch Guard;
- no-V3/V4-runtime-import Guard;
- secrets Guard;
- bounded-collection Guard;
- deutscher-Namensraum-Guard fuer neue V5-Runtime-Bezeichner soweit statisch pruefbar;
- Guard gegen Ausfuehrer ohne typisierte Ausfuehrungsfreigabe;
- Guard/Negativtests gegen Bypass der Mehrfach-Verriegelung;
- Host/Runtime API Allowlist;
- Feature/Capability Flags default-off;
- CI auf exaktem Head;
- ADR-/Schema-/Knowledge-Pruefungen;
- Entwicklungs-Wissensgate in CI;
- Quellenhash-Drift-Gate;
- Guard gegen direkten Runtime-Zugriff auf Roh-Snapshots;
- Testlabor-/Replay-Grundgeruest mit deterministischem Aufzeichnungsformat;
- Host-seitige SSD-/Volume-Erkennung und Speicher-Gesundheitsprobe;
- bounded asynchrone Writer-Grundlage fuer nichtkritische Aufzeichnungen;
- Guards gegen beliebige Fachmodul-Dateizugriffe ausserhalb typisierter Speicherports.
Host-Regel:
- Host startet/stoppt/ueberwacht Prozesse und transportiert Daten.
- Host besitzt keine Gameplay-Policy.
- kein generisches remote `eval`.

Exit Gate:
- Guards schlagen in absichtlichen Negativtests sicher fehl;
- neue V5-Runtime-Bezeichner halten die deutsche Domaenensprache ein;
- mutierende Capabilities sind default-off und nicht ohne typisierte Freigabe erreichbar;
- leere V5 Runtime kann headless starten/stoppen ohne Gameplay Writes;
- strenger Wissensgate blockiert stale/gedriftete/unfreigegebene Wissensgrundlagen;
- falsches/fehlendes SSD-Volume und unterschrittene kritische Speicherreserve werden erkannt;
- asynchrone Writer koennen den Hot Path nicht unbounded rueckstauen.
### R3 Abschlussstand

- isoliertes V5-Paket mit exakt gepinntem TypeScript und Lockfile;
- strikter Build, Typecheck, Stil-/Static-Guards und CI auf exaktem Head;
- absichtliche Negativtests fuer Legacy-Imports, Monkey-Patches, Raw Writes, direkte FS-/Netzwerkzugriffe, Roh-Snapshots, unbounded Collections, Secrets und generische Host-Aufrufe;
- mutierende Faehigkeiten default-off; typisierte Mehrfach-Verriegelungsfreigabe mit Einzel-Bypass-Negativtests;
- leere Headless-Grundlage startet/stoppt mit fest 0 Gameplay-Writes;
- deutscher Sichttextguard inklusive exakt begrenzter Monster-Originalnamen-Ausnahme;
- enge Host-API-Allowlist ohne Gameplay-/Raw-Write-Autoritaet;
- Wissenswaechter schreibt nicht mehr direkt auf main, sondern auf einen pfadbegrenzten Knowledge-Branch mit validiertem PR-Pfad;
- Git-SHA-/Lock-/Schema-/Konfigurationsgebundene Build-Provenienz;
- deterministische bounded Replay-Aufzeichnung als Testlabor-Grundgeruest;
- Windows D:-SSD-/Volume-Pruefung und 15-Prozent-Speicherreserve fail-closed;
- bounded asynchroner Writer fuer nichtkritische Aufzeichnungen;
- Fachcode-Dateisystemzugriff nur ueber spaetere typisierte Persistenzadapter;
- R3-Abschlussmanifest: `v5/roadmap/r3-abschluss.json`;
- klassischer GitHub-main-Branch-Protection-Status konnte ueber die installierte Integration nicht gelesen werden und wird daher nicht als bewiesen behauptet;
- Gameplay-Runtime-Gesamtgate bleibt GESPERRT.

## R4 – Deterministischer Core

**Status:** DONE.

Bauen:
- `ClockPort`;
- `RandomnessPort`;
- ID-/Sequence-Generator;
- typed Result/Failure/Unknown;
- Correlation/Causation IDs;
- immutable Domain Events;
- PriorityClass;
- Deadline/TTL/Freshness Primitive;
- bounded collections;
- deterministic serialization;
- deterministisches Replay-/Aufzeichnungsformat fuer fruehe Evidence.

Regel:
- keine Fachlogik verwendet direkt `Date.now()` / `Math.random()`, wenn Determinismus relevant ist.

Exit Gate:
- gleiche Inputs + gleiche Clock/Seed -> identischer Plan/Eventstrom.

### R4 Abschlussstand

- injizierbare Ports fuer Uhr, Zufall, Kennungen und Sequenzen;
- deterministische Referenzimplementierungen fuer simulierte Uhr, XorShift32-Zufall, IDs und monotone Sequenzen;
- explizite Fachresultate `ERFOLG | FEHLER | UNBEKANNT`;
- Deadline-, TTL- und Freshness-Primitiven;
- stabile Prioritaetsklassen;
- harte bounded Queue und bounded Replay-Aufzeichnung;
- kanonische deterministische Serialisierung;
- immutable Domaenenereignisse mit Ereignis-, Korrelations- und Kausalitaetskennung;
- generischer geschlossener Zustandsautomatenkern;
- 13/13 ratifizierte Zustandsautomaten vollstaendig erreichbar, fail-closed und ohne unbeabsichtigte Sackgassen;
- direkte `Date.now()`-/`new Date()`-/`Math.random()`-Nutzung im Fachkern statisch gesperrt;
- deterministischer Szenario-/Replay-Lauf mit Build-, WissensSnapshot- und Konfigurationsprovenienz;
- 6/6 R4-MUSS-Anforderungen technisch nachgewiesen;
- 4/4 R4-Fitnessregeln technisch erfuellt;
- `ZUSTANDSMASCHINEN_BEREIT=true` und `TESTSTRATEGIE_BEREIT=true`;
- R4-Abschlussmanifest: `v5/roadmap/r4-abschluss.json`;
- Gameplay-Runtime-Gesamtgate bleibt GESPERRT.

## R5 – Persistenz, Journal und Schema-Evolution

**Status:** DONE.

Bauen:
- `PersistenzPort`;
- `TransaktionsJournalPort`;
- `CheckpointSpeicherPort`;
- `LiveWissensSpeicherPort`;
- `ReplaySpeicherPort`;
- `TelemetrieSpeicherPort`;
- `ZertifizierungsEvidencePort`;
- `SpeicherGesundheitsPort`;
- schema-versionierte Records;
- migrations;
- corrupt/oversized/unreadable fail-closed;
- append-only Transaction Journal;
- persistent workflow checkpoints;
- processed-evidence/dedupe cursor;
- outbox/inbox fuer kritische externe Zustellung;
- retention/compaction;
- crash-safe write order;
- bestehender `LiveWissensSpeicherPort` fuer die lokale SSD-Datenbank auf `D:\\AdventureLand-V5\\wissensdatenbank`;
- atomarer `SCHREIBT -> BEREIT`-Generationswriter fuer Live-Wissen;
- bounded Dateianzahl/Dateigroesse und Disk-Full-/Zugriffsfehlerbehandlung;
- Datenklassenbudgets, Rotation, Retention, Kompression und Deduplizierung;
- standardmaessig mindestens 15 Prozent freie SSD-Sicherheitsreserve;
- priorisierte I/O-Klassen: kritische Persistenz vor Evidence, Replay, Telemetrie und Cache;
- asynchrones Batch-I/O fuer nichtkritische Daten mit bounded Queue und Backpressure;
- Volume-Identitaetspruefung statt blindem Vertrauen auf Laufwerksbuchstaben;
- kein stiller Fallback kritischer Persistenz auf das Windows-Systemlaufwerk.
Pflicht:
`persist intent -> send action -> observe -> commit/reconcile`

Exit Gate:
- Crash an jedem Persistenzpunkt ist fault-injected;
- Migration forward/backward/unsupported-version getestet;
- kein blind resume;
- Journal-durable-before-action ist fault-injected;
- Speicherdruck degradiert nichtkritische Recorder vor kritischer Persistenz;
- Disk Full/Access Denied/I/O-Fehler/falsches Volume koennen keine wertveraendernde Mutation ohne sicheren Intent zulassen.
### R5 Abschlussstand

- 10 typisierte Persistenz-/Journal-/Checkpoint-/Wissens-/Replay-/Telemetrie-/Evidence-/Gesundheits-/Dedupe-/Zustellungsports;
- append-only Transaction Journal und durable Intent vor spaeterer Mutation;
- Restart startet nichtterminale Checkpoints ausschliesslich mit `ABGLEICH_ERFORDERLICH`;
- Forward-/Backward-/Unsupported-Schema-Migration und kritisches JSON fail-closed;
- restartfeste Dedupe-Claims sowie durable Inbox/Outbox;
- lokaler Live-Wissensspeicher auf `D:\\AdventureLand-V5\\wissensdatenbank` mit `SCHREIBT -> BEREIT`, fsync und atomarem Rename;
- Disk-Full-/Access-Denied-/Read-only-/I/O-Fehler klassifiziert;
- D:-SSD, stabile Volume-ID und mindestens 15 Prozent Reserve fail-closed;
- kein stiller Fallback auf C:;
- bounded Retention und Speicherdruck-Degradation nichtkritischer Daten vor kritischer Persistenz;
- 8/8 R5-MUSS-Anforderungen technisch nachgewiesen und 8/8 Traceability vollstaendig;
- R5-Fitnessregel technisch erfuellt;
- `PERSISTENZMODELL_BEREIT=true`;
- R5-Abschlussmanifest: `v5/roadmap/r5-abschluss.json`;
- Gameplay-Runtime-Gesamtgate bleibt GESPERRT;
- lokales Deployment einer offenbar alten Windows-Bridge-Binary bleibt als Betriebsblocker offen.

## R6 – Observation, Evidence und Reconciled World Truth

**Status:** DONE.

Bauen:
- Definition Truth Adapter;
- Character Observation;
- Entity Observation;
- Inventory Observation;
- Bank Observation;
- Party/Server/Event Observation;
- Evidence Schema mit Source/ObservedAt/Freshness/Confidence/Version;
- Item Identity Resolver;
- Entity Resolver;
- Drift Monitor;
- Reconciled World Truth;
- bounded lokale Roh-/Observation-Evidence fuer Replay und spaetere Analyse;
- Hintergrund-Aggregation grosser SSD-Historien zu kompakten RAM-Working-Sets;
- versionierte Learning-Evidence ohne Gameplay-Autoritaet.
Regeln:
- Inventory Slot ist keine langlebige Identitaet.
- Entity-Objekt ist keine langlebige Identitaet.
- Persisted knowledge ist Planning Evidence, keine Execution Authority.

Exit Gate:
- stale Snapshot kann keine Mutation autorisieren;
- G-/MCP-Drift kann betroffene Capability quarantainen;
- normale Observation/Planning-Hot-Paths benoetigen keine Vollscans grosser SSD-Historien;
- persistierte Roh-Evidence und LIVE_VERIFIZIERT bleiben technisch und semantisch getrennt.
**R6-Abschlussstand:** 13/13 MUSS-Anforderungen, 13/13 Traceability und 7/7 Fitnessregeln sind nachgewiesen. Der deutsche produktive Anzeigekatalog ist fuer den aktuellen Snapshot vollstaendig: 129 Skills inklusive Beschreibungen, 7 Klassen, 628 Item-Quellvorkommen/626 effektive IDs, 135 NPCs, 11 Events, 12 Quests, 60 Aktionen, 102 Statuswerte und 129 Monster. Persistiertes Wissen bleibt Evidence ohne Gameplay-Autoritaet. Das Gameplay-Runtime-Gesamtgate bleibt GESPERRT. Maschinenlesbarer Abschluss: `roadmap/r6-abschluss.json`.

## R7 – Module, Capabilities, Ports und Authority

**Status:** DONE.

Maschinenlesbarer Abschluss: `roadmap/r7-abschluss.json`.

Das Gameplay-Runtime-Gesamtgate bleibt auch nach R7 `GESPERRT`.

Bauen:
- Module Registry;
- Capability Registry;
- READ/PLAN/MUTATE Modes;
- Single Owner fuer jede mutierende Capability;
- typed Ports;
- lifecycle/health;
- activation/deactivation;
- versioned provider replacement;
- Operator Policy;
- Kill Switch.

Exit Gate:
- doppelter mutierender Provider wird technisch verhindert;
- Module koennen ersetzt werden, ohne fremde Implementierung zu patchen.

## R8 – Workflow Scheduler und Resource Manager

**Status:** DONE.

Maschinenlesbarer Abschluss: `roadmap/r8-abschluss.json`.

Das Gameplay-Runtime-Gesamtgate bleibt auch nach R8 `GESPERRT`.

Bauen:
- Workflow Contract;
- explizite Phasen;
- PriorityClass + numeric priority;
- Deadline;
- Aging/Fairness;
- Safe Preemption;
- deterministic Lock Ordering;
- Leases + Fencing;
- Resource locality;
- blocked-until/backoff;
- scoped Circuits;
- retry/action budgets.

Ressourcen mindestens:
- account;
- character;
- movement;
- inventory;
- equipment;
- bank;
- gold/currency;
- trade slot/RID;
- action channel;
- item handle;
- party lifecycle;
- production intent.

Exit Gate:
- kein Lock-Stealing;
- keine unsafe Preemption;
- Deadlock-/Starvation-Property-Tests gruen.

## R9 – Admission und Execution Kernel

**Status:** DONE.

Maschinenlesbarer Abschluss: `roadmap/r9-abschluss.json`.

Das Gameplay-Runtime-Gesamtgate bleibt auch nach R9 `GESPERRT`.

Nur hier duerfen rohe Adventure-Land-Mutationen entstehen.

Vor jeder Action:
1. Capability verfuegbar?
2. Owner korrekt?
3. Workflow aktiv?
4. Deadline/Freshness gueltig?
5. Live Preconditions frisch?
6. Locks/Fencing gueltig?
7. Circuit/Budget erlaubt?
8. Operator Policy erlaubt?
9. Content Contract verifiziert?
10. Idempotency/Journal vorbereitet?

Bauen:
- Action Channel Serialization;
- ActionContract Registry;
- Execution Adapter pro Familie;
- typed Server Result;
- Timeout/Disconnect -> UNKNOWN;
- keine Domain-Policy im Adapter.

Exit Gate:
- direct write guard = 0 Ausnahmen ausser Execution;
- 100% mutierende Adapter besitzen Contract + Verifier + Recovery Class.

## R10 – Reconciliation und Recovery Kernel

**Status:** DONE.

Maschinenlesbarer Abschluss: `roadmap/r10-abschluss.json`.

Das Gameplay-Runtime-Gesamtgate bleibt auch nach R10 `GESPERRT`.

Bauen:
- Reconcile Contract;
- Restart Loader;
- UNKNOWN state machine;
- Postcondition evaluators;
- domain settlement;
- partial completion handling;
- operator-required path;
- bounded recovery;
- stop/shutdown protocol.

Erlaubte Ergebnisse:
- COMMITTED;
- ABORTED;
- REPLAN_ALLOWED;
- FAILED_SAFE;
- OPERATOR_REQUIRED.

Verboten:
- `timeout -> retry same mutation`;
- `restart -> resume RUNNING`.

Exit Gate:
- Disconnect nach moeglicher Mutation fuer jede Action-Familie fault-injected;
- duplicate irreversible effects = 0.

## R11 – Testlabor-Ausbau, Replay, Observability und Operations

**Status:** DONE.

Maschinenlesbarer Abschluss: `roadmap/r11-abschluss.json`.

Das Gameplay-Runtime-Gesamtgate bleibt auch nach R11 `GESPERRT`.

Das in R3/R4 begonnene Testlabor wird hier zum vollstaendigen Operations- und Zertifizierungsinstrument ausgebaut.

Bauen:
- deterministic simulator;
- golden replay fixtures;
- property-based tests;
- model/state-machine tests;
- fault injection;
- structured telemetry;
- decision trace;
- metrics;
- bounded logs/history;
- persistent critical-alert spool;
- health/readiness;
- headless supervisor;
- crash/restart harness;
- SSD-I/O-Metriken fuer Latenz, Durchsatz, Queue-Tiefe, Backpressure, freien Speicher und Recorder-Drops;
- Retention-/Rotation-/Kompressions-Harness;
- Replay aus echten bounded Observation-Aufzeichnungen.
Teststufen:
Static -> Unit -> Property -> Model -> Replay -> Fault -> Integration -> Shadow -> Controlled Live -> Soak.

Exit Gate:
- jeder Kernelpfad ist reproduzierbar;
- jede Action erklaert Why/Owner/Evidence/Locks/Expected Outcome;
- GUI-Ausfall beeinflusst Gameplay nicht.

## R12 – Vertical Slice 0

**Status:** DONE.

Shadow-End-to-End = BESTANDEN mit 0 unerwarteten Game Writes. Controlled Live = BESTANDEN mit exakt einer `AL-ACTION-EQUIP`/`equip`-Mutation, 0 unerwarteten Writes, keinem Same-Intent-Retry und bestaetigter Postcondition. Die breite Runtime bleibt `GESPERRT`.

Maschinenlesbare Live-Evidence: `roadmap/r12-controlled-live-evidence.json`.  
Maschinenlesbarer Abschluss: `roadmap/r12-abschluss.json`.

Erster minimaler End-to-End-Pfad.

Reihenfolge:
1. read-only observation;
2. plan;
3. workflow;
4. locks;
5. journal;
6. eine reversible/gering riskante Action;
7. server result;
8. postcondition;
9. commit;
10. restart reconciliation;
11. shadow;
12. controlled live.

Noch kein breiter Merchant/Combat.

Exit Gate:
- kompletter Architekturpfad ohne Sonderumgehung;
- Replay deterministisch;
- Fault Injection gruen;
- null unerwartete Game Writes.

## R13 – Merchant Core A: Single-Character Economy

**Status:** DONE.

Merchant Core A ist als Planning-/Ledger-/Evidence-/Koordinationskern abgeschlossen. Zentrale Gegenstandsdisposition, konkrete physische Reservierungen, Workspace-/Capacity-Preflight, Gold-/Budget-Ledger, accountweite Bank-Lease/Fencing mit Restart-Reconciliation, frische RID-/Mengen-Evidence und der reale trade_sell-Serverscan sind technisch nachgewiesen. Der Core enthaelt keine neuen Raw Game Writes; die breite Runtime bleibt `GESPERRT`.

Maschinenlesbare Abdeckung: `grundlage/vertraege/r13/merchant-core-abdeckung.json`.  
Maschinenlesbarer Abschluss: `roadmap/r13-abschluss.json`.

Merchant bleibt erste grosse Domaene.

Bauen in dieser Reihenfolge:
1. Inventory Ledger / Disposition;
2. Workspace/Capacity Manager;
3. Gold-/Budget Ledger;
4. Merchant Demand Inbox;
5. Merchant Workflow Provider;
6. Bank observe/plan;
7. Bank store/retrieve/consolidate;
8. NPC buy/sell;
9. Stand state/listings;
10. Market observation;
11. Player-market buy/sell nach P0-04.

Keine Operation entscheidet selbst, was ein Item "bedeutet". Alle lesen zentrale Disposition/Reservation.

Exit Gate:
- Inventory/Bank invariants = 0 Verletzungen;
- kein falscher Verkauf;
- kein Doppeltrade;
- kein Starvation;
- Restart waehrend jeder Merchant-Phase reconciliert.

## R14 – Multi-Character Coordination Foundation

**Status:** DONE.

P1A ist geschlossen. CM-Dedupe/TTL, bounded Retry mit gleicher Nachrichten-ID, ACK/Settlement-Korrelation, server-lokale Bindung, Roster-/Session-Epochen, Liveness und Restart-Fencing sind technisch nachgewiesen. Account Coordinator und Character Agent bleiben getrennt und besitzen in R14 keine neue Raw-Write-Authority. Die breite Runtime bleibt `GESPERRT`.

Maschinenlesbare Abdeckung: `grundlage/vertraege/r14/multi-character-abdeckung.json`.  
Maschinenlesbarer Abschluss: `roadmap/r14-abschluss.json`.

Voraussetzung: R1.2 abgeschlossen.

Bauen:
- Account Coordinator;
- Character Agent Protocol;
- CM Envelope mit protocol_version/message_id/TTL/workflow_id/reply_to;
- inbox dedupe;
- ack/settlement;
- liveness;
- roster epoch;
- server-local constraints;
- Party Truth Grundmodell.

Exit Gate:
- duplicate/out-of-order/delayed/lost CM fault-injected;
- stale Character darf keine neue Authority erhalten.

## R15 – Merchant Core B: Supply, Gear und Production

**Status:** DONE.

Bauen:
- Supply Delivery;
- Collection;
- Rendezvous;
- Gear Allocation;
- Gear Delivery;
- Upgrade;
- Compound;
- Exchange;
- Craft;
- Production Graph;
- final Recipient Settlement;
- event-/quest-gated production mit Freshness.

Regel:
`CRAFT_COMMITTED != PRODUCTION_COMMITTED`

Exit Gate:
- Production endet nur nach finaler Empfaengerverifikation;
- q/placeholder/restart Fault Tests gruen;
- kein duplicate transfer/mutation.


R15-Abschluss: Supply/Collection/Rendezvous und Gear sind an frische Roster-/Session-/Serverziele und positive Settlement-Evidence gebunden. q/Placeholder bedeutet accepted in-flight; Restart erzwingt Reconciliation. Der Production-DAG ist bounded, zyklusfrei, ohne verwaiste Schritte, mit eindeutigen Operation-Schluesseln, Workspace-Nachweisen und frischer Event-/Quest-Evidence. Der persistente Bankkatalog bleibt Planning Evidence ohne ExecutionAuthority. Production endet erst nach finalem Recipient Settlement.

Maschinenlesbare Abdeckung: `grundlage/vertraege/r15/merchant-core-b-abdeckung.json`.  
Maschinenlesbarer Abschluss: `roadmap/r15-abschluss.json`.

## R16 – Party, Combat, Farming und Navigation

**Status:** DONE.

Voraussetzung: R1.3 abgeschlossen.

Bauen:
- Movement Owner;
- Travel Workflow + Arrival Predicate;
- anti-stuck bounded recovery;
- Combat Target Ownership;
- Skill Capability Truth;
- Combat Safety;
- Party Lifecycle;
- Group Capability Calculation;
- Farmer Objective/Lease;
- death/respawn/rejoin.

Exit Gate:
- kein stale target action;
- kein Movement Thrash;
- Party/Roster Drift wird erkannt;
- Safety preemptet normale Arbeit, niemals umgekehrt.


R16-Abschluss: P1B ist geschlossen. Movement-Return ist kein Arrival-Beweis; Moving Targets sind motion-aware freshness-gebunden; Raw Targets sind keine fachliche Ownership. Movement Ownership, Party Truth, Skill-/Shared-Cooldown-Evidence, Death/Respawn/Rejoin, Threat/CC, AoE-Hard-Caps, Encounter-Dedupe und Farmer-FSM sind bounded, restart-sicher und no-write.

Maschinenlesbare Abdeckung: `grundlage/vertraege/r16/party-combat-navigation-abdeckung.json`.  
Maschinenlesbarer Abschluss: `roadmap/r16-abschluss.json`.

## R17 – World Autonomy

**Status:** DONE.

Voraussetzung: R1.4 abgeschlossen.

Bauen:
- Map Graph;
- Spawn Pack Model;
- Event State Machines;
- Quest State Machines;
- Rare/Boss Discovery;
- server hopping policy;
- PvP/Hardcore policy;
- content discovery/quarantine.

Exit Gate:
- Event-/Quest-Drift zwischen Plan und Action wird abgefangen;
- Unknown Content fail-closed;
- Serverwechsel beruecksichtigt aktuelle Mode-/Fatigue-Regeln.


R17-Abschluss: P2 ist geschlossen. Event-/Quest-Drift wird vor Action blockiert oder replanned; Unknown Content bleibt quarantiniert, Discovery ist keine Freigabe und Server-Hopping ist an frische Registry-/Mode-/Fatigue-Evidence gebunden.

Maschinenlesbare Abdeckung: `grundlage/vertraege/r17/world-autonomy-abdeckung.json`.  
Maschinenlesbarer Abschluss: `roadmap/r17-abschluss.json`.

## R18 – Learning und Optimierung

**Status:** IN_PROGRESS.

Erst nach stabiler deterministischer Basis.

Learning darf:
- scoring;
- route choice;
- market ranking;
- target preference;
- timing suggestions;
- demand forecasts

optimieren.

Die dafuer benoetigten Rohdaten und versionierten Learning-Evidence duerfen bereits ab R6 bounded auf SSD gesammelt werden. R18 fuehrt erst die adaptive Optimierung ein; Datensammlung allein verleiht keinerlei Authority.

Learning darf niemals:
- Safety lockern;
- Authority vergeben;
- Retry-Grenzen erhoehen;
- unknown content freigeben;
- Operator Deny ueberstimmen;
- irreversible Mutation ohne deterministischen Guard ausloesen.

Exit Gate:
- deterministic fallback existiert immer;
- learning-off liefert sicheren Betrieb.

## R19 – 24/7-Zertifizierung

Jede Stufe benoetigt unveraenderliche Evidence.

Ladder:
- simulator/replay;
- fault suite;
- shadow;
- controlled live;
- canary;
- 1h;
- 24h;
- 72h;
- 7d;
- spaeter 30d.

Globale Null-Toleranz-Metriken:
- unexpected game writes = 0;
- duplicate irreversible effects = 0;
- unsafe preemptions = 0;
- unverified action usage = 0;
- unresolved transactions am Zertifizierungsende = 0 oder explizit FAILED_SAFE/OPERATOR_REQUIRED;
- invariant violations = 0;
- silent sample gaps = 0;
- unbounded memory/history growth = 0;
- unbounded SSD growth = 0;
- kritische Persistenzverluste = 0;
- Hot-Path-Blockaden durch nichtkritisches SSD-I/O = 0;
- Zertifizierung dokumentiert Speicherreserve, I/O-Queue-Gesundheit und Retention-Verhalten.
Erst danach gilt V5 als 24/7-freigegeben.

## 4. Pflicht-Definition-of-Done fuer jede neue Capability

Jede Capability braucht vor Merge/Live-Freigabe:

- Knowledge-/Fact-/Contract-Referenz;
- Owner und Port;
- Preconditions/Freshness;
- Ressourcen/Locks;
- Workflow/Action Contract;
- Persist-before-action, wenn irreversibel;
- Server Result Classification;
- fachliche Postcondition;
- UNKNOWN/Reconcile Path;
- Retry/Circuit/Budget;
- Operator-/Safety-Policy;
- Telemetrie/Explainability;
- Unit + Property + Replay + Fault Tests;
- Shadow;
- Controlled-Live Gate;
- Disable/Rollback Path;
- Dokumentation und Schema-Version.

## 5. V3-Fehlerabdeckung

| V3-Fehler | Primaere V5-Gegenmassnahme |
|---|---|
| 001 Return != Commit | R9/R10 |
| 002 Blind Resume | R5/R10 |
| 003 Merchant Starvation | R8/R13 |
| 004 Hotfix-Kaskaden | R2/R3/R7 |
| 005 Stale Party Identity | R14/R16 |
| 006 Pending Offer Deadlock | R8/R14 |
| 007 Movement Thrash | R8/R16 |
| 008 Kein Workspace | R13/R15 |
| 009 Quota Retry Storm | R5/R8 |
| 010 Runtime startet sich selbst neu | R3/R11 |
| 011 Stale Moving Target | R6/R16 |
| 012 Production zu frueh fertig | R15 |
| 013 Duplicate nach Restart | R5/R10 |
| 014 Persistierter Katalog als Authority | R0/R6 |
| 015 Unknown Content freigegeben | R0/R6/R17 |
| 016 Mehrere Service Owner | R7 |
| 017 Partial Multi-Item Delivery | R10/R15 |
| 018 Globaler Circuit | R8 |
| 019 Raw Target statt Owned Target | R16 |
| 020 Plan Drift | R6/R9 |
| 021 Item nur Name/Level | R6/R13 |
| 022 Bank/Compound Fairness | R8/R13/R15 |
| 023 Alert verloren | R5/R11 |
| 024 Host Bridge zu maechtig | R3 |
| 025 Restart als Recovery | R10/R11 |
| 026 Safety gelockert fuer Liveness | R2/R7/R8 |
| 027 Unbounded Telemetry | R4/R11 |
| 028 Event Drift | R6/R17 |
| 029 Operator Stop in Transaction | R7/R10 |
| 030 Altpfad Regression | R2/R3 |

## 6. Entwicklungsregel

**Keine Abkuerzung ueber eine Phase.**

Wenn eine spaetere Domaene eine fehlende Primitive braucht, wird die Primitive im richtigen Core-Owner ergaenzt und dort getestet. Es entsteht kein fachlicher Hotfix-Layer.

V3 und V4 bleiben Wissens-/Test-/Designquellen. V5 uebernimmt Semantik nur nach expliziter Migrationsentscheidung.
