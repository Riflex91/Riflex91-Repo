# V5 – Vor-Runtime-Spezifikation

**Status:** VERBINDLICH VOR ERSTER RUNTIME-IMPLEMENTIERUNG  
**Stand:** 2026-09-19

Diese Spezifikation beschreibt die letzte Vorbereitungsstufe vor echtem V5-Runtime-Code.

## Pflichtartefakte

Vor dem ersten Runtime-Code muessen fachlich geprueft sein:

1. P0-Research P0-01 bis P0-07;
2. kanonische Anforderungsmatrix;
3. Nachverfolgbarkeitsmatrix;
4. Gefahren-/Fehlerkatalog;
5. ratifizierte V5-Invarianten;
6. kritische Zustandsautomaten;
7. Architektur-Fitness-Regeln;
8. Persistenz-/Migrationsmodell;
9. Determinismusregeln;
10. Simulator-/Fault-/Replay-Strategie;
11. Security-/Secrets-/Trust-Boundary-Modell;
12. Bediener-/Notfallmodell;
13. Fehlerdomaenenmodell;
14. Wissenswaechter-/Git-Sicherheitsvertrag;
15. Auswahlkriterien fuer Vertical Slice 0;
16. formales Laufzeit-Bereitschaftsgate;
17. verbindlicher Entwicklungs-Wissensgate mit Frische-, Quellenhealth- und Driftpruefung;
18. Zielvertrag fuer die lokale live verifizierte Wissensdatenbank auf `D:\\` und ihren read-only Bridge-Spiegel;
19. ratifizierter Vertrag `LOKALES-SSD-DATENFUNDAMENT.md` fuer die dedizierte 1-TB-SSD, Speicher-Tiering, I/O-Pfade, Budgets, Retention, Volume-Identitaet und Fail-Closed-Verhalten.

## Recovery-/UNKNOWN-Vertrag

Der Vertrag `P0-02-RECOVERY-UNKNOWN-MATRIX.md` und die maschinenlesbare Matrix `wissensbasis/vertraege/recovery-contracts.json` sind vor Runtime-Code verbindlich.

Pflicht:
- jede wertveraendernde Action besitzt genau einen Recovery Contract;
- UNKNOWN ist persistierter fachlicher Zustand;
- Timeout/Disconnect/fehlende Antwort beweisen kein NOT_APPLIED;
- NOT_APPLIED braucht positive frische Evidence;
- nach moeglichem Send ist Same-Intent-Retry verboten;
- PARTIAL wird als neuer Remainder-Diff geplant, nicht durch Wiederholung des Originalrequests;
- STILL_PENDING erlaubt nur Warten/Reobserve;
- UNRESOLVED sperrt Send und fuehrt zu Quarantaene/Operator-Policy;
- nicht-terminale persistierte Arbeit startet nach Restart als RECONCILE_REQUIRED;
- explizit deaktivierte Actions bleiben auch Recovery-seitig deaktiviert.

## Persistenz und Migration

Pflicht:
- Schema-Version je persistentem Dokument;
- atomare Schreibstrategie;
- Integritaetspruefung kritischer Records;
- Forward-Migration;
- definierter Downgrade-/Unsupported-Future-Schema-Pfad;
- corrupt/oversized/unreadable -> fail-closed;
- Intent vor irreversiblem Side Effect;
- persistenter Dedupe-Cursor;
- Inbox/Outbox oder Claim-Mechanismus fuer kritische Zustellung;
- Retention/Compaction;
- Fixtures fuer jede unterstuetzte Schema-Version;
- Crash-Injection vor/nach kritischen Schreibschritten;
- Trennung von kritischer synchroner Persistenz und nichtkritischem asynchronem Batch-I/O;
- bounded Schreibwarteschlangen mit Backpressure;
- Speicherbudgets pro Datenklasse;
- standardmaessig mindestens 15 Prozent freie SSD-Sicherheitsreserve;
- definierte Degradation bei Speicherdruck;
- Volume-/Datentraegeridentitaet zusaetzlich zum Laufwerksbuchstaben;
- kein stiller Fallback kritischer Persistenz auf das Systemlaufwerk.
## Lokales SSD-Datenfundament

Die dedizierte 1-TB-SSD unter der Standardwurzel `D:\\AdventureLand-V5` wird als persistentes Datenfundament behandelt, nicht als Ersatz fuer RAM.

Pflicht-Tiering:
- HOT/RAM: aktueller World-/Character-State, Scheduler, Locks/Leases, aktive Workflows/Transaktionen und aktuelle Execution-Preconditions;
- WARM/SSD: Journale, Checkpoints, Evidence, Replay, aktuelle Historien, aggregierte Telemetrie und Learning-Evidence;
- COLD/SSD: verdichtete historische Replays, Testlaeufe, Zertifizierungsnachweise und Langzeitstatistik.

Hot-Path-Regeln:
- normale Combat-/Movement-/Scheduler-/Execution-Entscheidungen warten nicht auf nichtkritisches SSD-I/O;
- grosse Historien werden nicht im Hot Path vollstaendig gelesen;
- Hintergrund-Aggregatoren erzeugen kompakte RAM-Working-Sets;
- nichtkritische Aufzeichnung erfolgt asynchron, bounded und batchweise;
- vor wertveraendernder/irreversibler Mutation bleibt durable Journal-Persistenz synchron verpflichtend.

Speicherdruck-Regeln:
- Cache/Telemetrie/alte Replay- und Testdaten degradieren vor kritischer Persistenz;
- ungeklärte Transaction-/Recovery-Evidence wird niemals still geloescht;
- kann kritische Persistenz nicht mehr garantiert werden, werden neue wertveraendernde Mutationen fail-closed blockiert.

## Determinismus

Fachlich relevante Pfade verwenden spaeter:
- `UhrPort`;
- `ZufallsPort`;
- `KennungsGeneratorPort`;
- `SequenzGeneratorPort`.

Gleiche Evidence + Uhr + Seed + Konfiguration sollen denselben Plan/Eventstrom ergeben.

## Architektur-Fitness

CI muss spaeter mindestens verhindern:
- Raw Adventure-Land Writes ausserhalb `ausfuehrung/`;
- V3/V4-Runtime-Imports;
- Monkey-/Prototype-Patches;
- Cross-Layer-Importverletzungen;
- mehrere mutierende Owner;
- unbounded Collections;
- mutierende Capability default-on;
- Ausfuehrer ohne typisierte Freigabe;
- Host/Dashboard/Bridge Gameplay-Autoritaet;
- unerlaubte englische Sichttexte;
- Knowledge-Sync ausserhalb der Allowlist;
- Implementierung bei stale/fehlerhaftem oder unbewertet gedriftetem relevanten Wissen;
- direkter Gameplay-Zugriff auf `wissensbasis/datenbank/aktuell/**`;
- Verwendung von Kandidaten als Entwicklungs- oder Gameplay-Autoritaet;
- beliebiger Fachmodul-Dateizugriff statt typisierter Speicherports;
- unbounded SSD-Schreibwarteschlangen;
- nichtkritisches SSD-I/O, das den Gameplay-Hot-Path blockiert;
- wertveraendernde Mutation ohne bestaetigten durable Intent.
Jeder Guard benoetigt ein Negativfixture, das beweist, dass der Guard wirklich fehlschlaegt.

## Simulator und Testlabor

Der Adventure-Land-Adapter bekommt vor riskanter Domainbreite einen kontrollierbaren Simulator. Das Replay-/Aufzeichnungsgrundgeruest beginnt bereits in R3/R4; R11 baut es fuer Operations, Fault Injection und Langzeit-Zertifizierung aus.

Simulierbar mindestens:
- Erfolg;
- deterministische Ablehnung;
- transiente Ablehnung;
- Timeout vor Send;
- Disconnect nach moeglichem Send;
- Response verloren nach Commit;
- Partial Completion;
- stale RID;
- Inventory-Index-Drift;
- Entity verschwunden;
- q/Placeholder aktiv;
- Bank-Lease verloren;
- doppelte/verzoegerte/umsortierte Nachricht;
- Persistenz-Crash;
- inkompatibles Schema;
- Rate Limit / limitdc.

Testleiter:
`Static -> Unit -> Negativ -> Property -> Zustandsmodell -> Mutation -> Replay -> Fault -> Integration -> Shadow -> Controlled Live -> Soak`

## Security / Trust Boundaries

Vertrauensbereiche:
- Adventure-Land-Rohdaten: extern bis normalisiert;
- Web-/Community-Quellen: untrusted;
- Wissenswaechter: Evidence-Autoritaet, keine Gameplay-Autoritaet;
- Windows Bridge: Host/Transport, keine Gameplay-Policy;
- Dashboard: Operator-Interface, keine Raw Writes;
- Runtime: Gameplay-Authority;
- Execution Adapter: einzige rohe Mutation;
- Persistenz: untrusted bis Schema/Integritaet validiert.

Secrets:
- nie Repo;
- nie Gameplay-Bundle;
- nie Telemetrie/Alerts;
- lokal DPAPI oder geeigneter Secret Store;
- minimale Berechtigungen;
- rotierbar/widerrufbar.

## Bediener-/Notfallmodell

Mindestens:
- `ARBEIT_PAUSIEREN`: keine neue Normalarbeit; sichere Punkte abwarten;
- `SICHER_STOPPEN`: neue Arbeit sperren, In-Flight bounded reconciliieren, persistieren, pausieren;
- `NOTFALL_SPERRE`: neue Mutationen sofort verweigern; laufende moegliche Mutationen nur beobachten/reconciliieren;
- `CAPABILITY_SPERREN`;
- `CAPABILITY_QUARANTAENE`;
- `BUDGET_REDUZIEREN`.

Operator darf Safety niemals umgehen.

## Fehlerdomaenen

Mindestens getrennt:
- Knowledge/Wissenswaechter;
- Observability/Dashboard;
- einzelner Character Agent;
- Account Coordinator;
- Merchant Bank;
- Merchant Market;
- Production;
- Combat;
- Navigation;
- Learning;
- Persistence;
- SSD/Storage-I/O;
- External Host/Bridge.

Ein Fehler reduziert nur die betroffene Autoritaet. Fachfremde sichere Arbeit darf weiterlaufen, sofern ihre eigenen Preconditions weiter bewiesen sind.

## Vertical Slice 0

Die erste mutierende V5-Vertikalscheibe muss:
- geringes Schadenspotenzial haben;
- gut beobachtbar sein;
- leicht ausgleichbar/reversibel sein;
- keine Bank-, Trade-, Transfer-, Upgrade-, Compound- oder Production-Aktion sein;
- den kompletten Pfad Evidence -> Plan -> Workflow -> Ressource -> Journal -> Freigabe -> Execution -> Postcondition -> Commit -> Restart-Abgleich durchlaufen.

Die konkrete Action wird erst nach P0-Research und R2 festgelegt.

## Build- und Supply-Chain-Provenance

Jeder spaetere Live-Build bindet:
- Git-SHA;
- Dependency-Lock-Hash;
- Runtime-/Schema-Version;
- Build-ID;
- Konfigurationsfingerprint;
- Knowledge-/Contract-Version;
- SSD-Volume-Identitaet und Datenlayout-Version;
- relevante Persistenz-/Replay-Schema-Versionen.
Zertifizierungsevidence muss diese Identitaet tragen.

## Freigaberegel

Vor echtem Runtime-Code entscheidet ausschliesslich `v5/bereitschaft/laufzeit-bereitschaft.json`.

Nur wenn alle Pflichtbereiche `erfuellt: true` tragen und der Validator `FREIGEGEBEN` meldet, darf die Runtime-Grundstruktur angelegt werden.


## Live-Wissensdatenbank

Vor Runtime-Code ist nur der Vertrag verbindlich; der eigentliche Bot-Writer wird erst in R5/R6 implementiert.

Festgelegt sind bereits:

- lokaler Standardpfad `D:\AdventureLand-V5\wissensdatenbank`;
- Bot als alleiniger fachlicher Writer;
- Bridge als read-only Validator/Mirror;
- GitHub-Ziel `v5/wissensbasis/live/snapshot/**`;
- Generation `SCHREIBT -> BEREIT`;
- Secret-/Path-/Reparse-/Size-Guards;
- keine Generalisierung einzelner Live-Beobachtungen;
- keine direkte ExecutionAuthority aus persistiertem Live-Wissen.

Die Live-Wissensdatenbank ist nur ein geschuetzter Teil des groesseren lokalen SSD-Datenfundaments. Die Windows Bridge bleibt weiterhin auf diesen Live-Wissenspfad begrenzt; Runtime-Journale, Replay, Telemetrie, Learning-Daten und Recovery-State werden nicht automatisch nach GitHub gespiegelt.