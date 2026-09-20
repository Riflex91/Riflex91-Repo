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
