# ADR-038 – PR20.2h exakt ein produktiver bank_deposit(1)-Write-Pfad

**Status:** RATIFIZIERT  
**Datum:** 2026-09-21

## Kontext

PR20.2a bis PR20.2g haben den ersten Bank-Live-Kandidaten
`bank_deposit(1)`, Settlement, One-Shot-Authority, Current-Fence,
persistente accountweite Bank-Lease, Restart-Reconciliation, No-Write-R9-
Admission, einen echten F5-/Recovery-Fault und den normalen Real-Browser-
Shadow erfolgreich nachgewiesen.

Der naechste Schritt darf deshalb erstmals einen write-faehigen Adapter und
Live-Runner einfuehren. Diese Implementierung ist jedoch noch **keine**
Live-Evidence und darf keinen Bank-Write automatisch ausfuehren.

## Entscheidung

Der einzige in PR20.2h zulaessige produktive Bank-Write ist exakt:

`bank_deposit(1)`

Der Public-Function-Aufruf darf nur in
`werkzeuge/bank-deposit-produktions-write-browser.mjs` existieren und dort
statisch exakt einmal vorkommen. Direkte Socket-`emit`-Aufrufe sowie
Withdraw/Store/Retrieve/Swap/Open-Pack sind verboten.

Der Ablauf lautet:

1. Start ausserhalb der Bank und ohne offene Bank-Transaktion/Lease.
2. Accountweite Bank-Lease wird durable vor dem manuellen Mount erworben.
3. Operator betritt die Bank manuell.
4. Account, Character, Session, Server und Bank-Mount werden frisch gebunden.
5. Character-Gold, Bank-Gold und Prestate-Fingerprint werden gepinnt.
6. Kurzlebige One-Shot-Authority wird fuer exakt diese Transaktion erteilt.
7. Character-Gold-Ressource, lokaler `bank`-Action-Channel und Socket-Budget
   werden exklusiv gebunden.
8. Durable Transaction-Intent wird vor jeder Spielwirkung geschrieben.
9. Der normale R9-Admission-Pfad erteilt die typisierte Ausfuehrungsfreigabe.
10. Der Ausfuehrungsadapter darf maximal einmal `bank_deposit(1)` aufrufen.
11. Recovery beobachtet den Zustand erneut; COMMIT ist nur bei exakt
    Character-Gold -1 und Bank-Gold +1 derselben Bindung mit neuem Fingerprint
    erlaubt.
12. Nach moeglichem Send wird derselbe Intent niemals erneut gesendet.
13. Operator verlaesst die Bank manuell; Lease wird erst nach beobachtetem
    Exit freigegeben.

## Alternativen

- Direktes Socket-`emit("bank", ...)`: verworfen; nur der verifizierte
  offizielle Public-Function-Wrapper darf die Transportgrenze bilden.
- Mehr als 1 Gold fuer den ersten Live-Write: verworfen; der erste reale
  Mutationsnachweis bleibt minimal.
- Automatischer zweiter Send nach Timeout/Disconnect: verworfen; moeglicher
  Commit wird ausschliesslich durch frische Zustandsbeobachtung reconciliiert.
- Write im bestehenden read-only Browser-Observer: verworfen; Read-/Write-
  Grenzen bleiben als getrennte Dateien statisch auditierbar.
- Automatische Ausfuehrung nach CI: verworfen; Live bleibt ein separates,
  explizit bestaetigtes Operator-Gate.

## Konsequenzen

- PR20.2h enthaelt erstmals write-faehigen Bank-Code.
- Der Adapter darf maximal einen Gameplay-Write pro Lauf erzeugen.
- Ein Fehler vor dem Public-Function-Aufruf bleibt `NICHT_GESENDET`.
- Ein CDP-/Transportfehler nach moeglichem Send wird `UNBEKANNT`.
- `UNBEKANNT` kann nur durch exaktes -1/+1-Gold-Settlement zum COMMIT
  werden; ohne Beweis endet die Transaktion fail-closed/operator-required.
- Persistente Transaction-/Lease-Evidence bleibt die Wiederanlauf-Wahrheit.
- Die Implementierung allein setzt den Live-Evidence-Status nicht auf
  bestanden.

## Invarianten

- Betrag exakt 1 Gold;
- exakt eine produktive Capability `merchant.bank.gold_einlagern`;
- exakt `AL-ACTION-BANK-DEPOSIT` /
  `AL-RECOVERY-BANK-DEPOSIT` /
  `AL-VERIFIER-BANK-DEPOSIT`;
- maximal eine One-Shot-Authority-Verwendung;
- maximal ein Adapter-Aufruf;
- maximal ein `bank_deposit(1)`-Gameplay-Write;
- kein direkter Socket-`emit`;
- keine fremde Bankmutation;
- durable Intent vor Send;
- accountweite Bank-Lease vor Mount;
- Character-Gold exklusiv gefenced;
- lokaler `bank`-Action-Channel und Socket-Budget Pflicht;
- frischer External Fence und gepinnter Prestate Pflicht;
- COMMIT nur bei exakt -1 Character-Gold / +1 Bank-Gold;
- `sameIntentRetry=false`;
- moeglicher Send wird niemals blind wiederholt;
- Lease-Release erst nach beobachtetem Bank-Exit;
- Source-SHA des Live-Runners muss exakt dem lokalen Git-Head entsprechen;
- expliziter Bestaetigungstext:
  `V5 BANK DEPOSIT 1 GOLD EINMAL AUSFUEHREN`;
- PR20.2h fuehrt selbst keinen realen Live-Write aus.

## Migration

Nach komplett gruener Exact-Head-CI wird genau dieser gepruefte Head lokal
detached ausgecheckt. Zuerst wird der read-only Write-Preflight ausgefuehrt.

Erst wenn Preflight, Git-Head, Runtime-/Lease-/Current-Evidence und Merchant-
Zustand sauber sind, darf der Operator den Live-Runner genau einmal explizit
bestaetigen. Bei BLOCKIERT, UNKNOWN, Disconnect oder offener Evidence erfolgt
kein automatischer Retry.

Der Live-Bericht wird durable unter

`runtime/canary/bank-deposit-production/latest.json`

geschrieben.

## Rollback

Solange kein Live-Write ausgefuehrt wurde, ist Rollback gameplay-neutral.
Nach einem moeglichen Send duerfen Transaction-Current, Journal, Lease oder
Authority-Evidence nicht geloescht werden. Ein ungeklaerter Zustand muss ueber
Recovery/Reconciliation geschlossen werden, bevor ein neuer Intent entstehen
darf.
