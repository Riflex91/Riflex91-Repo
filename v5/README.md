# Adventure Land AiO Bot V5

V5 ist die neue Zielgeneration des Bots.

V3 bleibt Wissens-, Fehler-, Test- und Produktionsbeobachtungsquelle.
V4 bleibt Architekturprototyp, validierter Zwischenstand und Komponentenquelle.
V5 wird als neuer Runtime-Kern aus dem konsolidierten Wissen von V3, V4 und aktueller Adventure-Land-Recherche entwickelt.

## Aktueller Status

**Planungs- und Wissensphase. Noch kein V5-Gameplay-Runtime-Code.**

Vor der ersten Runtime-Implementierung werden:

1. die Wissensbasis versioniert und gegen Drift absicherbar gemacht;
2. die P0-Research-Luecken geschlossen;
3. V5-Verfassung und Kernvertraege festgeschrieben;
4. V3/V4-Komponenten systematisch als `PORTIEREN`, `UMBAUEN` oder `NUR_WISSENSQUELLE` klassifiziert;
5. die Master-Roadmap finalisiert;
6. Anforderungen, Gefahren, Invarianten und Zustandsautomaten formalisiert;
7. Fitness-, Persistenz-, Security-, Operator- und Teststrategie festgelegt;
8. der Wissenswaechter sicher an GitHub angebunden;
9. das formale Laufzeit-Bereitschaftsgate auf FREIGEGEBEN gesetzt.

## Einstieg

- `dokumentation/ADR-0001-V5-NEUSTART.md` – Architekturentscheidung V5.
- `dokumentation/V5-MASTER-ROADMAP.md` – verbindliche Entwicklungsreihenfolge mit Gates.
- `dokumentation/V5-DEFINITION-OF-DONE.md` – Pflichtkriterien fuer jede Capability.
- `dokumentation/DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md` – verbindliche deutsche Domaenensprache, deutsche UI und gegenueber V4 verschaerfte Mehrfach-Verriegelung.
- `dokumentation/WISSENSWAECHTER-VERTRAG.md` – Sicherheitsvertrag fuer automatische Wissensaktualisierung und GitHub-Sync.
- `dokumentation/ENTWICKLUNGS-WISSENSGATE.md` – Pflichtprozess: aktuelles Wissen vor Planung, Implementierung und Merge.
- `dokumentation/LIVE-WISSEN-SSD-VERTRAG.md` – Bot-Writer-/Bridge-Mirror-Vertrag fuer live verifizierte Wissensdaten auf `D:\\`.
- `dokumentation/VOR-RUNTIME-SPEZIFIKATION.md` – letzte Pflichtvorbereitung vor Runtime-Code.
- `anforderungen/anforderungen.json` – kanonische Anforderungen.
- `anforderungen/nachverfolgbarkeit.json` – Wissen/Risiko/Invariante/Code/Test/Live-Nachweis.
- `gefahren/gefahrenkatalog.json` – FMEA-aehnlicher Fehler-/Gefahrenkatalog.
- `invarianten/invarianten.json` – 55 V4-Regeln plus neue V5-Haertungen.
- `zustaende/zustandsautomaten.json` – kritische Zustandsmodelle.
- `fitness/fitness-regeln.json` – Architektur-Fitnessregeln.
- `bereitschaft/laufzeit-bereitschaft.json` – einziges formales Vor-Runtime-Freigabegate.
- `roadmap/gates.json` – maschinenlesbarer Roadmap-/Abhaengigkeitszustand.
- `entwicklungsregeln/wissensnutzung.json` – maschinenlesbare Wissens-/Frische-/Driftregeln.
- `entwicklungsregeln/quellenfreigaben.json` – bewertete Quellenhash-Baselines; Drift sperrt relevante Implementierung.
- `wissensbasis/README.md` – Regeln der lebenden Wissensbasis.
- `wissensbasis/manifest.json` – maschinenlesbarer Einstiegspunkt.


## R2 – Verfassung und Migration

- `architektur/verfassung.json` – maschinenlesbare R2-Verfassung mit Authority-, Layer-, Persistenz- und Safety-Grenzen.
- `migration/v3-v4-zu-v5.json` – ratifizierte V3/V4-zu-V5-Capability-Migrationsmatrix.
- `migration/v3-fehlerabdeckung.json` – 30/30 strukturelle V3-Fehlergegenmassnahmen.
- `dokumentation/V5-VERFASSUNG-R2.md` – lesbare R2-Verfassung.
- `dokumentation/V5-DEUTSCHE-DOMAENENMIGRATION.md` – Migrationsregel fuer deutsche Runtime-Domaenensprache.
- `dokumentation/V5-R2-STRATEGIEN.md` – Persistenz-, Determinismus-, Security-, Operator-, Failure- und Simulatorstrategie.

R2 ist abgeschlossen. Dies oeffnet **nicht** das Gameplay-Runtime-Gate; R3 ist die aktuelle Phase.


## R3 – Build-Guards und no-write Grundlage

R3 ist abgeschlossen. Die no-write Grundlage liegt unter `grundlage/**` und besitzt keine Gameplay-Autoritaet.

Wichtige Artefakte:
- `roadmap/r3-abschluss.json` – maschinenlesbarer R3-Abschluss;
- `grundlage/konfiguration.json` – Default-Deny/no-write Konfiguration;
- `grundlage/quelle/**` – typisierte R3-Grundvertraege, bounded Writer und Replay-Grundgeruest;
- `werkzeuge/r3-statische-guards.mjs` – Architektur-/Write-/Dependency-Guards;
- `architektur/host-api-allowlist.json` – enge Host-Grenze;
- `architektur/adr/ADR-001-R3-GRUNDLAGE.md` – Architekturentscheidung;
- `.github/workflows/v5-r3.yml` – exakter-Head R3-CI.

Aktuelle Phase ist R4. Das Gameplay-Runtime-Gesamtgate bleibt GESPERRT.


## R4 – Deterministischer Core

R4 ist abgeschlossen. Der deterministische no-write Core liegt weiterhin unter `grundlage/**`; das Gameplay-Runtime-Gesamtgate bleibt GESPERRT.

Wichtige Artefakte:
- `roadmap/r4-abschluss.json` – maschinenlesbarer R4-Abschluss;
- `grundlage/quelle/determinismus/**` – Uhr-, Zufalls-, Kennungs- und Sequenzports;
- `grundlage/quelle/kern/domaenen-ereignis.ts` – immutable Events mit Korrelation/Kausalitaet;
- `grundlage/quelle/kern/geschlossener-zustandsautomat.ts` – fail-closed Automatenkern;
- `grundlage/quelle/kern/kanonische-serialisierung.ts` – deterministische Serialisierung;
- `grundlage/quelle/testlabor/replay-format.ts` – versioniertes Replay-Format;
- `grundlage/tests/r4-determinismus.test.mjs` – Determinismus-/Replay-Beweise;
- `werkzeuge/r4-zustandsmodelle-pruefen.mjs` – 13/13 Automatenvalidierung;
- `architektur/adr/ADR-002-DETERMINISTISCHER-CORE.md` – Architekturentscheidung;
- `.github/workflows/v5-r4.yml` – exaktes-Head R4-CI.

Aktuelle Phase ist R5.

## R5 – Persistenz, Journal und Schema-Evolution

R5 ist formal abgeschlossen. Die Persistenzgrundlage bleibt no-write bezogen auf Adventure-Land-Gameplay; das Gameplay-Runtime-Gesamtgate bleibt GESPERRT.

Wichtige Artefakte:
- `roadmap/r5-abschluss.json` – maschinenlesbarer R5-Abschluss mit CI-/Artifact-Nachweisen;
- `grundlage/quelle/persistenz/**` – Journal, Restart, Migration, Dedupe, Inbox/Outbox, Retention, Speicherdruck und Live-Wissen;
- `grundlage/adapter/persistenz/node-live-wissens-dateisystem.mjs` – atomarer Node-Dateiadapter;
- `grundlage/tests/r5-persistenz.test.mjs` – Persistenz-/Crash-/Fault-Matrix;
- `werkzeuge/r5-struktur-pruefen.mjs` – dauerhafter R5-DONE-Strukturvalidator;
- `architektur/adr/ADR-003-PERSISTENZ-JOURNAL.md` – Architekturentscheidung;
- `.github/workflows/v5-r5.yml` – exakter-Head R5-CI.

Aktuelle Phase ist R6. Der lokale Deploy einer alten Windows-Bridge-Binary bleibt als Betriebsblocker offen; der aktuelle Repo-Code ist weiterhin auf den Knowledge-Branch begrenzt.


## R6 – Observation, Evidence und World Truth

R6 ist formal abgeschlossen. Definitionen, echte Spielbeobachtung, LIVE_VERIFIZIERT-Evidence und abgeglichene Weltwahrheit sind getrennt; Wissenszugriff ist read-only und snapshot-gepinnt. Observation-Evidence ist bounded, grosse Historien werden zu kompakten RAM-Working-Sets verdichtet und Learning-Evidence besitzt keine Gameplay-Autoritaet.

Der produktive deutsche Anzeigekatalog ist fuer den aktuellen Snapshot vollstaendig: 129 Skills mit deutschen Beschreibungen, 7 Klassen, 628 Item-Quellvorkommen bei 626 effektiven IDs, 135 NPCs, 11 Events, 12 Quests, 60 Aktionen, 102 sichtbare Statuswerte und 129 Monster. Fuer Monster ist bei fehlendem Nachweis einer offiziellen deutschen Bezeichnung der revalidierte Originalname-Fallback aktiv.

Maschinenlesbarer Abschluss: `roadmap/r6-abschluss.json`.

Aktuelle Phase ist R7. Das Gameplay-Runtime-Gesamtgate bleibt GESPERRT. Der lokale Deploy der aktuellen Windows-Bridge bleibt separat zu verifizieren.


## R7 – Module, Capabilities, Ports und Authority

R7 ist formal abgeschlossen. V5 besitzt nun ein bounded Modulregister, ein default-deny Faehigkeitsregister mit `LESEN | PLANEN | MUTIEREN`, technisch erzwungenen Single Owner fuer mutierende Faehigkeiten, versionierte typisierte Ports, explizite Aktivierung/Deaktivierung und Health-/Quarantaene-Zustaende sowie versionierten Provider-Ersatz ohne parallelen mutierenden Owner.

Die Bediener-Richtlinie ist deny-only: Faehigkeitssperren und Nothalt koennen Authority nur reduzieren und werden vor lokaler Wirkung durable protokolliert. Mutierende Capabilities bleiben in R7 explizit nicht aktivierbar. Gameplay-Autoritaet und Raw-Write-Autoritaet bleiben false.

Maschinenlesbarer Abschluss: `roadmap/r7-abschluss.json`.

Aktuelle Phase ist R8. Das Gameplay-Runtime-Gesamtgate bleibt `GESPERRT`; der lokale Windows-Bridge-Deploymentstand bleibt separat zu verifizieren.


## R8 – Workflow Scheduler und Ressourcen

R8 ist formal abgeschlossen. V5 besitzt jetzt gepinnte Ablaufvertraege, deterministische Prioritaetsklassen mit Aging/Deadline/Ressourcenlokalitaet, Safe-Preemption, all-or-nothing Ressourcenclaims, Action-Channel-Serialisierung, langlebige Lease-Epochen mit Fencing sowie bounded Retry/Backoff/scoped Circuits.

Mutierende Action-Channels werden nur zusammen mit ihrem exklusiven Channel-Claim und dem character-globalen Socket-Planbudget koordiniert. Der initiale Planwert bleibt 100 gewichtete Punkte je 4000 ms bei verifizierter Servergrenze 200; die Reserve bleibt unverplant. Abgelaufene Leases verlangen Abgleich vor Neuvergabe, stale Fencing-Tokens bleiben wirkungslos.

Maschinenlesbarer Abschluss: `roadmap/r8-abschluss.json`.

Aktuelle Phase ist R9. Das Gameplay-Runtime-Gesamtgate bleibt `GESPERRT`; R8 besitzt weiterhin keine Gameplay- oder Raw-Write-Autoritaet.


## R9 – Admission und Execution Kernel

R9 ist formal abgeschlossen. V5 besitzt nun eine zentrale nominal typisierte Ausfuehrungsfreigabe, die nur nach unabhaengiger Pruefung von Runtime-Gate, Capability/Owner, Operator-Policy, Action/Recovery/Verifier-Vertrag, durable Transaction Intent, Fencing, Action-Channel, character-globalem Socket-Budget und frischen Live-Preconditions entstehen kann.

Der Execution-Kernel akzeptiert keine losen Boolean-/Objektfreigaben, revalidiert Ablaufzeit und Adaptervertrag unmittelbar vor Send und behaelt UNKNOWN als eigene Ergebnisart. Die 60 wertrelevanten Action Contracts sind maschinenlesbar an Recovery und Verifier gebunden: 59 produktiv verifiziert, `cave_buy` weiterhin explizit deaktiviert.

Maschinenlesbarer Abschluss: `roadmap/r9-abschluss.json`.

Aktuelle Phase ist R10. Das Gameplay-Runtime-Gesamtgate bleibt `GESPERRT`; ein produktiver Top-Level-Execution-/Raw-Write-Pfad bleibt solange absent.


## R10 – Reconciliation und Recovery Kernel

R10 ist formal abgeschlossen. UNKNOWN, Timeout/Disconnect nach moeglichem Send und partielle Effekte besitzen keinen Blind-Retry-Pfad. Der Recovery-Kernel kann nicht senden, sondern nur beobachten, klassifizieren und abgleichen; fachlicher COMMIT entsteht erst durch passende Postcondition-/Reconciliation-Evidence.

Partial Completion wird diff-basiert auf offene Domaenen reduziert. Nichtterminale Arbeit wird nach Restart ausschliesslich als `ABGLEICH_ERFORDERLICH` und ohne ExecutionAuthority geladen. Stop sperrt zuerst neue Arbeit und reconciliert In-Flight bounded; ungeklaerte irreversible Arbeit fuehrt fail-closed zur kritischen Sperre. Knowledge-/Config-/Prestate-Kontext bleibt fuer In-Flight-Recovery gepinnt.

Maschinenlesbarer Abschluss: `roadmap/r10-abschluss.json`.

Aktuelle Phase ist R11. Das Gameplay-Runtime-Gesamtgate bleibt `GESPERRT`; R10 besitzt weiterhin keine Send- oder Raw-Write-Autoritaet.


## R11 – Testlabor, Replay, Observability und Operations

R11 ist formal abgeschlossen. Fehlende/stale kritische Health-Evidence bleibt fail-closed; kritische Alerts werden durable persistiert bevor sie geclaimt werden; Dashboard und Telemetrie bleiben observer-only ohne Gameplay-Autoritaet. Automatische Authority ist mit Owner, Evidence, Ressourcen, Policy, Grund und Erwartungswirkung sichtbar.

Operations-Telemetrie ist bounded und exponiert SSD-I/O-Latenz, Queue-Tiefe, Backpressure, freie Bytes und Recorder-Drops. Retention/Rotation/Kompression werden deterministisch geplant. Golden Replay und Replay aus bounded Live-Evidence sind reproduzierbar. Zusaetzlich erzwingt R11 Core-Positiv-/Negativabdeckung, Property-/Model-Tests, Fault-Injection und Safety-Mutationstests.

Maschinenlesbarer Abschluss: `roadmap/r11-abschluss.json`.

Aktuelle Phase ist R12. Das Gameplay-Runtime-Gesamtgate bleibt `GESPERRT`; R11 besitzt keine Gameplay- oder Raw-Write-Autoritaet.


## R12 – Vertical Slice 0: aktueller Teilstand

Der komplette Shadow-End-to-End-Pfad ist auf `main` bestanden: Observation, Plan, Workflow, Ressourcen, durable Intent, Admission, Shadow-Execution, simuliertes Serverergebnis, Postcondition, Commit und Restart-Abgleich laufen ohne Bypass. Der Shadow-Nachweis meldet **0 Raw Game Writes** und **0 unerwartete Game Writes**.

Controlled Live bleibt bewusst offen. Der erste Live-Kandidat ist exakt `AL-ACTION-EQUIP` / `equip`, maximal eine Action. Bank, Trade, Transfer, Upgrade, Compound, Exchange und Craft sind fuer den Erstlauf ausgeschlossen.

Der aktuelle Preflight ist blockiert, weil die globale Readiness `GESPERRT` ist und die lokal beobachtete bestehende Runtime-Health `DEGRADED` / `SNAPSHOT_STALE` meldet. Die Windows Bridge bleibt absichtlich ohne Remote-Gameplay-/Generic-Command-Autoritaet.

Preflight: `roadmap/r12-controlled-live-preflight.json`.


## Manueller Teststandard – Ingame-GUI

Ab R12 sollen manuelle Adventure-Land-Live-Tests über die V5-Ingame-Test-GUI ausgeführt werden. Der Benutzer fügt ein Testpaket im Spiel ein, bedient die Testschritte per Button und sendet anschließend den mit **Gesamtbericht kopieren** erzeugten Bericht an ChatGPT.

Generische GUI: `werkzeuge/v5-adventure-land-test-gui.js`  
R12-Paket: `werkzeuge/r12-controlled-live-test-paket.js`  
Standard: `werkzeuge/V5-TEST-GUI.md`

Die GUI selbst besitzt keine generische Gameplay-Autorität. Testcontroller dürfen nur die jeweils ratifizierten Aktionen auslösen.


## R12 – Vertical Slice 0 abgeschlossen

R12 ist abgeschlossen. Der Shadow-End-to-End-Pfad blieb bei **0 unerwarteten Game Writes**. Der Controlled-Live-Test fuehrte genau **eine** `AL-ACTION-EQUIP`/`equip`-Mutation aus: `gameWrites=1`, `unerwarteteGameWrites=0`, `sameIntentRetry=false`, Postcondition `BESTAETIGT`.

Die breite Gameplay-Runtime bleibt weiterhin `GESPERRT`; der R12-One-Shot war nur ein enges Testgate.

Live-Evidence: `roadmap/r12-controlled-live-evidence.json`  
Abschluss: `roadmap/r12-abschluss.json`

Aktuelle Phase: **R13 – Merchant Core A: Single-Character Economy**.


## R13 – Merchant Core A abgeschlossen

R13 ist als V5-nativer Merchant-Planungs- und Koordinationskern abgeschlossen. Nachgewiesen sind zentrale Gegenstandsdisposition und konkrete physische Reservierungen, konservativer Workspace-/Capacity-Preflight, Gold-/Budget-Ledger, accountweite Bank-Lease mit Epoche/Fencing und Restart-Reconciliation sowie frische Market-RID-/Mengen-Evidence inklusive Reproduktion des echten `trade_sell`-Serverscans.

Bankauthority liegt nicht im Merchant-Modul, sondern in der accountweiten Koordinationsgrenze `grundlage/quelle/koordination/account-bank-lease.ts`. R13 erzeugt keine neuen Raw Game Writes und öffnet keine breite Gameplay-Runtime.

Abdeckung: `grundlage/vertraege/r13/merchant-core-abdeckung.json`  
Abschluss: `roadmap/r13-abschluss.json`

Aktuelle Phase: **R14 – Multi-Character Coordination Foundation**.


## R14 – Multi-Character Coordination abgeschlossen

R14 ist als no-write Multi-Character-Koordinationsgrundlage abgeschlossen. CM-Umschlaege sind versioniert, TTL- und dedupe-gebunden, workflow-korreliert und serverlokal gefenced. Duplicate, Out-of-order, Loss und Delay sind fault-injected; ACK/Settlement bleibt auch bei Reordering und Restart korreliert.

Roster-Ziele sind an Roster-Epoche und Character-Session gebunden. Stale Characters erhalten keine neue Koordinationsfreigabe. Restart importiert weder Roster noch Liveness als frische Authority. Account Coordinator und Character Agent bleiben getrennt; beide erhalten in R14 keine neue Raw-Game-Write-Authority.

P1A: `dokumentation/P1A-CM-MULTI-CHARACTER.md`  
Abdeckung: `grundlage/vertraege/r14/multi-character-abdeckung.json`  
Abschluss: `roadmap/r14-abschluss.json`

Die breite Gameplay-Runtime bleibt `GESPERRT`.

Aktuelle Phase: **R15 – Merchant Core B: Supply, Gear und Production**.


## R15 – Merchant Core B abgeschlossen

R15 ist als no-write Merchant-/Production-Planungs- und Reconciliation-Schicht abgeschlossen.

Enthalten sind Supply Policy, Supply Delivery, Collection/Rendezvous, Gear Allocation/Delivery, q/Placeholder-Werttransaktionen, frische Bankkatalog-Planning-Evidence, ein bounded azyklischer Production Graph, event-/quest-gated Freshness sowie finales Recipient Settlement.

Die harte Regel lautet weiterhin:

`CRAFT_COMMITTED != PRODUCTION_COMMITTED`

Production wird erst nach positiver Empfaengerverifikation committed. q/Placeholder oder attributable Consumable-Deltas bedeuten accepted in-flight; Restart fuehrt zu Reconciliation statt Blind-Retry.

Abdeckung: `grundlage/vertraege/r15/merchant-core-b-abdeckung.json`  
ADR: `architektur/adr/ADR-018-R15-MERCHANT-CORE-B.md`  
Abschluss: `roadmap/r15-abschluss.json`

Die breite Gameplay-Runtime bleibt `GESPERRT`.

Aktuelle Phase: **R16 – Party, Combat, Farming und Navigation**.


## R16 – Party, Combat, Farming und Navigation abgeschlossen

R16 ist als no-write World-/Combat-Foundation abgeschlossen.

Movement-Return ist kein Arrival-Beweis; Arrival braucht eine frische beobachtete Postcondition. Bewegte Ziele werden motion-aware revalidiert. Raw Targets sind nur volatile Evidence und keine fachliche Target-Ownership. Movement-Owner verhindern Travel/Kite-Pingpong, Safety-Preemption ist epochengebunden.

Party Truth, Skill-/Shared-Cooldown-Evidence, Death/Respawn/Rejoin, Threat/CC, AoE-Hard-Caps, Encounter-Dedupe und ein bounded Farmer-FSM sind V5-nativ umgesetzt.

P1B: `dokumentation/P1B-PARTY-COMBAT-NAVIGATION.md`  
Abdeckung: `grundlage/vertraege/r16/party-combat-navigation-abdeckung.json`  
ADR: `architektur/adr/ADR-019-R16-PARTY-COMBAT-NAVIGATION.md`  
Abschluss: `roadmap/r16-abschluss.json`

Die breite Gameplay-Runtime bleibt `GESPERRT`.

Aktuelle Phase: **R17 – World Autonomy**.


## R17 – World Autonomy abgeschlossen

R17 ist als no-write World-Autonomy-Foundation abgeschlossen.

Event-/Quest-Planung pinnt frischen Live-State und wird unmittelbar vor Action revalidiert. Drift fuehrt zu Replan, stale oder unbekannte Semantik blockiert fail-closed. Unknown Content startet in Quarantaene; Discovery allein kann keine Freigabe erteilen. Server-Hopping respektiert Registry-Freshness, bekannte Modi, explizite PvP/Hardcore-Policies und Fatigue-Grenzen.

P2: `dokumentation/P2-WORLD-AUTONOMY.md`  
Abdeckung: `grundlage/vertraege/r17/world-autonomy-abdeckung.json`  
ADR: `architektur/adr/ADR-020-R17-WORLD-AUTONOMY.md`  
Abschluss: `roadmap/r17-abschluss.json`

Die breite Gameplay-Runtime bleibt `GESPERRT`.

Aktuelle Phase: **R18 – Learning und Optimierung**.


## R18 – Learning und Optimierung abgeschlossen

R18 ist als bounded, authority-freie Learning-Schicht abgeschlossen.

Learning darf nur Ranking/Scoring innerhalb bereits hard-erlaubter Kandidaten beeinflussen. Safety, Authority, Operator-Deny, Quarantaene, Budgets und Retry-Grenzen haben unveraenderlichen Vorrang. Ein deterministischer Fallback bleibt jederzeit voll funktionsfaehig. Challenger starten Shadow-only und koennen nur mit sauberer, versionierter Evidence explizit promotet werden.

Abdeckung: `grundlage/vertraege/r18/learning-abdeckung.json`  
ADR: `architektur/adr/ADR-021-R18-LEARNING-OPTIMIERUNG.md`  
Abschluss: `roadmap/r18-abschluss.json`

Die breite Gameplay-Runtime bleibt `GESPERRT`.

Aktuelle Phase: **R19 – beschleunigte Runtime-Zertifizierung**. Das aktive Zeitprofil ist `R19_ACCELERATED_SOAK_V2`; es ersetzt keinen mehrtaegigen 24/7-Soak.


## R19 – Automatik bis Shadow abgeschlossen

Die automatische R19-Vorbereitung ist bis einschliesslich **Shadow** abgeschlossen.

Bestanden:
- Simulator/Replay;
- Fault Suite;
- no-write Shadow;
- unveraenderliche, fingerprint-verkettete Evidence;
- Sample-Gap-Erkennung;
- globale Null-Toleranz-Pruefung;
- bounded RAM-/SSD-/I/O-Evidence;
- deutsches Release-Gate mit 100 % Pflichtabdeckung und 0 unerlaubten Rohtext-Leaks.

Maschinenlesbarer Nachweis: `roadmap/r19-automatik-evidence.json`  
ADR: `architektur/adr/ADR-022-R19-ZERTIFIZIERUNG.md`

**Naechste Stufe: CONTROLLED_LIVE. Diese Stufe ist manuell und benoetigt den PC/Ingame-Test.**

R19 bleibt `IN_PROGRESS`; die breite Gameplay-Runtime bleibt `GESPERRT`.


## R19 – Controlled Live bestanden

Controlled Live: **BESTANDEN**. Der manuelle Ingame-Lauf `R19-1789894379854-ced64768` erzeugte exakt einen erwarteten `equip`-Write, null unerwartete Writes, keinen Same-Intent-Retry und eine bestaetigte fachliche Postcondition.

Evidence: `roadmap/r19-controlled-live-evidence.json`.

Naechste Stufe: **CANARY**. R19 bleibt `IN_PROGRESS`; die breite Runtime bleibt `GESPERRT`.


## R19 – Canary bestanden

Canary: **BESTANDEN**. Run `R19-1789894940141-fa58fa3e` nutzte bounded Learning-Ranking ausschliesslich innerhalb hart erlaubter Equip-Kandidaten. Der Learning-Einfluss aenderte die Auswahl gegenueber dem deterministischen Fallback, ohne Gameplay-/Authority-Rechte oder Safety-Lockerung. Genau ein `equip`-Write wurde postcondition-verifiziert; unerwartete Writes blieben null.

Evidence: `roadmap/r19-canary-evidence.json`.

Naechste Stufe: **SOAK_5M**. R19 bleibt `IN_PROGRESS`; die breite Runtime bleibt `GESPERRT`.


## R19 – SOAK_5M bestanden

SOAK_5M: **BESTANDEN**. Der reale Ingame-Lauf auf `My_Merchant` lief 300002 ms mit 21 Samples. Sample-Gaps, Recorder-Drops, unerwartete Gameplay-Writes, alternative Runtime-Samples und `performance_trick`-Ausfaelle blieben jeweils bei 0; die fingerprint-verkettete Evidence ist gueltig. Das Heap-Wachstum betrug 9448646 Bytes bei 536870912 Bytes Grenze.

Evidence: `roadmap/r19-soak-5m-evidence.json`.

SOAK_10M: **BESTANDEN**. Der reale Uebergangs-Lauf lief 600012 ms mit 21 Samples, 0 Sample-Gaps, 0 Recorder-Drops, gueltiger Evidence-Kette, 0 Gameplay-Writes und 0 `performance_trick`-Ausfaellen.

Evidence: `roadmap/r19-soak-10m-evidence.json`.

SOAK_15M: **BESTANDEN**. Der finale Integrations-/Release-Lauf lief 900007 ms mit 31 Samples, 0 Sample-Gaps, 0 Recorder-Drops, gueltiger Evidence-Kette, 0 Gameplay-Writes und 0 `performance_trick`-Ausfaellen.

Evidence: `roadmap/r19-soak-15m-evidence.json`.  
Abschluss: `roadmap/r19-abschluss.json`.

**R19 ist DONE.** Die Zertifizierungs-Ladder ist vollstaendig bestanden. Die breite Runtime bleibt dennoch `GESPERRT`, bis die separate globale Laufzeitbereitschaft mit allen zehn Pflichtbereichen explizit freigegeben ist.


## R19 – Testzeitstandard und beschleunigtes Soak-Profil

Der verbindliche V5-Testzeitstandard lautet ab jetzt:

- **5 Minuten** fuer die Abnahme einer einzelnen neuen oder geaenderten Funktion/Capability;
- **15 Minuten** fuer Integrations-, Meilenstein- und Release-Gates.

Der bereits gestartete SOAK_10M bleibt als einmalige R19-Uebergangsstufe gueltig. Das aktuelle R19-Profil lautet deshalb **5 Minuten → 10 Minuten → 15 Minuten final** (`R19_ACCELERATED_SOAK_V2`). Die bisherigen 30-/60-Minuten-Stufen entfallen.

Die kuerzere Testzeit lockert keine Safety-, Authority-, Evidence-, Sample-Gap-, Persistenz-, Ressourcen- oder Gameplay-Write-Grenzen. Ein spaeter entdeckter Defekt oeffnet die betroffene Funktion wieder und verlangt nach dem Fix mindestens erneut den 5-Minuten-Test; bei Integrations-/Release-Auswirkung auch den 15-Minuten-Test.

Maschinenlesbar: `roadmap/testzeit-standard.json` und `roadmap/r19-soak-zeitprofil.json`.  
ADR: `architektur/adr/ADR-024-TESTZEITSTANDARD-5M-15M.md`.

Diese Evidence wird als beschleunigte Runtime-Zertifizierung und nicht als mehrtaegiger 24/7-Soak ausgewiesen.

## Separate V5-Gesamtfreigabe erteilt

Die technische Readiness ist vollständig geschlossen: 10/10 Pflichtbereiche, 119/119 Anforderungen und 119/119 Traceability sind nachgewiesen; R19 ist DONE und der reale Windows-Bridge-/WISSEN-012-Nachweis ist geschlossen.

Der Betreiber hat am 2026-09-20 ausdrücklich `V5 GESAMTFREIGABE ERTEILEN` bestätigt. Der aktuelle Freigabezustand lautet:

- `gesamtfreigabe = ERTEILT`;
- `breiteRuntimeFreigabe = true`;
- `laufzeit-bereitschaft.status = FREIGEGEBEN`;
- finales Evidence-Artefakt: `roadmap/gesamtfreigabe.json`.

Die Gesamtfreigabe öffnet nur das globale Runtime-Gate. Capability-/Owner-Authority, Operator-Deny, Kill Switch, Action Contracts, Admission, Freshness, Fencing, Resource-Gates, durable Intent und UNKNOWN/Reconciliation bleiben unverändert zwingend.

Vertrag: `dokumentation/GESAMTFREIGABE.md`  
Validator: `werkzeuge/gesamtfreigabe-pruefen.mjs`  
CI: `.github/workflows/v5-gesamtfreigabe.yml`

