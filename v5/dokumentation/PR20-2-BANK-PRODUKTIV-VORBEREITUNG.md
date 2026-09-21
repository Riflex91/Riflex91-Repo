# PR20.2 – Bank-Produktion: NO-WRITE-Vorbereitung

**Status:** BEREIT FUER PRODUKTIVIERUNG / NO-WRITE  
**Stand:** 2026-09-21  
**Vorausgehendes Gate:** `PR20.1_EQUIP_PRODUKTIONSNACHWEIS` – BESTANDEN  
**Basis-main:** `a962512557d08bacfc57022697b77bd26e314b45`

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

1. einen **einzigen** ersten Bank-Live-Kandidaten festlegen;
2. produktive Mutationsfaehigkeit und Single Owner ratifizieren;
3. eng begrenzte Authority + Admission implementieren;
4. Bank-Transaktionsjournal mit globalem/open-current Fence implementieren;
5. read-only Preflight bauen;
6. Unit/Replay/Fault/Restart/UNKNOWN-Tests;
7. Shadow;
8. erst danach exakt einen kontrollierten realen Bank-Write.

Die Auswahl des ersten Bank-Live-Kandidaten erfolgt erst nach Auswertung der Equip-Evidence und auf Basis eines geeigneten realen Bankzustands.
