# V5 – R2 Strategien und Trust Boundaries

**Status:** R2 RATIFIZIERT  
**Stand:** 2026-09-19  
**Runtime-Gate:** GESCHLOSSEN

Dieses Dokument konsolidiert die vor Runtime verbindlichen Strategien. Es ersetzt keine Detailvertraege, sondern ratifiziert deren Zusammenspiel.

## Persistenzstrategie

- HOT State bleibt im RAM.
- WARM/COLD Evidence, Journale, Checkpoints, Replay und Historie liegen auf der dedizierten SSD.
- Kritischer Transaction Intent muss vor wertveraenderndem Send durable bestaetigt sein.
- Corrupt, unreadable, oversized oder falsches Volume reduziert Authority fail-closed.
- Kein stiller kritischer Fallback auf das Systemlaufwerk.
- Nichtkritische Writer sind bounded und duerfen den Gameplay-Hot-Path nicht blockieren.
- Schema-Version und Migration sind Pflicht.

Detailvertrag: `LOKALES-SSD-DATENFUNDAMENT.md`.

## Determinismusstrategie

Fachlich relevante Zeit, Zufall, IDs und Sequenzen werden injiziert. Replay muss dieselben fachlichen Entscheidungen aus derselben gepinnten Evidence reproduzieren koennen. Wall-clock, `Math.random()` oder ad-hoc IDs sind im Fachkern keine erlaubten versteckten Abhaengigkeiten.

## Security-/Trust-Boundary-Strategie

- Default Deny fuer mutierende Capabilities.
- Raw Game Writes nur im Ausfuehrungs-Layer.
- Host, Dashboard, Windows Bridge, Wissenswaechter und Learning besitzen keine Gameplay-Authority.
- Bridge-/Host-APIs sind allowlisted; kein generisches Remote-Evaluate.
- Secrets duerfen weder Repo, Runtime-Bundle, Telemetrie, Alerts noch Live-Wissensmirror erreichen.
- Community-/Kandidatenwissen besitzt keine Entwicklungs- oder Gameplay-Autoritaet.
- Source Drift reduziert Freigabe; sie darf nicht automatisch uebergangen werden.

## Operatorstrategie

Der Bediener darf:

- Capabilities deaktivieren;
- Authority reduzieren;
- Stop/Deny ausloesen;
- kontrollierte Freigaben innerhalb der Safety-Grenzen erteilen.

Der Bedienerpfad darf keine harte Safety-Invariante, keinen Fencing-Token, keine Postcondition und keinen UNKNOWN-Abgleich umgehen.

## Fehlerdomaenenstrategie

Fehler werden mindestens in folgende Domaenen getrennt:

- Wissen/Drift;
- Character Socket;
- Account Bank;
- Inventory;
- Persistenz/SSD;
- Host;
- Windows Bridge;
- externe API/MCP;
- Telemetrie/Alerts;
- Learning.

Ein lokaler Fehler stoppt nur den noetigen Scope. Safety-relevante Unsicherheit reduziert Authority; sie wird niemals als CLEAN interpretiert.

## Simulator-/Replay-Strategie

Vor dem Execution Kernel wird ein kontrollierbares Testlabor aufgebaut:

- injizierbare Uhr/Zufall/IDs;
- deterministische Fixtures;
- modellierte Action Results und Postconditions;
- Fault Injection fuer Timeout, Disconnect, Duplicate, Reorder, Partial und Persistence Failure;
- Replay mit gepinntem WissensSnapshot und Build-/Schema-Provenienz;
- Null echte Game Writes im Simulator.

Der Simulator darf keine alternative Gameplay-Policy enthalten; er prueft dieselben Vertraege wie die spaetere Runtime.

## Mehrfach-Verriegelung

Riskante Mutation benoetigt gemeinsam:

1. Capability-Freigabe;
2. Single Owner;
3. frische Live-Preconditions;
4. Ressourcenclaims und ggf. Fencing;
5. Action-Channel;
6. Budget;
7. Operator Policy;
8. durable Transaction Intent;
9. serverseitiges Ergebnis als Evidence;
10. Postcondition/Reconciliation fuer Commit.

Keine einzelne Schicht darf die anderen ersetzen.

## R2-Grenze

R2 ratifiziert diese Strategien. Technische Guards, Simulator, Persistenzports, Scheduler und Execution entstehen erst in ihren Roadmap-Phasen.
