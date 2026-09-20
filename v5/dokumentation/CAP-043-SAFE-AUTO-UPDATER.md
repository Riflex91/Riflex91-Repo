# CAP-043 – Safe Auto Updater

**Status:** IMPLEMENTIERT / CORE-NO-WRITE  
**Stand:** 2026-09-20  
**Basis-main:** `4e34c9b101d34b1e1f173a1aca89cfaee6d60e73`

## Ziel

CAP-043 implementiert den V5-nativen Sicherheitskern fuer Updates, ohne den historischen V3-Updater oder dessen Runtime-Monkey-Patching zu uebernehmen.

Historische Risiken:

- Reload waehrend Gefahr;
- false handshake;
- blindes Re-Apply nach unbekanntem Ergebnis;
- parallele Update-Stuerme.

## Implementierung

- `v5/grundlage/quelle/operations/safe-auto-updater.ts`
- `v5/grundlage/tests/r11-safe-auto-updater.test.mjs`

Der Core besitzt selbst keine Download-, Installations-, Windows-, Browser- oder Adventure-Land-API.

## Release Evidence

Ein Kandidat wird nur akzeptiert, wenn die Evidence exakt gebunden ist an:

- aktuelle Basis-Git-SHA;
- Candidate-Git-SHA;
- Bundle-SHA256;
- Dependency-Lock-SHA256;
- Laufzeitkonfigurations-SHA256;
- Release-Evidence-ID;
- Provenienz-Evidence-ID;
- Freshness-Fenster;
- `gameplayAutoritaet=false`;
- `rawWriteAutoritaet=false`.

Es gibt bewusst keine semantische Versionsheuristik. Die Identitaet ist exact-SHA-basiert.

## Quiesce

Vor einem Apply-Intent muss frische Quiesce-Evidence beweisen:

- Produktionsprozess gestoppt;
- keine aktive Gameplay-Authority;
- keine offenen Mutationen;
- keine offenen Transfers;
- keine Recovery-Pending-Arbeit;
- identische Baseline-Boot-Identitaet.

Bei Drift oder stale Evidence wird fail-closed blockiert.

## Durable Apply Intent

`bereiteApplyVor()` persistiert zuerst den Zustand `APPLY_AUSSTEHEND`.

Erst danach wird ein Adapter-Intent zurueckgegeben:

- `adapterOperation=RELEASE_AKTIVIEREN`;
- exakte Basis-SHA;
- exakte Candidate-SHA;
- exakter Bundle-Hash;
- Release-/Provenienz-Evidence;
- `durableIntentPersistiert=true`;
- `sameCandidateErneutAnwenden=false`;
- keine Execution-/Gameplay-/Raw-Write-Authority.

Ein externer Adapter darf den Intent nur unter seinen eigenen Host-/Operator-Grenzen ausfuehren. Diese Capability implementiert keinen Windows-Host-Adapter.

## Boot Handshake

Ein Apply gilt nicht durch erfolgreichen Adapter-Return als abgeschlossen.

`COMMITTED` verlangt einen neuen beobachteten V5-Boot mit:

- exakt erwarteter Candidate-SHA;
- `runtimeKennung=V5`;
- laufendem und bereitem Prozess;
- `gameplayAutoritaet=false`;
- `rawWriteAutoritaet=false`;
- neuer Boot-Identitaet;
- Startzeit nach dem persistenten Apply-Intent;
- frischer Handshake-Evidence.

Ein stiller Adapter-Erfolg mit alter Runtime oder falscher SHA ist kein Erfolg.

## Restart / UNKNOWN

Nichtterminale Updates werden nach Restart zu `RECOVERY_PENDING`.

Dabei bleibt der Vor-Restart-Zustand erhalten.

Besonders fuer `APPLY_AUSSTEHEND` gilt:

- kein erneutes Apply;
- `sameCandidateErneutAnwenden=false`;
- `automatischerRetry=false`;
- nur Candidate-Handshake, Rollback oder `FAILED_SAFE`.

Damit wird ein unbekannter Apply-Ausgang nicht durch Blind-Retry dupliziert.

## Rollback

Wenn der Candidate-Boot nicht sicher bestaetigt werden kann, kann ein persistenter Rollback-Intent erzeugt werden:

- `adapterOperation=RELEASE_ROLLBACK`;
- Ziel ist exakt die vorherige Basis-SHA;
- Intent wird vor externer Wirkung persistiert.

`ROLLED_BACK_SAFE` verlangt erneut einen frischen V5-Boot-Handshake auf exakt der Basis-SHA.

## Update-Sturm-Schutz

Der Ledger erlaubt hoechstens ein nichtterminales Update gleichzeitig.

Ein zweiter Kandidat wird mit `SAFE_UPDATE_BEREITS_AKTIV` blockiert.

## Tests

Abgedeckt sind insbesondere:

- Basis-SHA-Drift;
- stale Release Evidence;
- Quiesce mit offenen Transfers;
- durable Apply-Intent;
- erfolgreicher Candidate-Boot;
- falsche Candidate-SHA;
- alte Boot-Identitaet / false handshake;
- Restart nach Apply-Intent;
- kein Blind-Reapply;
- Rollback nach unbekanntem Apply-Ausgang;
- Restart vor Apply verlangt neuen Quiesce-Nachweis;
- parallele Updates;
- korrupte Persistenz.

## Safety-Grenze

Der Core ruft nicht direkt auf:

- Netzwerk-Fetch;
- Code-Upload/Reload;
- generische Host-Shell;
- Windows-Bridge;
- Adventure-Land-Public-Functions.

Diese Grenzen werden zusaetzlich durch R11-Static-Guards abgesichert.

CAP-042 / Windows Host Adapter bleibt unveraendert geparkt.
