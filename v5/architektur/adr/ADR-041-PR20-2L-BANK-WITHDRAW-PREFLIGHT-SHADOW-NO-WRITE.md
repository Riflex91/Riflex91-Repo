# ADR-041 – PR20.2l Bank Withdraw Preflight + Admission-Shadow NO-WRITE

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2k hat `bank_withdraw(1)` mit eigener default-off Capability,
durabler One-Shot-Authority und eigenem Current-Fence vorbereitet. Vor einem
spaeteren Write-Pfad muessen die reale Browserbeobachtung und die vollstaendige
Admission-Kette ohne Send getrennt nachweisbar sein.

Withdraw vergroessert Character-Gold und reduziert Bank-Gold. Deshalb ist
fuer den Kandidaten die entscheidende Quellbudget-Bedingung nach stabilem
Bank-Mount `bank.gold >= 1`, nicht `character.gold >= 1`.

## Entscheidung

PR20.2l fuegt ausschliesslich hinzu:

- einen read-only Browserbeobachter fuer Character-, Session-, Server-,
  Inventory-, Character-Gold- und Bank-Gold-Evidence;
- einen read-only Withdraw-Preflight;
- einen authority-gebundenen NO-WRITE Admission-Shadow;
- Runtime-Anbindung des Shadow-Cores an die aktuell gehaltene
  Withdraw-One-Shot-Authority.

Der Shadow durchlaeuft Bank-Lease, External Fence, leasegebundenen Snapshot,
lokalen FIFO-`bank`-Action-Channel, Socket-Budget, durable Intent und die
normale R9-Admission. Danach wird terminal `ABBRUCH` mit
`send_boundary_state=NICHT_GESENDET` geschrieben.

## Alternativen

- Deposit-Preflight unveraendert wiederverwenden: verworfen, weil dessen
  Quellbudget `character.gold >= 1` fuer Withdraw fachlich falsch ist.
- Den Shadow erst zusammen mit dem Write-Adapter einfuehren: verworfen, weil
  Admission und Send-Grenze getrennt beweisbar bleiben muessen.
- Preflight bereits eine Authority ausstellen lassen: verworfen; Preflight ist
  reine Beobachtung und darf keinerlei Mutationserlaubnis erzeugen.
- Direkt eine Real-Browser-Shadow-Evidence in diesem PR verlangen: verworfen,
  weil Implementierung/CI und source-locked Browser-Evidence getrennte Gates
  bleiben.

## Konsequenzen

Ein spaeterer Withdraw-Write kann auf denselben Sicherheitsbausteinen
aufbauen, ohne die Deposit-Action oder deren Current-Pointer zu verwenden.
Der Preflight kann eine reale Bankbeobachtung als bereit/blockiert einstufen,
ohne Lease oder Authority auszustellen. Der Shadow kann die komplette
Admission-Kette inklusive durablem Intent beweisen, ohne einen Adapter zu
besitzen.

## Invarianten

- Browserbeobachtung ist read-only;
- Browser-Gameplay-Writes im Preflight: 0;
- Preflight stellt keine Authority und keine Lease aus;
- stabiler Bank-Mount ist erforderlich;
- `bank.gold >= 1` ist fuer Withdraw erforderlich;
- Character-/Session-/Serverbindung darf nicht driften;
- Alternative V3/V4 Runtime blockiert fail-closed;
- Shadow verwendet exakt `AL-ACTION-BANK-WITHDRAW`,
  `AL-RECOVERY-BANK-WITHDRAW` und `AL-VERIFIER-BANK-WITHDRAW`;
- Shadow verwendet den FIFO-Kanal `bank`;
- durable Intent liegt vor Admission;
- Shadow endet `NICHT_GESENDET` und terminal `ABBRUCH`;
- Same-Intent-Retry bleibt `false`;
- kein `bank_withdraw(...)`-Aufruf;
- kein Raw-Socket-`.emit(...)`;
- kein Write-Adapter und kein Live-Runner;
- exakt 0 neue Gameplay-Writes.

## Migration

Nach gruener Exact-Head-CI wird in einem eigenen Schritt ein source-locked
Real-Browser-Shadow fuer Withdraw ausgefuehrt. Dieser muss manuellen stabilen
Mount und Exit, Lease-Release, 0 Gameplay-Writes und
`NICHT_GESENDET` als Repo-Evidence belegen.

Erst danach darf ein separater Write-Adapter/Live-Runner-Gate vorbereitet
werden.

## Rollback

Browserbeobachter, Preflight, Shadow-Core und Runtime-Anbindung koennen
gemeinsam entfernt werden. Da weder Preflight noch Shadow einen Adventure-
Land-Send ausfuehren, entsteht kein Spielzustand, der zurueckgerollt werden
muesste.

Die in PR20.2k eingefuehrte Capability, Authority und der Current-Fence
bleiben beim Rollback dieses Schritts unveraendert.
