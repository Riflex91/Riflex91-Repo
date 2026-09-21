# PR20.2 – Bank-Produktion: NO-WRITE-Vorbereitung

**Status:** BEREIT FUER PRODUKTIVIERUNG / NO-WRITE  
**Stand:** 2026-09-21  
**Vorausgehendes Gate:** `PR20.1_EQUIP_PRODUKTIONSNACHWEIS` – BESTANDEN  
**Basis-main:** `3f88e904cb2a7fd20b69a5e7c552eb0958b66884`

## Zweck

Diese Vorbereitung reduziert die Wartezeit nach dem realen Equip-Test, ohne die Sicherheitsreihenfolge der Post-R19-Roadmap zu verletzen.

Sie oeffnet **keine** Bank-Gameplay-Authority und registriert **keine** produktive Bank-Mutationsfaehigkeit. Es gibt in dieser Vorbereitung:

- keinen Bank-Live-Runner;
- keinen Bank-Mutationsadapter;
- keinen direkten Aufruf von `bank_deposit`, `bank_withdraw`, `bank_store`, `bank_retrieve` oder `bank_swap`;
- keinen produktiven Aktivierungspfad;
- keinen Browser-Gameplay-Write;
- keine Aenderung am bestehenden Equip-Produktionspfad.

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

Dieser Schritt besitzt weiterhin **keine** produktive Mutations-Capability,
keine Authority, keinen Adapter und keinen Live-Runner.

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

## Noch bewusst nicht implementiert

Bis zum bestandenen PR20.1 waren verboten; sie sind auch jetzt erst nach ihrer jeweiligen Implementierung, CI und Preflight-Freigabe zulaessig:

- eine produktive `merchant.bank.*`-MUTIEREN-Capability;
- eine Bank-One-Shot- oder dauerhafte Mutation-Authority;
- ein Bank-CDP-Write-Adapter;
- ein Bank-Live-Runner;
- eine Registrierung der Bankmutationen in der Produktionskomposition;
- ein echter Bank-Write.

## Arbeit direkt nach bestandenem Equip-Nachweis

Wenn PR20.1 gruen ist, kann ohne erneute Grundlagenanalyse direkt begonnen werden mit:

1. **ERLEDIGT:** `bank_deposit(1)` als ersten Live-Kandidaten ratifizieren;
2. **ERLEDIGT:** authority-freien Settlement-/Drift-Core mit Tests bereitstellen;
3. produktive Mutationsfaehigkeit und Single Owner ratifizieren;
4. eng begrenzte Authority + Admission implementieren;
5. Bank-Transaktionsjournal mit globalem/open-current Fence implementieren;
6. read-only Preflight bauen;
7. Unit/Replay/Fault/Restart/UNKNOWN-Tests;
8. Shadow;
9. erst danach exakt einen kontrollierten `bank_deposit(1)`-Write.

Withdraw, Store, Retrieve, Swap und `open_bank_pack` bleiben bis nach dem separat nachgewiesenen ersten Deposit-Pfad produktiv gesperrt.
