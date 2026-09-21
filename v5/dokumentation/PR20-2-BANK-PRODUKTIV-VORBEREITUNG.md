# PR20.2 – Bank-Produktion: One-Shot-Grenze / NO-WRITE

**Status:** DEPOSIT-ONE-SHOT LIVE BESTANDEN / RESTBANK AUSSTEHEND  
**Stand:** 2026-09-21  
**Vorausgehendes Gate:** `PR20.1_EQUIP_PRODUKTIONSNACHWEIS` – BESTANDEN  
**Basis-main:** `05b93ac7dbb6ef294294c38030d9e4b48962f7d3`

## Zweck

Diese Vorbereitung reduziert die Wartezeit nach dem realen Equip-Test, ohne die Sicherheitsreihenfolge der Post-R19-Roadmap zu verletzen.

PR20.2b registriert inzwischen genau **eine** produktive Bank-Mutationsfaehigkeit
default-off: `merchant.bank.gold_einlagern` unter dem separaten Single Owner
`merchant-bank-core@1`. Eine eng benannte One-Shot-Authority kann durable
ausgestellt werden, erzeugt fuer sich allein aber keinen Gameplay-Write.

Weiterhin gibt es:

- keinen Bank-Live-Runner;
- keinen Bank-Mutations-/CDP-Write-Adapter;
- keinen direkten produktiven Aufruf von `bank_deposit`,
  `bank_withdraw`, `bank_store`, `bank_retrieve` oder `bank_swap`;
- keinen generischen produktiven MUTIEREN-Aktivierungspfad;
- keinen Browser-Gameplay-Write;
- keine Aufweichung des bestehenden Equip-Produktionspfads.

Der maschinenlesbare Vertrag liegt unter:

`grundlage/vertraege/runtime/bank-production-preparation.json`.

Der erste Live-Kandidat ist inzwischen **ohne Write-Authority** festgelegt:
`bank_deposit(1)`. Der enge Vertrag liegt unter
`grundlage/vertraege/runtime/bank-deposit-production-candidate.json`, der
authority-freie Settlement-Core unter
`grundlage/quelle/merchant/bank-deposit-settlement.ts`.

## Bereits belastbare Grundlagen

PR20.2 kann auf bereits abgeschlossenen V5-Grenzen aufbauen:

- R9 bindet die Bank-Actions an Action-, Recovery- und Verifier-Vertraege;
- die verifizierten Action Contracts klassifizieren die vorgesehenen Bankaktionen als `NON_IDEMPOTENT`;
- nach moeglichem Send gilt `RECONCILE_NO_BLIND_RETRY`;
- der Banktransport nutzt den gemeinsamen FIFO-Kanal `bank`;
- Bankmutationen benoetigen accountweite Bank-Lease, Character-/Inventory-Evidence und Socket-Budget;
- R13 besitzt die accountweite `BankLeaseKoordinator`-Grenze;
- eine Mutation braucht zusaetzlich einen lokalen `bank`-Action-Channel mit gueltigem Fencing;
- ein External-Fence-Konflikt quarantiniert statt zu forcieren;
- Bank-Snapshots sind an Owner und Lease-Epoche gebunden;
- Restart importiert nichtterminale Bank-Leases als `RECOVERY_PENDING`;
- eine Lease wird erst nach terminalem Settlement und beobachtetem Bank-Exit freigegeben;
- der produktive Bank-PLANEN-Canary ist bereits read-only bestanden.

## Vorbereiteter erster Mutationssatz

Nach bestandenem PR20.1 koennen folgende vorhandene, bereits R9-gebundene Actions einzeln produktiviert werden:

| Fachfunktion | Action | Recovery | Verifier |
|---|---|---|---|
| Gold einlagern | `AL-ACTION-BANK-DEPOSIT` | `AL-RECOVERY-BANK-DEPOSIT` | `AL-VERIFIER-BANK-DEPOSIT` |
| Gold auslagern | `AL-ACTION-BANK-WITHDRAW` | `AL-RECOVERY-BANK-WITHDRAW` | `AL-VERIFIER-BANK-WITHDRAW` |
| Item einlagern | `AL-ACTION-BANK-STORE` | `AL-RECOVERY-BANK-STORE` | `AL-VERIFIER-BANK-STORE` |
| Item auslagern | `AL-ACTION-BANK-RETRIEVE` | `AL-RECOVERY-BANK-RETRIEVE` | `AL-VERIFIER-BANK-RETRIEVE` |
| Bank intern bewegen/konsolidieren | `AL-ACTION-BANK-SWAP` | `AL-RECOVERY-BANK-SWAP` | `AL-VERIFIER-BANK-SWAP` |

`open_bank_pack` bleibt fuer den ersten Satz absichtlich draussen. Die Action besitzt Capacity-/Currency-Wirkung und einen asynchronen Backend-Pfad und bekommt deshalb spaeter einen eigenen kontrollierten Nachweis.

## Erster kontrollierter Live-Kandidat

Als erster Bank-Mutationspfad ist exakt **1 Gold einzahlen** ratifiziert.
Der offizielle Client sendet `bank_deposit(gold)` ueber den FIFO-Kanal
`bank`. Der verifizierte Serverhandler begrenzt den Betrag auf vorhandenes
Character-Gold und verschiebt ihn atomar zwischen `character.gold` und
`bank.gold`.

Der spätere COMMIT darf deshalb nur entstehen, wenn dieselbe Character-,
Session-, Server-, Lease- und Mount-Bindung frisch beobachtet wird, ein neuer
Fingerprint vorliegt und gleichzeitig exakt `character.gold - 1` sowie
`bank.gold + 1` nachgewiesen sind. Nur Senderverlust oder nur Bankzuwachs
reichen nicht. Same-Intent-Retry bleibt immer verboten.

Die Capability und die kurzlebige One-Shot-Authority sind inzwischen
implementiert. Die Capability bleibt `standardAktiv=false`; die Authority ist
maximal 2000 ms gueltig und genau einmal verbrauchbar. Weiterhin fehlen bewusst
Write-Adapter und Live-Runner.

## PR20.2j – naechster Kandidat bank_withdraw(1) NO-WRITE

Nach dem bestandenen Deposit-One-Shot ist exakt `bank_withdraw(1)` als
naechster enger Kandidat ratifiziert. Withdraw ist gegenueber Store der
kleinere naechste Schritt, weil die fachliche Wirkung weiterhin nur die beiden
Gold-Domaenen umfasst und kein Item-, Stack- oder Zielslot-Mapping benoetigt.

Neu vorhanden sind ausschliesslich:

- authority-freier Settlement-/Drift-Core
  `grundlage/quelle/merchant/bank-withdraw-settlement.ts`;
- maschinenlesbarer Kandidatenvertrag
  `grundlage/vertraege/runtime/bank-withdraw-production-candidate.json`;
- automatische Tests fuer Bereitschaft, exaktes Delta, stale Evidence und
  Session-/Server-/Lease-/Mount-Drift;
- ADR-039 als explizite NO-WRITE-Ratifizierung.

Ein spaeteres COMMIT ist nur modelliert, wenn dieselbe Bindung frisch und mit
neuem Fingerprint beobachtet wird und gleichzeitig exakt
`character.gold + 1` sowie `bank.gold - 1` gilt. Einseitige Deltas oder
stale Evidence sind kein Erfolg.

In PR20.2j bewusst **nicht** vorhanden:

- keine Capability `merchant.bank.gold_auslagern`;
- keine Withdraw-One-Shot-Authority;
- kein Withdraw-Current-Fence;
- kein Write-Adapter;
- kein Live-Runner;
- kein direkter produktiver `bank_withdraw`-Aufruf;
- keine Gameplay-/Raw-Write-Authority;
- exakt 0 Gameplay-Writes.

Der naechste Schritt darf erst nach gruener Exact-Head-CI die default-off
Capability, eine eigene kurzlebige One-Shot-Authority und einen durable
Current-Fence vorbereiten. Auch dieser Folgeschritt bleibt zunaechst NO-WRITE.

## PR20.2k – Withdraw Capability Authority und Current-Fence NO-WRITE

Aufbauend auf PR20.2j ist `bank_withdraw(1)` jetzt bis zur lokalen
Authority-/Persistenzgrenze vorbereitet:

- eigene default-off MUTIEREN-Capability
  `merchant.bank.gold_auslagern` unter `merchant-bank-core@1`;
- eigene durable One-Shot-Authority mit maximal einer Verwendung und maximal
  2000 ms Lebensdauer;
- Authority-Audit unter
  `runtime/authority/mutieren/bank-withdraw/`;
- eigener Current-Fence unter
  `runtime/transactions/bank-withdraw/current.json`;
- gegenseitige Ausschliessung gegen offene Equip-, Deposit- und
  Withdraw-Authorities;
- Bankstart wird sowohl durch offene Deposit- als auch Withdraw-Current-Fences
  sowie durch die accountweite Bank-Lease blockiert.

Die Capability bleibt `standardAktiv=false`. Registrierung und
Authority-Ausstellung aktivieren die Capability nicht und erzeugen keinen
Gameplay-, Raw-Write- oder generischen Action-Bypass.

Weiterhin bewusst **nicht** vorhanden:

- kein Withdraw-Write-Adapter;
- kein Withdraw-Live-Runner;
- kein direkter produktiver `bank_withdraw(...)`-Aufruf;
- kein Raw-Socket-`.emit(...)`;
- kein echter Withdraw-Gameplay-Write;
- noch kein read-only Withdraw-Preflight;
- noch kein Withdraw-Admission-Shadow.

Der naechste Gate ist deshalb ein separater read-only Preflight plus
NO-WRITE Admission-Shadow mit Bank-Lease/Fencing. Erst dessen Evidence darf
einen spaeteren Write-Adapter/Live-Runner-Gate vorbereiten.

## Admission-Grenze fuer die spaetere Implementierung

Unmittelbar vor jedem moeglichen Bank-Send muessen mindestens erneut bewiesen sein:

1. produktiver Host und globale Freigabe sind gueltig;
2. NOTHALT und Capability-Deny sperren nicht;
3. V3/V4 laufen nicht alternativ;
4. exakt eine aktive accountweite Bank-Lease gehoert dem ausfuehrenden Character;
5. Lease-Epoche, Ressourcen-Fencing und lokaler `bank`-Action-Channel stimmen;
6. das externe Bank-Fence bestaetigt denselben mounted Character, Server und keinen Konflikt;
7. ein frischer Bank-Snapshot stimmt mit Account, Owner und Lease-Epoche ueberein;
8. Character-, Bank- und Inventory-Evidence ist frisch;
9. keine alte offene gleichartige Banktransaktion existiert;
10. fuer den konkreten Delta ist Workspace/Capacity vorhanden;
11. Socket-Budget ist reserviert;
12. der exakte Transaction Intent wurde **vor Send durable bestaetigt**.

Ein Plan oder alter Snapshot allein darf niemals diese Admission ersetzen.

## Send-/Recovery-Regeln

Fuer den ersten Mutationssatz gilt vorbereitet:

- maximal eine In-Flight-Bankaktion auf dem FIFO-Kanal `bank`;
- kein Same-Intent-Retry;
- Disconnect, `limitdc`, Adapterausnahme oder unklare Antwort nach moeglichem Send => `UNKNOWN`;
- bei `UNKNOWN`: erst Character/Bank/Inventory frisch beobachten und fachlich reconciliieren;
- die Bank-Lease bleibt bis zum terminalen Settlement gehalten;
- Restart mit nichtterminaler Lease => `RECOVERY_PENDING`;
- erst ein positiver fachlicher Delta-Beweis erlaubt COMMIT;
- widerspruechliche oder unzureichende Evidence endet fail-closed bzw. operator-required.

## PR20.2b bereits implementiert

- separater Single Owner `merchant-bank-core@1`;
- exakt eine default-off MUTIEREN-Capability
  `merchant.bank.gold_einlagern`;
- exakt gebundene One-Shot-Authority mit maximal einer Verwendung;
- durable Authority-Evidence vor Ausstellung;
- separates Bank-Deposit-Journal mit globalem Current-Fence;
- read-only Browserbeobachtung mit realen Character-/Bank-Gold-Baselines;
- read-only Preflight mit `browserGameplayWrites=0` und ohne
  Authority-/Lease-Ausstellung.

## PR20.2c zusaetzlich implementiert

- persistenter accountweiter Bank-Lease-Controller;
- durable Lease-Metadaten unter `runtime/bank/lease-state-v1.json`;
- keine Persistenz/Rehydrierung von Ressourcen- oder Fencing-Tokens;
- Restart nichtterminaler Leases => `RECOVERY_PENDING`;
- terminale Epochen-Floors bleiben ueber wiederholte Restarts erhalten;
- Node-Host blockiert Bank-Start bei offener/recovery-pending Lease;
- expliziter positiver/negativer External-Fence-Restart-Abgleich;
- No-Write-Shadow bindet Lease, External Fence, leasegebundenen Snapshot,
  lokalen `bank`-Action-Channel, Socket-Budget, durable Intent und normalen
  R9-Admission-Kernel;
- Shadow endet terminal mit `NICHT_GESENDET`, `gameplayWrites=0` und
  `adapterAufrufe=0`.

## Reale F5-/Restart-Recovery-Evidence

Ein echter Browser-Reload waehrend des Real-Browser-Shadows wurde fail-closed
behandelt. Es entstand keine offene Bank-Transaktion und kein Real-Shadow-
Report, die bereits erworbene Lease Epoche 1 wurde jedoch durable als
`RECOVERY_PENDING` erhalten.

Mit dem source-locked Recovery-Runner wurde danach ein manueller
Bank-Mount->Exit-Uebergang derselben Bindung beobachtet und exakt diese Lease
von `RECOVERY_PENDING` auf `RELEASED` reconciliiert.

Der reale Bericht belegt:

- `browserGameplayWrites=0`;
- `gameplayWrites=0`;
- `adapterAufrufe=0`;
- keine One-Shot-Authority;
- kein `bank_deposit`;
- `sameIntentRetry=false`;
- keine offene Transaktion vor oder nach Recovery;
- keine breite Runtime-Freigabe und kein Raw-Write-Bypass.

Repo-Evidence:
`roadmap/pr20-2-bank-shadow-recovery-evidence.json`.

Diese Evidence beweist den echten Restart-/Recovery-Faultpfad, **nicht** den
vollstaendig bestandenen normalen Real-Browser-Shadow. Der Write-Gate bleibt
deshalb geschlossen.

## Reale Real-Browser-Shadow-Evidence

Der normale source-locked Real-Browser-Shadow wurde auf
`9ed665692e71ee8ae131e7399db2306ff9e4a627` vollstaendig bestanden.

Nachgewiesen wurden:

- Start ausserhalb der Bank;
- lokale Lease vor dem manuellen Mount;
- stabiler manueller Mount bei identischer Account-/Character-/Session-/
  Serverbindung;
- produktive One-Shot-Authority nur fuer die R9-Admission;
- durable Intent;
- lokaler `bank`-Action-Channel und Socket-Budget;
- Admission `ADMISSION_BESTANDEN_KEIN_SEND`;
- Journalterminalart `ABBRUCH`;
- `sendBoundaryState=NICHT_GESENDET`;
- manueller stabiler Bank-Exit;
- Lease Epoche 2 terminal `RELEASED`;
- Bank-Start nachher wieder bereit;
- `browserGameplayWrites=0`;
- `hostGameplayWrites=0`;
- `gameplayWrites=0`;
- `adapterAufrufe=0`;
- keine offene Bank-Deposit-One-Shot-Authority nach dem Lauf;
- keine breite Runtime-Freigabe und kein Raw-Write-Bypass;
- `sameIntentRetry=false`.

Evidence:
`roadmap/pr20-2-bank-real-browser-shadow-evidence.json`.

Damit ist der No-Write-Shadow-Gate bestanden. Dies erlaubt **nur** die
separate Implementierung und CI-Pruefung eines engen Write-Adapters und
Live-Runners fuer exakt `bank_deposit(1)`; ein echter Write ist damit noch
nicht ausgefuehrt oder automatisch freigegeben.

## Noch bewusst nicht implementiert

- Bank-CDP-/Write-Adapter fuer exakt `bank_deposit(1)`;
- Bank-Live-Runner fuer exakt `bank_deposit(1)`;
- Bank-Live-Runner;
- irgendein echter Bank-Write;
- Withdraw/Store/Retrieve/Swap/Open-Pack-Produktivpfade.

## Arbeit direkt nach bestandenem Equip-Nachweis

Wenn PR20.1 gruen ist, kann ohne erneute Grundlagenanalyse direkt begonnen werden mit:

1. **ERLEDIGT:** `bank_deposit(1)` als ersten Live-Kandidaten ratifizieren;
2. **ERLEDIGT:** authority-freien Settlement-/Drift-Core mit Tests bereitstellen;
3. **ERLEDIGT:** produktive Mutationsfaehigkeit und Single Owner ratifizieren;
4. **ERLEDIGT:** eng begrenzte One-Shot-Authority + Admission-Gate implementieren;
5. **ERLEDIGT:** Bank-Transaktionsjournal mit globalem/open-current Fence implementieren;
6. **ERLEDIGT:** read-only Preflight bauen;
7. **ERLEDIGT:** persistente Bank-Lease, Restart-Reconciliation und Fault-Tests;
8. **ERLEDIGT:** No-Write-R9-Admission-Shadow;
9. **ERLEDIGT:** echten F5-/Restart-Fault zero-write reconciliieren und dokumentieren;
10. **ERLEDIGT:** normalen Real-Browser-Shadow ohne Write vollstaendig bis BESTANDEN ausfuehren;
11. **ERLEDIGT:** Write-Adapter/Live-Runner fuer exakt `bank_deposit(1)` implementieren und komplett CI-gruen pruefen;
12. **ERLEDIGT:** read-only Write-Preflight auf exakt dem geprueften Head ausfuehren;
13. **ERLEDIGT:** exakt einen kontrollierten `bank_deposit(1)`-Write mit COMMIT/BESTAETIGT/1 Write nachweisen;
14. **NAECHSTES GATE:** Withdraw/Store/Retrieve/Swap jeweils separat vorbereiten und produktiv nachweisen;
15. danach 5m-Bank-Funktionsevidence fuer die freigegebenen Bankpfade.

Withdraw, Store, Retrieve, Swap und `open_bank_pack` bleiben bis nach dem separat nachgewiesenen ersten Deposit-Pfad produktiv gesperrt.
