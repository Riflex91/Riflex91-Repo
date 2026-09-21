# ADR-037 – PR20.2d Real-Browser-Bank-Shadow ohne Gameplay-Write

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2c hat die persistente accountweite Bank-Lease, Restart-
Reconciliation und einen vollstaendigen No-Write-R9-Admission-Shadow
eingefuehrt. Vor einem echten `bank_deposit(1)` fehlt noch reale
Browser-Evidence dafuer, dass Lease, Mount-/Session-Bindung, External Fence,
lokaler `bank`-Action-Channel, Socket-Budget und R9-Admission auch gegen den
echten Adventure-Land-Client zusammenpassen.

Der offizielle Server setzt bei erfolgreichem Bank-Mount innerhalb derselben
Transaktion `owner.server` und `owner.mounted_to` auf Server und
Character. Ein bereits vorher vorhandener lokaler Bankzustand ist deshalb
keine ausreichende Evidence dafuer, dass der Mount nach lokaler Lease-Vergabe
stattgefunden hat.

## Entscheidung

Der Real-Browser-Shadow startet zwingend ausserhalb der Bank.

Ablauf:

1. V5 prueft Host, Current-Fence und offene persistente Bank-Leases.
2. V5 erwirbt die accountweite Bank-Lease im Zustand `ACQUIRING`.
3. Der Operator betritt die Bank manuell.
4. Der Runner beobachtet read-only einen stabilen Uebergang
   `bankGemountet=false -> true` bei identischer Account-, Character-,
   Session- und Serverbindung.
5. Erst diese Post-Lease-Mount-Evidence wird als positive External-Fence-
   Evidence fuer denselben Lease-Owner akzeptiert.
6. Die kurzlebige Bank-Deposit-One-Shot-Authority wird ausgestellt.
7. Der normale R9-Admission-Pfad prueft Lease, Fence, lokalen
   `bank`-Action-Channel, Socket-Budget, durable Intent und frische
   Browser-Evidence.
8. Es existiert kein Adapter und kein Send. Das Journal endet terminal mit
   `ABBRUCH` und `send_boundary_state=NICHT_GESENDET`.
9. Der Operator verlaesst die Bank manuell.
10. Erst nach beobachtetem stabilem Bank-Exit wird die Lease freigegeben.

Der Runner verifiziert zusaetzlich, dass der reale lokale Git-Head exakt dem
per `--source-sha` angegebenen, zuvor CI-geprueften Commit entspricht.

## Alternativen

- Bereits gemounteten Bankzustand als positive Fence-Evidence verwenden:
  verworfen, weil der Mount zeitlich vor der lokalen Lease liegen koennte.
- Den Bank-Mount selbst durch V5 ausloesen: verworfen fuer PR20.2d, weil der
  Shadow weiterhin exakt null Bot-Gameplay-Writes nachweisen soll.
- `character.bank` allein als generische dauerhafte Bankauthority behandeln:
  verworfen; die Account-/Server-Mount-Semantik bleibt die externe Wahrheit.
- Direkt einen `bank_deposit`-Adapter anbinden: verworfen, solange reale
  Zero-Write-Shadow-Evidence nicht bestanden und im Repo dokumentiert ist.
- Mount-/Exit-Timeout automatisch wiederholen: verworfen. Unklare Bank-
  Ownership bleibt Recovery/Reconciliation und erzeugt keinen Blind-Retry.

## Konsequenzen

- Der Shadow benoetigt eine kurze manuelle Interaktion des Operators, obwohl
  der spaetere Produktivpfad autonom sein soll.
- Browserbeobachtung bleibt read-only.
- Der Start muss ausserhalb der Bank erfolgen.
- Mount- und Exit-Phase sind bounded; die accountweite Shadow-Lease ist
  laenger als beide Beobachtungsfenster zusammen, damit sie nicht an der
  Release-Grenze auslaeuft.
- Session-, Character-, Account- oder Serverdrift blockiert fail-closed.
- Fehler vor eindeutigem Release hinterlassen eine persistierte
  `RECOVERY_PENDING`-Lease.
- Implementierte Shadow-Software allein oeffnet keinen Write-Gate.
- Erst ein realer Bericht mit `status=BESTANDEN` darf den naechsten
  Vorbereitungsschritt freigeben.

## Invarianten

- realer Git-Head entspricht exakt `--source-sha`;
- Start: `bankGemountet=false`;
- lokale Bank-Lease wird vor manuellem Mount erworben;
- positiver Mount nur als stabiler false->true-Uebergang;
- Account, Character, Session und Server bleiben identisch;
- One-Shot-Authority maximal eine Verwendung und maximal 2000 ms;
- durable Intent vor R9-Admission;
- lokaler `bank`-Action-Channel und Socket-Budget bleiben Pflicht;
- kein `bank_deposit(...)` im Runner;
- kein Socket-`emit` im Runner;
- kein `AusfuehrungsAdapter` im Runner;
- kein `AusfuehrungsKernel` im Runner;
- `browserGameplayWrites=0`;
- `gameplayWrites=0`;
- `adapterAufrufe=0`;
- Journalterminalart `ABBRUCH`;
- `send_boundary_state=NICHT_GESENDET`;
- `sameIntentRetry=false`;
- Lease-Release erst nach beobachtetem manuellem Bank-Exit;
- unklare Mount-/Exit-Lage => Recovery/Reconciliation, kein Retry.

## Migration

Nach gruener Exact-Head-CI wird der Operator den source-locked
Real-Browser-Shadow auf genau diesem Commit ausfuehren. Der Runner schreibt
den Bericht nach:

`runtime/canary/bank-deposit-real-shadow/latest.json`

Die reale Evidence wird danach separat ins Repo uebernommen und geprueft.
Erst nach diesem Evidence-Gate darf ein eigener PR fuer Write-Adapter und
Write-Live-Runner vorbereitet werden.

## Rollback

PR20.2d erzeugt selbst keine Gameplay-Wirkung. Code-Rollback ist daher
gameplay-neutral. Persistierte offene oder `RECOVERY_PENDING` Bank-Leases
duerfen bei Rollback jedoch nicht geloescht oder als frei interpretiert
werden; sie muessen zuerst ueber External-Fence-Evidence reconciliiert werden.
